import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PRESETS,
  getPreset,
  getDefaultPreset,
  listPresets,
  savePreset,
  deletePreset,
  presetExists,
  mergePresetWithOverrides,
  buildSceneConfig,
  clearCustomPresets,
} from './index';

describe('Presets Module', () => {
  beforeEach(() => {
    clearCustomPresets();
  });

  describe('DEFAULT_PRESETS', () => {
    it('should have expected preset IDs', () => {
      const ids = DEFAULT_PRESETS.map((p) => p.id);
      expect(ids).toContain('product');
      expect(ids).toContain('hero');
      expect(ids).toContain('icon');
      expect(ids).toContain('portrait');
      expect(ids).toContain('dramatic');
    });

    it('should have all required fields for each preset', () => {
      for (const preset of DEFAULT_PRESETS) {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.object).toBeDefined();
        expect(preset.object.position).toBeDefined();
        expect(preset.object.scale).toBeDefined();
        expect(preset.object.rotation).toBeDefined();
        expect(preset.camera).toBeDefined();
        expect(preset.camera.position).toBeDefined();
        expect(preset.camera.fov).toBeDefined();
        expect(preset.camera.lookAt).toBeDefined();
        expect(preset.lighting).toBeDefined();
        expect(preset.lighting.preset).toBeDefined();
      }
    });
  });

  describe('getPreset', () => {
    it('should return default preset by ID', () => {
      const preset = getPreset('product');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Product Shot');
    });

    it('should return undefined for non-existent preset', () => {
      const preset = getPreset('nonexistent');
      expect(preset).toBeUndefined();
    });

    it('should prefer custom preset over default with same ID', () => {
      savePreset({
        id: 'product',
        name: 'Custom Product',
        description: 'Custom description',
        object: { position: { x: 1, y: 1, z: 1 }, scale: 2, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 60, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'soft' },
      });

      const preset = getPreset('product');
      expect(preset?.name).toBe('Custom Product');
    });
  });

  describe('getDefaultPreset', () => {
    it('should return the product preset', () => {
      const preset = getDefaultPreset();
      expect(preset.id).toBe('product');
    });
  });

  describe('listPresets', () => {
    it('should return all default presets when no custom presets exist', () => {
      const presets = listPresets();
      expect(presets.length).toBe(DEFAULT_PRESETS.length);
    });

    it('should include custom presets in the list', () => {
      savePreset({
        name: 'My Custom',
        description: 'A custom preset',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      const presets = listPresets();
      expect(presets.length).toBe(DEFAULT_PRESETS.length + 1);
      expect(presets.some((p) => p.name === 'My Custom')).toBe(true);
    });
  });

  describe('savePreset', () => {
    it('should generate ID if not provided', () => {
      const preset = savePreset({
        name: 'Test Preset',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(preset.id).toBeDefined();
      expect(preset.id).toMatch(/^custom-/);
    });

    it('should use provided ID', () => {
      const preset = savePreset({
        id: 'my-custom-id',
        name: 'Test Preset',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(preset.id).toBe('my-custom-id');
    });

    it('should be retrievable after saving', () => {
      const saved = savePreset({
        id: 'test-id',
        name: 'Test Preset',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      const retrieved = getPreset('test-id');
      expect(retrieved).toEqual(saved);
    });
  });

  describe('deletePreset', () => {
    it('should delete a custom preset', () => {
      savePreset({
        id: 'to-delete',
        name: 'To Delete',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(getPreset('to-delete')).toBeDefined();

      const result = deletePreset('to-delete');
      expect(result).toBe(true);
      expect(getPreset('to-delete')).toBeUndefined();
    });

    it('should not delete default presets', () => {
      const result = deletePreset('product');
      expect(result).toBe(false);
      expect(getPreset('product')).toBeDefined();
    });

    it('should return false for non-existent preset', () => {
      const result = deletePreset('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('presetExists', () => {
    it('should return true for default presets', () => {
      expect(presetExists('product')).toBe(true);
      expect(presetExists('hero')).toBe(true);
    });

    it('should return true for custom presets', () => {
      savePreset({
        id: 'custom-test',
        name: 'Custom Test',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(presetExists('custom-test')).toBe(true);
    });

    it('should return false for non-existent presets', () => {
      expect(presetExists('nonexistent')).toBe(false);
    });
  });

  describe('mergePresetWithOverrides', () => {
    it('should create SceneConfig from preset without overrides', () => {
      const preset = getDefaultPreset();
      const config = mergePresetWithOverrides(
        preset,
        'https://example.com/bg.png',
        'https://example.com/mesh.glb'
      );

      expect(config.backgroundUrl).toBe('https://example.com/bg.png');
      expect(config.meshUrl).toBe('https://example.com/mesh.glb');
      expect(config.object).toEqual(preset.object);
      expect(config.camera).toEqual(preset.camera);
      expect(config.lighting).toEqual(preset.lighting);
    });

    it('should merge object overrides', () => {
      const preset = getDefaultPreset();
      const config = mergePresetWithOverrides(
        preset,
        'https://example.com/bg.png',
        'https://example.com/mesh.glb',
        { object: { scale: 2 } }
      );

      expect(config.object.scale).toBe(2);
      expect(config.object.position).toEqual(preset.object.position);
    });

    it('should merge camera overrides', () => {
      const preset = getDefaultPreset();
      const config = mergePresetWithOverrides(
        preset,
        'https://example.com/bg.png',
        'https://example.com/mesh.glb',
        { camera: { fov: 60 } }
      );

      expect(config.camera.fov).toBe(60);
      expect(config.camera.position).toEqual(preset.camera.position);
    });

    it('should merge lighting overrides', () => {
      const preset = getDefaultPreset();
      const config = mergePresetWithOverrides(
        preset,
        'https://example.com/bg.png',
        'https://example.com/mesh.glb',
        { lighting: { intensity: 2 } }
      );

      expect(config.lighting.intensity).toBe(2);
      expect(config.lighting.preset).toBe(preset.lighting.preset);
    });
  });

  describe('buildSceneConfig', () => {
    it('should build config from preset ID', () => {
      const config = buildSceneConfig(
        'hero',
        'https://example.com/bg.png',
        'https://example.com/mesh.glb'
      );

      const heroPreset = getPreset('hero')!;
      expect(config.object).toEqual(heroPreset.object);
      expect(config.camera).toEqual(heroPreset.camera);
    });

    it('should use default preset when no preset ID provided', () => {
      const config = buildSceneConfig(
        undefined,
        'https://example.com/bg.png',
        'https://example.com/mesh.glb'
      );

      const defaultPreset = getDefaultPreset();
      expect(config.object).toEqual(defaultPreset.object);
    });

    it('should throw for non-existent preset', () => {
      expect(() =>
        buildSceneConfig(
          'nonexistent',
          'https://example.com/bg.png',
          'https://example.com/mesh.glb'
        )
      ).toThrow('Preset not found: nonexistent');
    });

    it('should apply overrides', () => {
      const config = buildSceneConfig(
        'product',
        'https://example.com/bg.png',
        'https://example.com/mesh.glb',
        { object: { scale: 3 } }
      );

      expect(config.object.scale).toBe(3);
    });
  });
});
