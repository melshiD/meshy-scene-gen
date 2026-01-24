import { describe, it, expect } from 'vitest';
import type { SceneObject, LayoutConfig } from '@/types';
import {
  applyLayout,
  applyLayoutToSelection,
  compactLayout,
  addAndArrange,
  redistributeSpacing,
} from './auto-arrange';

const createTestObject = (id: string, overrides: Partial<SceneObject> = {}): SceneObject => ({
  id,
  name: `Object ${id}`,
  meshUrl: null,
  position: { x: 0, y: 0, z: 0 },
  scale: 1,
  rotation: { x: 0, y: 0, z: 0 },
  visible: true,
  locked: false,
  ...overrides,
});

const DEFAULT_CONFIG: LayoutConfig = {
  preset: 'line',
  spacing: 2.0,
  groundPlane: true,
  centerPoint: { x: 0, y: 0, z: 0 },
  radius: 3.0,
};

describe('auto-arrange', () => {
  describe('applyLayout', () => {
    it('should arrange objects according to preset', () => {
      const objects = [
        createTestObject('1'),
        createTestObject('2'),
        createTestObject('3'),
      ];
      const config: LayoutConfig = { ...DEFAULT_CONFIG, preset: 'line' };

      const result = applyLayout(objects, config);

      expect(result).toHaveLength(3);
      // Line layout: objects should be spread along X axis
      expect(result[0].position.x).toBeLessThan(result[1].position.x);
      expect(result[1].position.x).toBeLessThan(result[2].position.x);
    });

    it('should return empty array for empty input', () => {
      const result = applyLayout([], DEFAULT_CONFIG);
      expect(result).toHaveLength(0);
    });

    it('should respect locked objects by default', () => {
      const objects = [
        createTestObject('1', { position: { x: 10, y: 0, z: 10 } }),
        createTestObject('2', { locked: true, position: { x: 5, y: 5, z: 5 } }),
        createTestObject('3'),
      ];
      const config: LayoutConfig = { ...DEFAULT_CONFIG, preset: 'line' };

      const result = applyLayout(objects, config);

      // Locked object should remain at original position
      expect(result[1].position).toEqual({ x: 5, y: 5, z: 5 });
    });

    it('should arrange all objects when respectLocks is false', () => {
      const objects = [
        createTestObject('1'),
        createTestObject('2', { locked: true, position: { x: 100, y: 100, z: 100 } }),
      ];

      const result = applyLayout(objects, DEFAULT_CONFIG, { respectLocks: false });

      // Both objects should be arranged
      expect(result[1].position).not.toEqual({ x: 100, y: 100, z: 100 });
    });

    it('should apply ground plane constraint when enabled', () => {
      const objects = [createTestObject('1', { position: { x: 0, y: -5, z: 0 } })];
      const config: LayoutConfig = { ...DEFAULT_CONFIG, groundPlane: true };

      const result = applyLayout(objects, config, { applyGroundPlane: true });

      expect(result[0].position.y).toBeGreaterThanOrEqual(0);
    });

    it('should skip ground plane when disabled', () => {
      const objects = [createTestObject('1')];
      const config: LayoutConfig = { ...DEFAULT_CONFIG, groundPlane: false };

      // With centered layout, objects stack vertically
      const result = applyLayout(objects, config, { applyGroundPlane: false });

      expect(result).toHaveLength(1);
    });

    it('should preserve original order when combining locked/unlocked', () => {
      const objects = [
        createTestObject('1'),
        createTestObject('2', { locked: true }),
        createTestObject('3'),
        createTestObject('4', { locked: true }),
        createTestObject('5'),
      ];

      const result = applyLayout(objects, DEFAULT_CONFIG);

      expect(result.map((o) => o.id)).toEqual(['1', '2', '3', '4', '5']);
    });

    it('should apply overlap prevention when enabled', () => {
      const objects = [
        createTestObject('1', { scale: 2 }),
        createTestObject('2', { scale: 2 }),
      ];
      const config: LayoutConfig = { ...DEFAULT_CONFIG, preset: 'cluster' };

      const result = applyLayout(objects, config, {
        preventOverlaps: true,
        minSpacing: 1,
      });

      // Objects should be pushed apart
      const distance = Math.sqrt(
        (result[0].position.x - result[1].position.x) ** 2 +
        (result[0].position.z - result[1].position.z) ** 2
      );
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('applyLayoutToSelection', () => {
    it('should only arrange selected objects', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 10, y: 10, z: 10 } }),
        createTestObject('3', { position: { x: 20, y: 20, z: 20 } }),
      ];

      const result = applyLayoutToSelection(objects, ['1', '3'], DEFAULT_CONFIG);

      // Object 2 should remain unchanged
      expect(result[1].position).toEqual({ x: 10, y: 10, z: 10 });
      // Objects 1 and 3 should be arranged
      expect(result[0].position.x).not.toBe(0);
      expect(result[2].position.x).not.toBe(20);
    });

    it('should preserve original order', () => {
      const objects = [
        createTestObject('1'),
        createTestObject('2'),
        createTestObject('3'),
      ];

      const result = applyLayoutToSelection(objects, ['3', '1'], DEFAULT_CONFIG);

      expect(result.map((o) => o.id)).toEqual(['1', '2', '3']);
    });

    it('should override locks for selected objects', () => {
      const objects = [
        createTestObject('1', { locked: true, position: { x: 50, y: 50, z: 50 } }),
        createTestObject('2'),
      ];

      const result = applyLayoutToSelection(objects, ['1', '2'], DEFAULT_CONFIG);

      // Locked object should be arranged because it's selected
      expect(result[0].position).not.toEqual({ x: 50, y: 50, z: 50 });
    });

    it('should handle empty selection', () => {
      const objects = [createTestObject('1'), createTestObject('2')];

      const result = applyLayoutToSelection(objects, [], DEFAULT_CONFIG);

      // All objects unchanged
      expect(result).toEqual(objects);
    });
  });

  describe('compactLayout', () => {
    it('should reapply layout to fill gaps', () => {
      // Simulate removing middle object
      const objects = [createTestObject('1'), createTestObject('3')];

      const result = compactLayout(objects, DEFAULT_CONFIG);

      expect(result).toHaveLength(2);
      // Should be properly spaced without gap
      const distance = Math.abs(result[0].position.x - result[1].position.x);
      expect(distance).toBeCloseTo(DEFAULT_CONFIG.spacing, 5);
    });

    it('should work with single remaining object', () => {
      const objects = [createTestObject('1')];

      const result = compactLayout(objects, DEFAULT_CONFIG);

      expect(result).toHaveLength(1);
    });
  });

  describe('addAndArrange', () => {
    it('should add object and rearrange all', () => {
      const objects = [createTestObject('1'), createTestObject('2')];
      const newObject = createTestObject('3');

      const result = addAndArrange(objects, newObject, DEFAULT_CONFIG);

      expect(result).toHaveLength(3);
      expect(result.map((o) => o.id)).toContain('3');
    });

    it('should properly space new object', () => {
      const objects = [createTestObject('1')];
      const newObject = createTestObject('2');

      const result = addAndArrange(objects, newObject, DEFAULT_CONFIG);

      const distance = Math.abs(result[0].position.x - result[1].position.x);
      expect(distance).toBeCloseTo(DEFAULT_CONFIG.spacing, 5);
    });

    it('should add to empty scene', () => {
      const newObject = createTestObject('1');

      const result = addAndArrange([], newObject, DEFAULT_CONFIG);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('redistributeSpacing', () => {
    it('should apply new spacing to layout', () => {
      const objects = [
        createTestObject('1'),
        createTestObject('2'),
        createTestObject('3'),
      ];
      const config: LayoutConfig = { ...DEFAULT_CONFIG, spacing: 1 };

      const originalResult = applyLayout(objects, config);
      const redistributedResult = redistributeSpacing(objects, 3, config);

      // New spacing should be larger
      const originalDist = Math.abs(
        originalResult[0].position.x - originalResult[1].position.x
      );
      const newDist = Math.abs(
        redistributedResult[0].position.x - redistributedResult[1].position.x
      );

      expect(newDist).toBeGreaterThan(originalDist);
    });

    it('should work with zero spacing', () => {
      const objects = [createTestObject('1'), createTestObject('2')];

      const result = redistributeSpacing(objects, 0, DEFAULT_CONFIG);

      expect(result).toHaveLength(2);
    });
  });
});
