/**
 * Filesystem Storage Provider
 *
 * Stores assets to the local filesystem under public/generated/.
 * Used for development and local testing.
 *
 * In production, use R2StorageProvider or similar cloud storage.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { StorageProvider, UploadOptions, UploadResult, StorageConfig } from './types';

/** Default base path for generated assets */
const DEFAULT_BASE_PATH = 'public/generated';

/** Default public URL prefix */
const DEFAULT_PUBLIC_URL = '/generated';

/**
 * Filesystem storage provider implementation
 *
 * Saves assets to the local filesystem, serving them via Next.js static file serving.
 */
export class FilesystemStorageProvider implements StorageProvider {
  readonly name = 'filesystem';
  private readonly basePath: string;
  private readonly publicUrl: string;

  constructor(config?: StorageConfig) {
    this.basePath = config?.basePath ?? DEFAULT_BASE_PATH;
    this.publicUrl = config?.publicUrl ?? DEFAULT_PUBLIC_URL;
  }

  /**
   * Upload a blob to the filesystem
   */
  async upload(blob: Blob, options: UploadOptions): Promise<UploadResult> {
    const { key, contentType } = options;
    const filePath = this.getFilePath(key);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Convert blob to buffer and write
    const buffer = Buffer.from(await blob.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Write metadata if provided
    if (options.metadata && Object.keys(options.metadata).length > 0) {
      const metadataPath = `${filePath}.meta.json`;
      await fs.writeFile(
        metadataPath,
        JSON.stringify({ contentType, ...options.metadata }, null, 2)
      );
    }

    return {
      key,
      url: this.getUrl(key),
      size: buffer.length,
    };
  }

  /**
   * Download content from a URL
   */
  async download(url: string): Promise<Blob> {
    // If it's a local URL, read from filesystem
    if (url.startsWith(this.publicUrl) || url.startsWith('/')) {
      const key = url.replace(this.publicUrl, '').replace(/^\//, '');
      const filePath = this.getFilePath(key);
      const buffer = await fs.readFile(filePath);
      return new Blob([buffer]);
    }

    // For external URLs, fetch the content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download from ${url}: ${response.status} ${response.statusText}`);
    }
    return response.blob();
  }

  /**
   * Delete an asset from the filesystem
   */
  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);

      // Also delete metadata file if it exists
      const metadataPath = `${filePath}.meta.json`;
      try {
        await fs.unlink(metadataPath);
      } catch {
        // Metadata file may not exist, ignore
      }

      // Try to remove empty parent directories
      await this.cleanupEmptyDirs(path.dirname(filePath));

      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if an asset exists
   */
  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the public URL for a storage key
   */
  getUrl(key: string): string {
    // Normalize path separators for URLs
    const normalizedKey = key.replace(/\\/g, '/');
    return `${this.publicUrl}/${normalizedKey}`;
  }

  /**
   * Get the filesystem path for a storage key
   */
  private getFilePath(key: string): string {
    // Normalize path separators for the current OS
    const normalizedKey = key.replace(/[/\\]/g, path.sep);
    return path.join(process.cwd(), this.basePath, normalizedKey);
  }

  /**
   * Remove empty parent directories up to basePath
   */
  private async cleanupEmptyDirs(dirPath: string): Promise<void> {
    const baseFullPath = path.join(process.cwd(), this.basePath);

    // Don't delete the base path or anything above it
    if (!dirPath.startsWith(baseFullPath) || dirPath === baseFullPath) {
      return;
    }

    try {
      const entries = await fs.readdir(dirPath);
      if (entries.length === 0) {
        await fs.rmdir(dirPath);
        // Recursively try parent directory
        await this.cleanupEmptyDirs(path.dirname(dirPath));
      }
    } catch {
      // Directory may not be empty or may not exist, ignore
    }
  }
}

/**
 * Create a filesystem storage provider with default configuration
 */
export function createFilesystemStorage(config?: StorageConfig): FilesystemStorageProvider {
  return new FilesystemStorageProvider(config);
}
