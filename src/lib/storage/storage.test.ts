/**
 * Storage Module Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  getMimeType,
  getExtension,
  getImageMimeType,
  generateCaptureKey,
  generateBackgroundKey,
  generateMeshKey,
  parseStorageKey,
  sanitizeFilename,
  detectImageFormat,
} from './utils';
import { FilesystemStorageProvider } from './filesystem';
import {
  getStorage,
  setStorage,
  resetStorage,
  uploadCaptures,
  persistBackground,
  persistMesh,
} from './client';
import type { StorageProvider } from './types';

// ============================================================================
// Utils Tests
// ============================================================================

describe('utils', () => {
  describe('getMimeType', () => {
    it('should return correct MIME type for common extensions', () => {
      expect(getMimeType('png')).toBe('image/png');
      expect(getMimeType('jpg')).toBe('image/jpeg');
      expect(getMimeType('jpeg')).toBe('image/jpeg');
      expect(getMimeType('webp')).toBe('image/webp');
      expect(getMimeType('glb')).toBe('model/gltf-binary');
    });

    it('should handle extensions with leading dot', () => {
      expect(getMimeType('.png')).toBe('image/png');
      expect(getMimeType('.glb')).toBe('model/gltf-binary');
    });

    it('should handle uppercase extensions', () => {
      expect(getMimeType('PNG')).toBe('image/png');
      expect(getMimeType('GLB')).toBe('model/gltf-binary');
    });

    it('should return application/octet-stream for unknown extensions', () => {
      expect(getMimeType('xyz')).toBe('application/octet-stream');
    });
  });

  describe('getExtension', () => {
    it('should return correct extension for MIME types', () => {
      expect(getExtension('image/png')).toBe('png');
      expect(getExtension('image/jpeg')).toBe('jpg');
      expect(getExtension('image/webp')).toBe('webp');
      expect(getExtension('model/gltf-binary')).toBe('glb');
    });

    it('should return bin for unknown MIME types', () => {
      expect(getExtension('unknown/type')).toBe('bin');
    });
  });

  describe('getImageMimeType', () => {
    it('should return correct MIME type for image formats', () => {
      expect(getImageMimeType('png')).toBe('image/png');
      expect(getImageMimeType('jpeg')).toBe('image/jpeg');
      expect(getImageMimeType('webp')).toBe('image/webp');
    });
  });

  describe('generateCaptureKey', () => {
    it('should generate correct key for full resolution', () => {
      const key = generateCaptureKey('job123', 'full', 2048, 2048, 'png');
      expect(key).toBe('capture/job123/full-2048x2048.png');
    });

    it('should generate correct key for web resolution', () => {
      const key = generateCaptureKey('job123', 'web', 800, 800, 'webp');
      expect(key).toBe('capture/job123/web-800x800.webp');
    });

    it('should convert jpeg to jpg extension', () => {
      const key = generateCaptureKey('job123', 'thumb', 400, 400, 'jpeg');
      expect(key).toBe('capture/job123/thumb-400x400.jpg');
    });
  });

  describe('generateBackgroundKey', () => {
    it('should generate correct key with default format', () => {
      const key = generateBackgroundKey('job123');
      expect(key).toBe('background/job123/background.png');
    });

    it('should generate correct key with specified format', () => {
      const key = generateBackgroundKey('job123', 'webp');
      expect(key).toBe('background/job123/background.webp');
    });
  });

  describe('generateMeshKey', () => {
    it('should generate correct key with default format', () => {
      const key = generateMeshKey('job123');
      expect(key).toBe('mesh/job123/model.glb');
    });

    it('should generate correct key with specified format', () => {
      const key = generateMeshKey('job123', 'fbx');
      expect(key).toBe('mesh/job123/model.fbx');
    });
  });

  describe('parseStorageKey', () => {
    it('should parse valid capture key', () => {
      const result = parseStorageKey('capture/job123/full-2048x2048.png');
      expect(result).toEqual({
        assetType: 'capture',
        jobId: 'job123',
        filename: 'full-2048x2048.png',
      });
    });

    it('should parse valid background key', () => {
      const result = parseStorageKey('background/job123/background.png');
      expect(result).toEqual({
        assetType: 'background',
        jobId: 'job123',
        filename: 'background.png',
      });
    });

    it('should parse valid mesh key', () => {
      const result = parseStorageKey('mesh/job123/model.glb');
      expect(result).toEqual({
        assetType: 'mesh',
        jobId: 'job123',
        filename: 'model.glb',
      });
    });

    it('should return null for invalid key format', () => {
      expect(parseStorageKey('invalid')).toBeNull();
      expect(parseStorageKey('only/two')).toBeNull();
      expect(parseStorageKey('a/b/c/d')).toBeNull();
    });

    it('should return null for invalid asset type', () => {
      expect(parseStorageKey('invalid/job123/file.png')).toBeNull();
    });
  });

  describe('sanitizeFilename', () => {
    it('should replace invalid characters', () => {
      expect(sanitizeFilename('file<name>:test')).toBe('file_name__test');
    });

    it('should replace spaces with dashes', () => {
      expect(sanitizeFilename('hello world test')).toBe('hello-world-test');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('HelloWorld')).toBe('helloworld');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(150);
      expect(sanitizeFilename(longName).length).toBe(100);
    });
  });

  describe('detectImageFormat', () => {
    it('should detect PNG from URL', () => {
      expect(detectImageFormat('https://example.com/image.png')).toBe('png');
      expect(detectImageFormat('image/png')).toBe('png');
    });

    it('should detect WebP from URL', () => {
      expect(detectImageFormat('https://example.com/image.webp')).toBe('webp');
    });

    it('should detect JPEG from URL', () => {
      expect(detectImageFormat('https://example.com/image.jpg')).toBe('jpeg');
      expect(detectImageFormat('https://example.com/image.jpeg')).toBe('jpeg');
    });

    it('should default to PNG for unknown', () => {
      expect(detectImageFormat('https://example.com/image')).toBe('png');
    });
  });
});

// ============================================================================
// FilesystemStorageProvider Tests
// ============================================================================

describe('FilesystemStorageProvider', () => {
  const testBasePath = 'test-generated';
  let provider: FilesystemStorageProvider;

  beforeEach(() => {
    provider = new FilesystemStorageProvider({
      basePath: testBasePath,
      publicUrl: '/test-generated',
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(path.join(process.cwd(), testBasePath), { recursive: true, force: true });
    } catch {
      // Ignore if directory doesn't exist
    }
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('filesystem');
  });

  it('should generate correct URL', () => {
    const url = provider.getUrl('capture/job123/full-2048x2048.png');
    expect(url).toBe('/test-generated/capture/job123/full-2048x2048.png');
  });

  describe('upload', () => {
    it('should upload a blob and return correct result', async () => {
      const content = 'test content';
      const blob = new Blob([content], { type: 'text/plain' });

      const result = await provider.upload(blob, {
        key: 'test/file.txt',
        contentType: 'text/plain',
      });

      expect(result.key).toBe('test/file.txt');
      expect(result.url).toBe('/test-generated/test/file.txt');
      expect(result.size).toBe(content.length);
    });

    it('should create necessary directories', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      await provider.upload(blob, {
        key: 'deep/nested/path/file.txt',
        contentType: 'text/plain',
      });

      const exists = await provider.exists('deep/nested/path/file.txt');
      expect(exists).toBe(true);
    });

    it('should write metadata when provided', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });

      await provider.upload(blob, {
        key: 'test/with-meta.txt',
        contentType: 'text/plain',
        metadata: { custom: 'value' },
      });

      const metadataPath = path.join(
        process.cwd(),
        testBasePath,
        'test',
        'with-meta.txt.meta.json'
      );
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      expect(metadata.custom).toBe('value');
      expect(metadata.contentType).toBe('text/plain');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      await provider.upload(blob, { key: 'test/exists.txt', contentType: 'text/plain' });

      const exists = await provider.exists('test/exists.txt');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const exists = await provider.exists('does/not/exist.txt');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing file', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      await provider.upload(blob, { key: 'test/delete-me.txt', contentType: 'text/plain' });

      const deleted = await provider.delete('test/delete-me.txt');
      expect(deleted).toBe(true);

      const exists = await provider.exists('test/delete-me.txt');
      expect(exists).toBe(false);
    });

    it('should return false for non-existing file', async () => {
      const deleted = await provider.delete('does/not/exist.txt');
      expect(deleted).toBe(false);
    });
  });

  describe('download', () => {
    it('should download local file', async () => {
      const content = 'test download content';
      const blob = new Blob([content], { type: 'text/plain' });
      await provider.upload(blob, { key: 'test/download.txt', contentType: 'text/plain' });

      const downloaded = await provider.download('/test-generated/test/download.txt');
      const text = await downloaded.text();
      expect(text).toBe(content);
    });
  });
});

// ============================================================================
// Client Tests
// ============================================================================

describe('client', () => {
  let mockProvider: StorageProvider;

  beforeEach(() => {
    mockProvider = {
      name: 'mock',
      upload: vi.fn().mockResolvedValue({ key: 'test', url: '/test', size: 100 }),
      download: vi.fn().mockResolvedValue(new Blob(['test'])),
      delete: vi.fn().mockResolvedValue(true),
      exists: vi.fn().mockResolvedValue(true),
      getUrl: vi.fn().mockReturnValue('/test'),
    };
    resetStorage();
  });

  afterEach(() => {
    resetStorage();
  });

  describe('getStorage', () => {
    it('should return filesystem provider by default', () => {
      const storage = getStorage();
      expect(storage.name).toBe('filesystem');
    });

    it('should return same instance on subsequent calls', () => {
      const storage1 = getStorage();
      const storage2 = getStorage();
      expect(storage1).toBe(storage2);
    });
  });

  describe('setStorage', () => {
    it('should allow setting custom provider', () => {
      setStorage(mockProvider);
      const storage = getStorage();
      expect(storage.name).toBe('mock');
    });
  });

  describe('uploadCaptures', () => {
    it('should upload all capture sizes', async () => {
      setStorage(mockProvider);

      const mockCaptures = {
        full: {
          dataUrl: 'data:image/png;base64,abc',
          blob: new Blob(['full'], { type: 'image/png' }),
          width: 2048,
          height: 2048,
          format: 'png' as const,
        },
        web: {
          dataUrl: 'data:image/webp;base64,def',
          blob: new Blob(['web'], { type: 'image/webp' }),
          width: 800,
          height: 800,
          format: 'webp' as const,
        },
        thumb: {
          dataUrl: 'data:image/webp;base64,ghi',
          blob: new Blob(['thumb'], { type: 'image/webp' }),
          width: 400,
          height: 400,
          format: 'webp' as const,
        },
      };

      await uploadCaptures(mockCaptures, 'job123');

      expect(mockProvider.upload).toHaveBeenCalledTimes(3);
    });
  });

  describe('persistBackground', () => {
    beforeEach(() => {
      // Mock global fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['image data'], { type: 'image/png' })),
      } as Response);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should download and upload background image', async () => {
      setStorage(mockProvider);

      await persistBackground('https://example.com/bg.png', 'job123');

      expect(global.fetch).toHaveBeenCalledWith('https://example.com/bg.png');
      expect(mockProvider.upload).toHaveBeenCalled();
    });
  });

  describe('persistMesh', () => {
    beforeEach(() => {
      vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['mesh data'], { type: 'model/gltf-binary' })),
      } as Response);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should download and upload mesh file', async () => {
      setStorage(mockProvider);

      await persistMesh('https://meshy.cdn/model.glb', 'job123', 'glb');

      expect(global.fetch).toHaveBeenCalledWith('https://meshy.cdn/model.glb');
      expect(mockProvider.upload).toHaveBeenCalled();
    });
  });
});
