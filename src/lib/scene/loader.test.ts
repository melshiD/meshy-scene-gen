import { describe, it, expect, vi, afterEach } from 'vitest';
import { disposeLoaders } from './loader';

// Mock the three.js loaders since they require WebGL context
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: vi.fn().mockImplementation(() => ({
    setDRACOLoader: vi.fn(),
    load: vi.fn(),
  })),
}));

vi.mock('three/examples/jsm/loaders/DRACOLoader.js', () => ({
  DRACOLoader: vi.fn().mockImplementation(() => ({
    setDecoderPath: vi.fn(),
    preload: vi.fn(),
    dispose: vi.fn(),
  })),
}));

describe('loader', () => {
  afterEach(() => {
    disposeLoaders();
  });

  describe('loadGLTF', () => {
    it('should be importable', async () => {
      const { loadGLTF } = await import('./loader');
      expect(loadGLTF).toBeDefined();
      expect(typeof loadGLTF).toBe('function');
    });
  });

  describe('loadAndPrepareMesh', () => {
    it('should be importable', async () => {
      const { loadAndPrepareMesh } = await import('./loader');
      expect(loadAndPrepareMesh).toBeDefined();
      expect(typeof loadAndPrepareMesh).toBe('function');
    });
  });

  describe('disposeLoaders', () => {
    it('should not throw when called multiple times', () => {
      expect(() => disposeLoaders()).not.toThrow();
      expect(() => disposeLoaders()).not.toThrow();
    });
  });
});
