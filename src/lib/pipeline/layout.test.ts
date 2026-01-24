import { describe, it, expect } from 'vitest';
import { calculateLayout, applyLayoutToObjects, getLayoutDefaults } from './layout';
import type { LayoutConfig, SceneObject } from '@/types';

describe('Layout Utility', () => {
  const defaultConfig: LayoutConfig = {
    preset: 'centered',
    spacing: 1.0,
    groundPlane: true,
    centerPoint: { x: 0, y: 0, z: 0 },
    radius: 2.0,
  };

  describe('calculateLayout', () => {
    describe('centered layout', () => {
      it('should place single object at center', () => {
        const positions = calculateLayout(1, { ...defaultConfig, preset: 'centered' });
        expect(positions.length).toBe(1);
        expect(positions[0]).toEqual({ x: 0, y: 0, z: 0 });
      });

      it('should spread multiple objects along x-axis', () => {
        const positions = calculateLayout(3, { ...defaultConfig, preset: 'centered' });
        expect(positions.length).toBe(3);
        expect(positions[0].x).toBeLessThan(positions[1].x);
        expect(positions[1].x).toBeLessThan(positions[2].x);
        // Center object should be at center
        expect(positions[1]).toEqual({ x: 0, y: 0, z: 0 });
      });
    });

    describe('grid layout', () => {
      it('should arrange objects in a grid', () => {
        const positions = calculateLayout(4, { ...defaultConfig, preset: 'grid' });
        expect(positions.length).toBe(4);
        // Should be 2x2 grid
        const uniqueX = new Set(positions.map((p) => p.x));
        const uniqueZ = new Set(positions.map((p) => p.z));
        expect(uniqueX.size).toBe(2);
        expect(uniqueZ.size).toBe(2);
      });

      it('should respect cols parameter', () => {
        const positions = calculateLayout(6, { ...defaultConfig, preset: 'grid', cols: 3 });
        expect(positions.length).toBe(6);
        // Should be 3x2 grid
        const uniqueX = new Set(positions.map((p) => p.x));
        expect(uniqueX.size).toBe(3);
      });
    });

    describe('circular layout', () => {
      it('should place objects in a circle', () => {
        const positions = calculateLayout(4, { ...defaultConfig, preset: 'circular', radius: 2 });
        expect(positions.length).toBe(4);
        // All points should be at same radius from center
        for (const pos of positions) {
          const dist = Math.sqrt(pos.x ** 2 + pos.z ** 2);
          expect(dist).toBeCloseTo(2, 5);
        }
      });

      it('should evenly space objects', () => {
        const positions = calculateLayout(4, { ...defaultConfig, preset: 'circular' });
        // Check that angles are 90 degrees apart (PI/2)
        // Sort angles first to handle wrap-around correctly
        const angles = positions.map((p) => Math.atan2(p.z, p.x)).sort((a, b) => a - b);
        for (let i = 1; i < angles.length; i++) {
          const diff = angles[i] - angles[i - 1];
          expect(diff).toBeCloseTo(Math.PI / 2, 5);
        }
      });
    });

    describe('semicircle layout', () => {
      it('should place objects in a half circle', () => {
        const positions = calculateLayout(3, { ...defaultConfig, preset: 'semicircle', radius: 2 });
        expect(positions.length).toBe(3);
        // All points should be at same radius
        for (const pos of positions) {
          const dist = Math.sqrt(pos.x ** 2 + pos.z ** 2);
          expect(dist).toBeCloseTo(2, 5);
        }
      });
    });

    describe('pyramid layout', () => {
      it('should stack objects vertically', () => {
        const positions = calculateLayout(3, { ...defaultConfig, preset: 'pyramid' });
        expect(positions.length).toBe(3);
        // Should have varying Y values
        const uniqueY = new Set(positions.map((p) => p.y));
        expect(uniqueY.size).toBeGreaterThan(1);
      });
    });

    describe('scattered layout', () => {
      it('should place objects within radius', () => {
        const radius = 3;
        const positions = calculateLayout(10, { ...defaultConfig, preset: 'scattered', radius });
        expect(positions.length).toBe(10);
        for (const pos of positions) {
          const dist = Math.sqrt(pos.x ** 2 + pos.z ** 2);
          expect(dist).toBeLessThanOrEqual(radius);
        }
      });

      it('should be reproducible with same seed', () => {
        const config = { ...defaultConfig, preset: 'scattered' as const, randomSeed: 12345 };
        const positions1 = calculateLayout(5, config);
        const positions2 = calculateLayout(5, config);
        expect(positions1).toEqual(positions2);
      });
    });

    describe('line layout', () => {
      it('should place objects in a horizontal line', () => {
        const positions = calculateLayout(5, { ...defaultConfig, preset: 'line' });
        expect(positions.length).toBe(5);
        // All should have same Y and Z
        const uniqueY = new Set(positions.map((p) => p.y));
        const uniqueZ = new Set(positions.map((p) => p.z));
        expect(uniqueY.size).toBe(1);
        expect(uniqueZ.size).toBe(1);
        // X should vary
        const uniqueX = new Set(positions.map((p) => p.x));
        expect(uniqueX.size).toBe(5);
      });
    });

    describe('cluster layout', () => {
      it('should place objects in tight grouping', () => {
        const positions = calculateLayout(5, { ...defaultConfig, preset: 'cluster', spacing: 1 });
        expect(positions.length).toBe(5);
        // Objects should be within spacing distance of center
        for (const pos of positions) {
          expect(Math.abs(pos.x)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(pos.z)).toBeLessThanOrEqual(0.5);
        }
      });
    });

    describe('custom/default layout', () => {
      it('should fall back to centered for custom preset', () => {
        const positions = calculateLayout(2, { ...defaultConfig, preset: 'custom' });
        expect(positions.length).toBe(2);
      });
    });
  });

  describe('applyLayoutToObjects', () => {
    it('should apply calculated positions to objects', () => {
      const objects: SceneObject[] = [
        {
          id: 'obj-1',
          name: 'Object 1',
          meshUrl: 'mesh1.glb',
          position: { x: 100, y: 100, z: 100 },
          scale: 1,
          rotation: { x: 0, y: 0, z: 0 },
          visible: true,
          locked: false,
        },
        {
          id: 'obj-2',
          name: 'Object 2',
          meshUrl: 'mesh2.glb',
          position: { x: 200, y: 200, z: 200 },
          scale: 1,
          rotation: { x: 0, y: 0, z: 0 },
          visible: true,
          locked: false,
        },
      ];

      const result = applyLayoutToObjects(objects, { ...defaultConfig, preset: 'line' });

      expect(result.length).toBe(2);
      // Positions should be updated
      expect(result[0].position).not.toEqual({ x: 100, y: 100, z: 100 });
      expect(result[1].position).not.toEqual({ x: 200, y: 200, z: 200 });
      // Other properties should be preserved
      expect(result[0].id).toBe('obj-1');
      expect(result[0].meshUrl).toBe('mesh1.glb');
    });
  });

  describe('getLayoutDefaults', () => {
    it('should return spacing for grid layout', () => {
      const defaults = getLayoutDefaults('grid');
      expect(defaults.spacing).toBeDefined();
    });

    it('should return radius for circular layout', () => {
      const defaults = getLayoutDefaults('circular');
      expect(defaults.radius).toBeDefined();
    });

    it('should return radius for semicircle layout', () => {
      const defaults = getLayoutDefaults('semicircle');
      expect(defaults.radius).toBeDefined();
    });

    it('should return spacing for pyramid layout', () => {
      const defaults = getLayoutDefaults('pyramid');
      expect(defaults.spacing).toBeDefined();
    });

    it('should return radius for scattered layout', () => {
      const defaults = getLayoutDefaults('scattered');
      expect(defaults.radius).toBeDefined();
    });

    it('should return spacing for line layout', () => {
      const defaults = getLayoutDefaults('line');
      expect(defaults.spacing).toBeDefined();
    });

    it('should return spacing for cluster layout', () => {
      const defaults = getLayoutDefaults('cluster');
      expect(defaults.spacing).toBeDefined();
    });

    it('should return defaults for unknown preset', () => {
      const defaults = getLayoutDefaults('centered');
      expect(defaults.spacing).toBeDefined();
    });
  });
});
