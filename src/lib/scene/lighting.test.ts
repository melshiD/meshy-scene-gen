import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as THREE from 'three';
import { addLighting, getLightingConfig, listLightingPresets } from './lighting';

describe('lighting', () => {
  let scene: THREE.Scene;

  beforeEach(() => {
    scene = new THREE.Scene();
  });

  afterEach(() => {
    scene.clear();
  });

  describe('addLighting', () => {
    it('should add lights to the scene with studio preset', () => {
      const result = addLighting(scene, 'studio');

      expect(result.keyLight).toBeInstanceOf(THREE.DirectionalLight);
      expect(result.fillLight).toBeInstanceOf(THREE.DirectionalLight);
      expect(result.rimLight).toBeInstanceOf(THREE.DirectionalLight);
      expect(result.ambientLight).toBeInstanceOf(THREE.AmbientLight);

      // Verify lights were added to scene
      expect(scene.children).toContain(result.keyLight);
      expect(scene.children).toContain(result.fillLight);
      expect(scene.children).toContain(result.ambientLight);
    });

    it('should add lights with dramatic preset (includes rim light)', () => {
      const result = addLighting(scene, 'dramatic');

      expect(result.rimLight).toBeInstanceOf(THREE.DirectionalLight);
      expect(scene.children).toContain(result.rimLight);
    });

    it('should add lights with soft preset (no rim light)', () => {
      const result = addLighting(scene, 'soft');

      expect(result.rimLight).toBeNull();
    });

    it('should apply intensity multiplier to all lights', () => {
      const multiplier = 2;
      const result = addLighting(scene, 'studio', multiplier);
      const config = getLightingConfig('studio');

      expect(result.keyLight.intensity).toBe(config.keyLight.intensity * multiplier);
      expect(result.fillLight.intensity).toBe(config.fillLight.intensity * multiplier);
      expect(result.ambientLight.intensity).toBe(config.ambient.intensity * multiplier);
    });

    it('should apply color override to key light', () => {
      const colorOverride = '#ff0000';
      const result = addLighting(scene, 'studio', 1, colorOverride);

      expect(result.keyLight.color.getHexString()).toBe('ff0000');
    });

    it('should enable shadows on key light', () => {
      const result = addLighting(scene, 'studio');

      expect(result.keyLight.castShadow).toBe(true);
      expect(result.keyLight.shadow.mapSize.width).toBe(2048);
      expect(result.keyLight.shadow.mapSize.height).toBe(2048);
    });

    it('should remove lights when dispose is called', () => {
      const result = addLighting(scene, 'studio');
      const initialChildCount = scene.children.length;

      result.dispose();

      expect(scene.children.length).toBeLessThan(initialChildCount);
      expect(scene.children).not.toContain(result.keyLight);
      expect(scene.children).not.toContain(result.fillLight);
      expect(scene.children).not.toContain(result.ambientLight);
    });
  });

  describe('getLightingConfig', () => {
    it('should return config for dramatic preset', () => {
      const config = getLightingConfig('dramatic');

      expect(config.keyLight).toBeDefined();
      expect(config.fillLight).toBeDefined();
      expect(config.rimLight).toBeDefined();
      expect(config.ambient).toBeDefined();
    });

    it('should return config for soft preset', () => {
      const config = getLightingConfig('soft');

      expect(config.keyLight).toBeDefined();
      expect(config.fillLight).toBeDefined();
      expect(config.rimLight).toBeUndefined();
      expect(config.ambient).toBeDefined();
    });

    it('should return config for studio preset', () => {
      const config = getLightingConfig('studio');

      expect(config.keyLight).toBeDefined();
      expect(config.fillLight).toBeDefined();
      expect(config.rimLight).toBeDefined();
      expect(config.ambient).toBeDefined();
    });
  });

  describe('listLightingPresets', () => {
    it('should return all available presets', () => {
      const presets = listLightingPresets();

      expect(presets).toContain('dramatic');
      expect(presets).toContain('soft');
      expect(presets).toContain('studio');
      expect(presets).toHaveLength(3);
    });
  });
});
