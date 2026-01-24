import { describe, it, expect } from 'vitest';
import type { SceneObject, Vec3 } from '@/types';
import {
  calculateBoundingBox,
  calculateGroupBoundingBox,
  enforceGroundPlane,
  preventOverlap,
  checkOverlap,
  findOverlaps,
  constrainToBoundary,
} from './constraints';

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

describe('constraints', () => {
  describe('calculateBoundingBox', () => {
    it('should calculate bounds for object at origin with scale 1', () => {
      const object = createTestObject('1');

      const bounds = calculateBoundingBox(object);

      expect(bounds.min).toEqual({ x: -0.5, y: 0, z: -0.5 });
      expect(bounds.max).toEqual({ x: 0.5, y: 1, z: 0.5 });
      expect(bounds.center).toEqual({ x: 0, y: 0.5, z: 0 });
      expect(bounds.size).toEqual({ x: 1, y: 1, z: 1 });
    });

    it('should scale bounds based on object scale', () => {
      const object = createTestObject('1', { scale: 2 });

      const bounds = calculateBoundingBox(object);

      expect(bounds.min).toEqual({ x: -1, y: 0, z: -1 });
      expect(bounds.max).toEqual({ x: 1, y: 2, z: 1 });
      expect(bounds.size).toEqual({ x: 2, y: 2, z: 2 });
    });

    it('should offset bounds based on position', () => {
      const object = createTestObject('1', {
        position: { x: 5, y: 2, z: -3 },
      });

      const bounds = calculateBoundingBox(object);

      expect(bounds.min).toEqual({ x: 4.5, y: 2, z: -3.5 });
      expect(bounds.max).toEqual({ x: 5.5, y: 3, z: -2.5 });
      expect(bounds.center).toEqual({ x: 5, y: 2.5, z: -3 });
    });

    it('should use custom base size', () => {
      const object = createTestObject('1', { scale: 1 });

      const bounds = calculateBoundingBox(object, 2);

      expect(bounds.size).toEqual({ x: 2, y: 2, z: 2 });
    });
  });

  describe('calculateGroupBoundingBox', () => {
    it('should return zero bounds for empty array', () => {
      const bounds = calculateGroupBoundingBox([]);

      expect(bounds.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(bounds.max).toEqual({ x: 0, y: 0, z: 0 });
      expect(bounds.size).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should return single object bounds for one object', () => {
      const objects = [createTestObject('1', { position: { x: 0, y: 0, z: 0 } })];

      const bounds = calculateGroupBoundingBox(objects);

      expect(bounds.min).toEqual({ x: -0.5, y: 0, z: -0.5 });
      expect(bounds.max).toEqual({ x: 0.5, y: 1, z: 0.5 });
    });

    it('should encompass all objects', () => {
      const objects = [
        createTestObject('1', { position: { x: -5, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 5, y: 0, z: 0 } }),
        createTestObject('3', { position: { x: 0, y: 10, z: 0 } }),
      ];

      const bounds = calculateGroupBoundingBox(objects);

      expect(bounds.min.x).toBeLessThanOrEqual(-5);
      expect(bounds.max.x).toBeGreaterThanOrEqual(5);
      expect(bounds.max.y).toBeGreaterThanOrEqual(10);
    });

    it('should calculate correct center', () => {
      const objects = [
        createTestObject('1', { position: { x: -2, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 2, y: 0, z: 0 } }),
      ];

      const bounds = calculateGroupBoundingBox(objects);

      expect(bounds.center.x).toBeCloseTo(0, 5);
    });
  });

  describe('enforceGroundPlane', () => {
    it('should move objects below ground to ground level', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: -5, z: 0 } }),
      ];

      const result = enforceGroundPlane(objects);

      expect(result[0].position.y).toBe(0);
    });

    it('should not move objects already at or above ground', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 5, z: 0 } }),
      ];

      const result = enforceGroundPlane(objects);

      expect(result[0].position.y).toBe(5);
    });

    it('should use custom ground level', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
      ];

      const result = enforceGroundPlane(objects, 2);

      expect(result[0].position.y).toBe(2);
    });

    it('should handle multiple objects', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: -3, z: 0 } }),
        createTestObject('2', { position: { x: 0, y: 5, z: 0 } }),
        createTestObject('3', { position: { x: 0, y: -1, z: 0 } }),
      ];

      const result = enforceGroundPlane(objects);

      expect(result[0].position.y).toBe(0);
      expect(result[1].position.y).toBe(5);
      expect(result[2].position.y).toBe(0);
    });

    it('should preserve X and Z positions', () => {
      const objects = [
        createTestObject('1', { position: { x: 10, y: -5, z: 20 } }),
      ];

      const result = enforceGroundPlane(objects);

      expect(result[0].position.x).toBe(10);
      expect(result[0].position.z).toBe(20);
    });
  });

  describe('preventOverlap', () => {
    it('should return unchanged for single object', () => {
      const objects = [createTestObject('1')];

      const result = preventOverlap(objects, 0.5);

      expect(result[0].position).toEqual(objects[0].position);
    });

    it('should push apart overlapping objects', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 }, scale: 1 }),
        createTestObject('2', { position: { x: 0.5, y: 0, z: 0 }, scale: 1 }),
      ];

      const result = preventOverlap(objects, 0.5);

      const distance = Math.sqrt(
        (result[0].position.x - result[1].position.x) ** 2 +
        (result[0].position.z - result[1].position.z) ** 2
      );

      // Should be at least minSpacing + sum of radii
      expect(distance).toBeGreaterThanOrEqual(1.4); // 0.5 + 0.5 + 0.5 (approx)
    });

    it('should handle objects at same position', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 0, y: 0, z: 0 } }),
      ];

      const result = preventOverlap(objects, 0.5);

      // Objects should be separated
      const distance = Math.sqrt(
        (result[0].position.x - result[1].position.x) ** 2 +
        (result[0].position.z - result[1].position.z) ** 2
      );
      expect(distance).toBeGreaterThan(0);
    });

    it('should not move non-overlapping objects', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 }, scale: 1 }),
        createTestObject('2', { position: { x: 10, y: 0, z: 0 }, scale: 1 }),
      ];

      const result = preventOverlap(objects, 0.5);

      expect(result[0].position.x).toBeCloseTo(0, 1);
      expect(result[1].position.x).toBeCloseTo(10, 1);
    });

    it('should preserve Y positions', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 5, z: 0 } }),
        createTestObject('2', { position: { x: 0.1, y: 10, z: 0 } }),
      ];

      const result = preventOverlap(objects, 0.5);

      expect(result[0].position.y).toBe(5);
      expect(result[1].position.y).toBe(10);
    });

    it('should handle multiple overlapping objects', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 0.1, y: 0, z: 0.1 } }),
        createTestObject('3', { position: { x: -0.1, y: 0, z: -0.1 } }),
      ];

      const result = preventOverlap(objects, 0.5);

      // All pairs should be separated
      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          const dist = Math.sqrt(
            (result[i].position.x - result[j].position.x) ** 2 +
            (result[i].position.z - result[j].position.z) ** 2
          );
          expect(dist).toBeGreaterThan(0.3);
        }
      }
    });
  });

  describe('checkOverlap', () => {
    it('should return true for overlapping objects', () => {
      const objA = createTestObject('1', { position: { x: 0, y: 0, z: 0 }, scale: 1 });
      const objB = createTestObject('2', { position: { x: 0.5, y: 0, z: 0 }, scale: 1 });

      expect(checkOverlap(objA, objB)).toBe(true);
    });

    it('should return false for non-overlapping objects', () => {
      const objA = createTestObject('1', { position: { x: 0, y: 0, z: 0 }, scale: 1 });
      const objB = createTestObject('2', { position: { x: 10, y: 0, z: 0 }, scale: 1 });

      expect(checkOverlap(objA, objB)).toBe(false);
    });

    it('should consider margin', () => {
      const objA = createTestObject('1', { position: { x: 0, y: 0, z: 0 }, scale: 1 });
      const objB = createTestObject('2', { position: { x: 1.2, y: 0, z: 0 }, scale: 1 });

      // Without margin: not overlapping
      expect(checkOverlap(objA, objB, 0)).toBe(false);
      // With margin: overlapping
      expect(checkOverlap(objA, objB, 0.5)).toBe(true);
    });

    it('should account for different scales', () => {
      const objA = createTestObject('1', { position: { x: 0, y: 0, z: 0 }, scale: 2 });
      const objB = createTestObject('2', { position: { x: 1.5, y: 0, z: 0 }, scale: 2 });

      // With scale 2, each object has radius ~1, so they need >2 distance
      // At distance 1.5, they should overlap
      expect(checkOverlap(objA, objB)).toBe(true);
    });
  });

  describe('findOverlaps', () => {
    it('should return empty array for no overlaps', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 10, y: 0, z: 0 } }),
      ];

      const overlaps = findOverlaps(objects);

      expect(overlaps).toHaveLength(0);
    });

    it('should find overlapping pairs', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 0.5, y: 0, z: 0 } }),
        createTestObject('3', { position: { x: 10, y: 0, z: 0 } }),
      ];

      const overlaps = findOverlaps(objects);

      expect(overlaps).toHaveLength(1);
      expect(overlaps[0]).toEqual(['1', '2']);
    });

    it('should find multiple overlapping pairs', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 0.5, y: 0, z: 0 } }),
        createTestObject('3', { position: { x: 0.5, y: 0, z: 0.5 } }),
      ];

      const overlaps = findOverlaps(objects);

      expect(overlaps.length).toBeGreaterThan(1);
    });

    it('should consider margin', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 1.5, y: 0, z: 0 } }),
      ];

      // Without margin
      expect(findOverlaps(objects, 0)).toHaveLength(0);
      // With margin
      expect(findOverlaps(objects, 1)).toHaveLength(1);
    });
  });

  describe('constrainToBoundary', () => {
    it('should not move objects within boundary', () => {
      const objects = [
        createTestObject('1', { position: { x: 1, y: 0, z: 1 } }),
      ];
      const center: Vec3 = { x: 0, y: 0, z: 0 };

      const result = constrainToBoundary(objects, center, 5);

      expect(result[0].position).toEqual({ x: 1, y: 0, z: 1 });
    });

    it('should move objects outside boundary to boundary edge', () => {
      const objects = [
        createTestObject('1', { position: { x: 10, y: 0, z: 0 } }),
      ];
      const center: Vec3 = { x: 0, y: 0, z: 0 };
      const radius = 5;

      const result = constrainToBoundary(objects, center, radius);

      const distance = Math.sqrt(result[0].position.x ** 2 + result[0].position.z ** 2);
      expect(distance).toBeCloseTo(radius, 5);
    });

    it('should preserve direction from center', () => {
      const objects = [
        createTestObject('1', { position: { x: 20, y: 0, z: 20 } }),
      ];
      const center: Vec3 = { x: 0, y: 0, z: 0 };

      const result = constrainToBoundary(objects, center, 5);

      // Should still be in same quadrant
      expect(result[0].position.x).toBeGreaterThan(0);
      expect(result[0].position.z).toBeGreaterThan(0);
    });

    it('should preserve Y position', () => {
      const objects = [
        createTestObject('1', { position: { x: 10, y: 5, z: 0 } }),
      ];
      const center: Vec3 = { x: 0, y: 0, z: 0 };

      const result = constrainToBoundary(objects, center, 3);

      expect(result[0].position.y).toBe(5);
    });

    it('should handle custom center', () => {
      const objects = [
        createTestObject('1', { position: { x: 10, y: 0, z: 10 } }),
      ];
      const center: Vec3 = { x: 5, y: 0, z: 5 };
      const radius = 2;

      const result = constrainToBoundary(objects, center, radius);

      const distance = Math.sqrt(
        (result[0].position.x - center.x) ** 2 +
        (result[0].position.z - center.z) ** 2
      );
      expect(distance).toBeCloseTo(radius, 5);
    });
  });
});
