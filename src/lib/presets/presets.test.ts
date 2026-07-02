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
  beforeEach(async () => {
    await clearCustomPresets();
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
    it('should return default preset by ID', async () => {
      const preset = await getPreset('product');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Product Shot');
    });

    it('should return undefined for non-existent preset', async () => {
      const preset = await getPreset('nonexistent');
      expect(preset).toBeUndefined();
    });

    it('should prefer custom preset over default with same ID', async () => {
      await savePreset({
        id: 'product',
        name: 'Custom Product',
        description: 'Custom description',
        object: { position: { x: 1, y: 1, z: 1 }, scale: 2, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 60, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'soft' },
      });

      const preset = await getPreset('product');
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
    it('should return all default presets when no custom presets exist', async () => {
      const presets = await listPresets();
      expect(presets.length).toBe(DEFAULT_PRESETS.length);
    });

    it('should include custom presets in the list', async () => {
      await savePreset({
        name: 'My Custom',
        description: 'A custom preset',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      const presets = await listPresets();
      expect(presets.length).toBe(DEFAULT_PRESETS.length + 1);
      expect(presets.some((p) => p.name === 'My Custom')).toBe(true);
    });
  });

  describe('savePreset', () => {
    it('should generate ID if not provided', async () => {
      const preset = await savePreset({
        name: 'Test Preset',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(preset.id).toBeDefined();
      expect(preset.id).toMatch(/^custom-/);
    });

    it('should use provided ID', async () => {
      const preset = await savePreset({
        id: 'my-custom-id',
        name: 'Test Preset',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(preset.id).toBe('my-custom-id');
    });

    it('should be retrievable after saving', async () => {
      const saved = await savePreset({
        id: 'test-id',
        name: 'Test Preset',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      const retrieved = await getPreset('test-id');
      expect(retrieved).toEqual(saved);
    });
  });

  describe('deletePreset', () => {
    it('should delete a custom preset', async () => {
      await savePreset({
        id: 'to-delete',
        name: 'To Delete',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(await getPreset('to-delete')).toBeDefined();

      const result = await deletePreset('to-delete');
      expect(result).toBe(true);
      expect(await getPreset('to-delete')).toBeUndefined();
    });

    it('should not delete default presets', async () => {
      const result = await deletePreset('product');
      expect(result).toBe(false);
      expect(await getPreset('product')).toBeDefined();
    });

    it('should return false for non-existent preset', async () => {
      const result = await deletePreset('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('presetExists', () => {
    it('should return true for default presets', async () => {
      expect(await presetExists('product')).toBe(true);
      expect(await presetExists('hero')).toBe(true);
    });

    it('should return true for custom presets', async () => {
      await savePreset({
        id: 'custom-test',
        name: 'Custom Test',
        description: 'Test',
        object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } },
        camera: { position: { x: 0, y: 0, z: 5 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
        lighting: { preset: 'studio' },
      });

      expect(await presetExists('custom-test')).toBe(true);
    });

    it('should return false for non-existent presets', async () => {
      expect(await presetExists('nonexistent')).toBe(false);
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
    it('should build config from preset ID', async () => {
      const config = await buildSceneConfig(
        'hero',
        'https://example.com/bg.png',
        'https://example.com/mesh.glb'
      );

      const heroPreset = (await getPreset('hero'))!;
      expect(config.object).toEqual(heroPreset.object);
      expect(config.camera).toEqual(heroPreset.camera);
    });

    it('should use default preset when no preset ID provided', async () => {
      const config = await buildSceneConfig(
        undefined,
        'https://example.com/bg.png',
        'https://example.com/mesh.glb'
      );

      const defaultPreset = getDefaultPreset();
      expect(config.object).toEqual(defaultPreset.object);
    });

    it('should throw for non-existent preset', async () => {
      await expect(
        buildSceneConfig(
          'nonexistent',
          'https://example.com/bg.png',
          'https://example.com/mesh.glb'
        )
      ).rejects.toThrow('Preset not found: nonexistent');
    });

    it('should apply overrides', async () => {
      const config = await buildSceneConfig(
        'product',
        'https://example.com/bg.png',
        'https://example.com/mesh.glb',
        { object: { scale: 3 } }
      );

      expect(config.object.scale).toBe(3);
    });
  });
});
