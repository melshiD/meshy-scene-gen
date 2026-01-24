import { describe, it, expect } from 'vitest';
import type { SceneObject, Vec3 } from '@/types';
import {
  centerObjects,
  centerObjects3D,
  normalizeScales,
  scaleAll,
  alignToCamera,
  alignToPoint,
  alignOutward,
  alignInward,
  resetRotations,
  rotateAll,
  translateAll,
} from './transforms';

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

describe('transforms', () => {
  describe('centerObjects', () => {
    it('should return empty array for empty input', () => {
      const result = centerObjects([]);
      expect(result).toHaveLength(0);
    });

    it('should center single object at origin', () => {
      const objects = [
        createTestObject('1', { position: { x: 5, y: 0, z: 5 } }),
      ];

      const result = centerObjects(objects);

      expect(result[0].position.x).toBeCloseTo(0, 5);
      expect(result[0].position.z).toBeCloseTo(0, 5);
    });

    it('should center group around origin', () => {
      const objects = [
        createTestObject('1', { position: { x: 10, y: 0, z: 10 } }),
        createTestObject('2', { position: { x: 20, y: 0, z: 20 } }),
      ];

      const result = centerObjects(objects);

      const avgX = (result[0].position.x + result[1].position.x) / 2;
      const avgZ = (result[0].position.z + result[1].position.z) / 2;
      expect(avgX).toBeCloseTo(0, 1);
      expect(avgZ).toBeCloseTo(0, 1);
    });

    it('should center around custom point', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 2, y: 0, z: 2 } }),
      ];
      const targetCenter: Vec3 = { x: 10, y: 0, z: -5 };

      const result = centerObjects(objects, targetCenter);

      const avgX = (result[0].position.x + result[1].position.x) / 2;
      const avgZ = (result[0].position.z + result[1].position.z) / 2;
      expect(avgX).toBeCloseTo(10, 1);
      expect(avgZ).toBeCloseTo(-5, 1);
    });

    it('should not adjust Y position (preserve ground plane)', () => {
      const objects = [
        createTestObject('1', { position: { x: 5, y: 3, z: 5 } }),
      ];

      const result = centerObjects(objects);

      expect(result[0].position.y).toBe(3);
    });

    it('should preserve relative positions', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 5, y: 0, z: 3 } }),
      ];

      const result = centerObjects(objects);

      // Relative offset should be preserved
      const offsetX = result[1].position.x - result[0].position.x;
      const offsetZ = result[1].position.z - result[0].position.z;
      expect(offsetX).toBe(5);
      expect(offsetZ).toBe(3);
    });
  });

  describe('centerObjects3D', () => {
    it('should center including Y axis', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 5, z: 0 } }),
        createTestObject('2', { position: { x: 0, y: 10, z: 0 } }),
      ];

      const result = centerObjects3D(objects, { x: 0, y: 0, z: 0 });

      // Y should be adjusted
      const avgY = (result[0].position.y + result[1].position.y) / 2;
      expect(avgY).not.toBe(7.5);
    });

    it('should center at custom 3D point', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
      ];
      const target: Vec3 = { x: 5, y: 10, z: -3 };

      const result = centerObjects3D(objects, target);

      expect(result[0].position.x).toBeCloseTo(5, 1);
      expect(result[0].position.z).toBeCloseTo(-3, 1);
    });
  });

  describe('normalizeScales', () => {
    it('should return empty array for empty input', () => {
      const result = normalizeScales([]);
      expect(result).toHaveLength(0);
    });

    describe('uniform strategy', () => {
      it('should set all objects to same scale', () => {
        const objects = [
          createTestObject('1', { scale: 0.5 }),
          createTestObject('2', { scale: 2 }),
          createTestObject('3', { scale: 1.5 }),
        ];

        const result = normalizeScales(objects, 'uniform', 1);

        expect(result.every((o) => o.scale === 1)).toBe(true);
      });

      it('should use custom target scale', () => {
        const objects = [createTestObject('1', { scale: 0.5 })];

        const result = normalizeScales(objects, 'uniform', 3);

        expect(result[0].scale).toBe(3);
      });
    });

    describe('relative strategy', () => {
      it('should scale largest to target, others proportionally', () => {
        const objects = [
          createTestObject('1', { scale: 1 }),
          createTestObject('2', { scale: 2 }),
        ];

        const result = normalizeScales(objects, 'relative', 1);

        expect(result[1].scale).toBe(1);      // Largest scales to 1
        expect(result[0].scale).toBe(0.5);    // Smaller is proportional
      });

      it('should maintain proportions', () => {
        const objects = [
          createTestObject('1', { scale: 1 }),
          createTestObject('2', { scale: 2 }),
          createTestObject('3', { scale: 4 }),
        ];

        const result = normalizeScales(objects, 'relative', 2);

        // Ratios should be preserved: 1:2:4
        expect(result[0].scale / result[1].scale).toBeCloseTo(0.5, 5);
        expect(result[1].scale / result[2].scale).toBeCloseTo(0.5, 5);
      });

      it('should handle zero max scale', () => {
        const objects = [createTestObject('1', { scale: 0 })];

        const result = normalizeScales(objects, 'relative', 1);

        expect(result[0].scale).toBe(0);
      });
    });

    describe('fit strategy', () => {
      it('should not scale up smaller objects', () => {
        const objects = [
          createTestObject('1', { scale: 0.5 }),
        ];

        const result = normalizeScales(objects, 'fit', 2);

        // Already fits, so no change
        expect(result[0].scale).toBe(0.5);
      });

      it('should scale down objects exceeding target', () => {
        const objects = [
          createTestObject('1', { scale: 4 }),
          createTestObject('2', { scale: 2 }),
        ];

        const result = normalizeScales(objects, 'fit', 2);

        expect(result[0].scale).toBe(2);  // Scaled down
        expect(result[1].scale).toBe(1);  // Also scaled proportionally
      });
    });

    describe('largest strategy', () => {
      it('should scale all to match largest', () => {
        const objects = [
          createTestObject('1', { scale: 0.5 }),
          createTestObject('2', { scale: 1 }),
          createTestObject('3', { scale: 2 }),
        ];

        const result = normalizeScales(objects, 'largest');

        expect(result.every((o) => o.scale === 2)).toBe(true);
      });
    });
  });

  describe('scaleAll', () => {
    it('should multiply all scales by factor', () => {
      const objects = [
        createTestObject('1', { scale: 1 }),
        createTestObject('2', { scale: 2 }),
      ];

      const result = scaleAll(objects, 2);

      expect(result[0].scale).toBe(2);
      expect(result[1].scale).toBe(4);
    });

    it('should handle zero factor', () => {
      const objects = [createTestObject('1', { scale: 1 })];

      const result = scaleAll(objects, 0);

      expect(result[0].scale).toBe(0);
    });

    it('should handle fractional factor', () => {
      const objects = [createTestObject('1', { scale: 4 })];

      const result = scaleAll(objects, 0.25);

      expect(result[0].scale).toBe(1);
    });
  });

  describe('alignToCamera', () => {
    it('should rotate objects to face camera position', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
      ];
      const cameraPosition: Vec3 = { x: 0, y: 2, z: -5 };

      const result = alignToCamera(objects, cameraPosition);

      // Object at origin facing camera at -Z should have rotation Y ~PI
      // (In Three.js, Y=0 faces +Z, so facing -Z requires Y=PI)
      expect(Math.abs(result[0].rotation.y)).toBeCloseTo(Math.PI, 1);
    });

    it('should calculate correct angle for off-center objects', () => {
      const objects = [
        createTestObject('1', { position: { x: 5, y: 0, z: 0 } }),
      ];
      const cameraPosition: Vec3 = { x: 0, y: 0, z: 0 };

      const result = alignToCamera(objects, cameraPosition);

      // Object to the right of camera should face left (negative X)
      expect(result[0].rotation.y).toBeCloseTo(-Math.PI / 2, 1);
    });

    it('should preserve X and Z rotations', () => {
      const objects = [
        createTestObject('1', { rotation: { x: 0.5, y: 0, z: 0.3 } }),
      ];

      const result = alignToCamera(objects);

      expect(result[0].rotation.x).toBe(0.5);
      expect(result[0].rotation.z).toBe(0.3);
    });
  });

  describe('alignToPoint', () => {
    it('should rotate objects to face target point', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: -5 } }),
      ];
      const target: Vec3 = { x: 0, y: 0, z: 0 };

      const result = alignToPoint(objects, target);

      // Object at -Z facing origin should have Y rotation ~0
      expect(result[0].rotation.y).toBeCloseTo(0, 1);
    });

    it('should work with multiple objects', () => {
      const objects = [
        createTestObject('1', { position: { x: 5, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: -5, y: 0, z: 0 } }),
      ];
      const target: Vec3 = { x: 0, y: 0, z: 0 };

      const result = alignToPoint(objects, target);

      // Objects on opposite sides should face opposite directions
      expect(result[0].rotation.y).toBeCloseTo(-result[1].rotation.y, 1);
    });
  });

  describe('alignOutward', () => {
    it('should rotate objects to face away from center', () => {
      const objects = [
        createTestObject('1', { position: { x: 5, y: 0, z: 0 } }),
      ];
      const center: Vec3 = { x: 0, y: 0, z: 0 };

      const result = alignOutward(objects, center);

      // Object at +X should face +X direction
      expect(result[0].rotation.y).toBeCloseTo(Math.PI / 2, 1);
    });

    it('should use default center at origin', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 5 } }),
      ];

      const result = alignOutward(objects);

      // Object at +Z should face +Z direction
      expect(result[0].rotation.y).toBeCloseTo(0, 1);
    });
  });

  describe('alignInward', () => {
    it('should rotate objects to face toward center', () => {
      const objects = [
        createTestObject('1', { position: { x: 5, y: 0, z: 0 } }),
      ];
      const center: Vec3 = { x: 0, y: 0, z: 0 };

      const result = alignInward(objects, center);

      // Object at +X should face toward -X (center)
      expect(result[0].rotation.y).toBeCloseTo(-Math.PI / 2, 1);
    });

    it('should be opposite of alignOutward', () => {
      const objects = [
        createTestObject('1', { position: { x: 3, y: 0, z: 4 } }),
      ];

      const outward = alignOutward(objects);
      const inward = alignInward(objects);

      // Rotations should differ by PI
      const diff = Math.abs(outward[0].rotation.y - inward[0].rotation.y);
      expect(diff).toBeCloseTo(Math.PI, 1);
    });
  });

  describe('resetRotations', () => {
    it('should zero all rotations', () => {
      const objects = [
        createTestObject('1', { rotation: { x: 1, y: 2, z: 3 } }),
        createTestObject('2', { rotation: { x: 0.5, y: 1.5, z: 2.5 } }),
      ];

      const result = resetRotations(objects);

      result.forEach((obj) => {
        expect(obj.rotation).toEqual({ x: 0, y: 0, z: 0 });
      });
    });

    it('should preserve positions and scales', () => {
      const objects = [
        createTestObject('1', {
          position: { x: 1, y: 2, z: 3 },
          scale: 2,
          rotation: { x: 1, y: 1, z: 1 },
        }),
      ];

      const result = resetRotations(objects);

      expect(result[0].position).toEqual({ x: 1, y: 2, z: 3 });
      expect(result[0].scale).toBe(2);
    });
  });

  describe('rotateAll', () => {
    it('should add rotation offset to all objects', () => {
      const objects = [
        createTestObject('1', { rotation: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { rotation: { x: 0.5, y: 0.5, z: 0.5 } }),
      ];
      const offset: Vec3 = { x: 0.1, y: 0.2, z: 0.3 };

      const result = rotateAll(objects, offset);

      expect(result[0].rotation).toEqual({ x: 0.1, y: 0.2, z: 0.3 });
      expect(result[1].rotation).toEqual({ x: 0.6, y: 0.7, z: 0.8 });
    });

    it('should handle negative offsets', () => {
      const objects = [
        createTestObject('1', { rotation: { x: 1, y: 1, z: 1 } }),
      ];
      const offset: Vec3 = { x: -0.5, y: -0.5, z: -0.5 };

      const result = rotateAll(objects, offset);

      expect(result[0].rotation).toEqual({ x: 0.5, y: 0.5, z: 0.5 });
    });
  });

  describe('translateAll', () => {
    it('should move all objects by offset', () => {
      const objects = [
        createTestObject('1', { position: { x: 0, y: 0, z: 0 } }),
        createTestObject('2', { position: { x: 5, y: 5, z: 5 } }),
      ];
      const offset: Vec3 = { x: 1, y: 2, z: 3 };

      const result = translateAll(objects, offset);

      expect(result[0].position).toEqual({ x: 1, y: 2, z: 3 });
      expect(result[1].position).toEqual({ x: 6, y: 7, z: 8 });
    });

    it('should handle negative offsets', () => {
      const objects = [
        createTestObject('1', { position: { x: 5, y: 5, z: 5 } }),
      ];
      const offset: Vec3 = { x: -10, y: -10, z: -10 };

      const result = translateAll(objects, offset);

      expect(result[0].position).toEqual({ x: -5, y: -5, z: -5 });
    });

    it('should preserve rotations and scales', () => {
      const objects = [
        createTestObject('1', {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 1, y: 2, z: 3 },
          scale: 2,
        }),
      ];

      const result = translateAll(objects, { x: 1, y: 1, z: 1 });

      expect(result[0].rotation).toEqual({ x: 1, y: 2, z: 3 });
      expect(result[0].scale).toBe(2);
    });
  });
});
