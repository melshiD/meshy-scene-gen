import { describe, it, expect, vi } from 'vitest';
import type { SceneConfig } from '@/types';

// Mock three.js WebGLRenderer since it requires WebGL context
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      dispose: vi.fn(),
      shadowMap: { enabled: false, type: 0 },
      outputColorSpace: '',
      toneMapping: 0,
      toneMappingExposure: 1,
      domElement: {
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
      },
    })),
    TextureLoader: vi.fn().mockImplementation(() => ({
      load: vi.fn((url, onLoad) => {
        const texture = new actual.Texture();
        setTimeout(() => onLoad(texture), 0);
        return texture;
      }),
    })),
  };
});

// Mock the loader module
vi.mock('./loader', () => ({
  loadAndPrepareMesh: vi.fn().mockResolvedValue({
    scene: { traverse: vi.fn() },
    animations: [],
    boundingBox: {},
    center: { x: 0, y: 0, z: 0 },
    size: { x: 1, y: 1, z: 1 },
    dispose: vi.fn(),
  }),
  disposeLoaders: vi.fn(),
}));

describe('create-scene', () => {
  const mockConfig: SceneConfig = {
    backgroundUrl: '',
    meshUrl: '',
    object: {
      position: { x: 0, y: 0, z: 0 },
      scale: 1,
      rotation: { x: 0, y: 0, z: 0 },
    },
    camera: {
      position: { x: 0, y: 1, z: 4 },
      fov: 45,
      lookAt: { x: 0, y: 0, z: 0 },
    },
    lighting: {
      preset: 'studio',
      intensity: 1,
    },
  };

  describe('createScene', () => {
    it('should be importable', async () => {
      const { createScene } = await import('./create-scene');
      expect(createScene).toBeDefined();
      expect(typeof createScene).toBe('function');
    });

    it('should create a scene with the provided config', async () => {
      const { createScene } = await import('./create-scene');
      const result = await createScene(mockConfig);

      expect(result.scene).toBeDefined();
      expect(result.camera).toBeDefined();
      expect(result.renderer).toBeDefined();
      expect(result.lighting).toBeDefined();
      expect(result.dispose).toBeDefined();
      expect(result.updateCamera).toBeDefined();

      result.dispose();
    });

    it('should use default options when not provided', async () => {
      const { createScene } = await import('./create-scene');
      const result = await createScene(mockConfig);

      expect(result.camera.fov).toBe(45);
      expect(result.camera.position.x).toBe(0);
      expect(result.camera.position.y).toBe(1);
      expect(result.camera.position.z).toBe(4);

      result.dispose();
    });
  });

  describe('createMinimalScene', () => {
    it('should be importable', async () => {
      const { createMinimalScene } = await import('./create-scene');
      expect(createMinimalScene).toBeDefined();
      expect(typeof createMinimalScene).toBe('function');
    });

    it('should create a minimal scene with studio lighting', async () => {
      const { createMinimalScene } = await import('./create-scene');
      const result = createMinimalScene();

      expect(result.scene).toBeDefined();
      expect(result.camera).toBeDefined();
      expect(result.renderer).toBeDefined();
      expect(result.lighting).toBeDefined();
      expect(result.dispose).toBeDefined();

      result.dispose();
    });

    it('should accept custom options', async () => {
      const { createMinimalScene } = await import('./create-scene');
      const result = createMinimalScene({
        width: 1024,
        height: 768,
        backgroundColor: '#ffffff',
      });

      expect(result.scene).toBeDefined();

      result.dispose();
    });
  });

  describe('updateCamera', () => {
    it('should update camera position and lookAt', async () => {
      const { createMinimalScene } = await import('./create-scene');
      const result = createMinimalScene();

      result.updateCamera(
        { x: 5, y: 5, z: 5 },
        { x: 0, y: 0, z: 0 },
        60
      );

      expect(result.camera.position.x).toBe(5);
      expect(result.camera.position.y).toBe(5);
      expect(result.camera.position.z).toBe(5);
      expect(result.camera.fov).toBe(60);

      result.dispose();
    });
  });
});
