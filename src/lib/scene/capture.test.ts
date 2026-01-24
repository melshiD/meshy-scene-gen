import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { getCapturePresets } from './capture';

// Mock fetch for dataUrlToBlob
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' })),
});

describe('capture', () => {
  describe('getCapturePresets', () => {
    it('should return all capture presets', () => {
      const presets = getCapturePresets();

      expect(presets.nft).toBeDefined();
      expect(presets.web).toBeDefined();
      expect(presets.thumb).toBeDefined();
      expect(presets.social).toBeDefined();
    });

    it('should have correct nft preset values', () => {
      const presets = getCapturePresets();

      expect(presets.nft.width).toBe(2048);
      expect(presets.nft.height).toBe(2048);
      expect(presets.nft.format).toBe('png');
      expect(presets.nft.quality).toBe(1);
    });

    it('should have correct web preset values', () => {
      const presets = getCapturePresets();

      expect(presets.web.width).toBe(800);
      expect(presets.web.height).toBe(800);
      expect(presets.web.format).toBe('webp');
      expect(presets.web.quality).toBe(0.85);
    });

    it('should have correct thumb preset values', () => {
      const presets = getCapturePresets();

      expect(presets.thumb.width).toBe(400);
      expect(presets.thumb.height).toBe(400);
      expect(presets.thumb.format).toBe('webp');
      expect(presets.thumb.quality).toBe(0.8);
    });

    it('should have correct social preset values', () => {
      const presets = getCapturePresets();

      expect(presets.social.width).toBe(1200);
      expect(presets.social.height).toBe(630);
      expect(presets.social.format).toBe('jpeg');
      expect(presets.social.quality).toBe(0.9);
    });
  });

  describe('captureScene', () => {
    let mockRenderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;

    beforeEach(() => {
      // Create mock canvas
      const canvas = {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
        getContext: vi.fn().mockReturnValue({
          getParameter: vi.fn(),
          getExtension: vi.fn(),
        }),
        width: 800,
        height: 800,
        style: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLCanvasElement;

      // Create mock renderer
      mockRenderer = {
        getSize: vi.fn().mockImplementation((target: THREE.Vector2) => {
          target.set(800, 800);
          return target;
        }),
        getPixelRatio: vi.fn().mockReturnValue(1),
        setSize: vi.fn(),
        setPixelRatio: vi.fn(),
        render: vi.fn(),
        domElement: canvas,
      } as unknown as THREE.WebGLRenderer;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    });

    it('should be importable', async () => {
      const { captureScene } = await import('./capture');
      expect(captureScene).toBeDefined();
      expect(typeof captureScene).toBe('function');
    });
  });
});
