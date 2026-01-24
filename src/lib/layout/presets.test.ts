import { describe, it, expect } from 'vitest';
import type { LayoutConfig } from '@/types';
import {
  centeredLayout,
  gridLayout,
  circularLayout,
  semicircleLayout,
  pyramidLayout,
  scatteredLayout,
  lineLayout,
  clusterLayout,
  getLayoutPositions,
  LAYOUT_PRESETS,
} from './presets';

const DEFAULT_CONFIG: LayoutConfig = {
  preset: 'centered',
  spacing: 1.0,
  groundPlane: true,
  centerPoint: { x: 0, y: 0, z: 0 },
  radius: 2.0,
};

describe('presets', () => {
  describe('centeredLayout', () => {
    it('should place single object at center point', () => {
      const positions = centeredLayout(1, DEFAULT_CONFIG);

      expect(positions).toHaveLength(1);
      expect(positions[0].position).toEqual({ x: 0, y: 0, z: 0 });
      expect(positions[0].rotation).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should stack multiple objects vertically', () => {
      const positions = centeredLayout(3, DEFAULT_CONFIG);

      expect(positions).toHaveLength(3);
      // Objects should be stacked with spacing of 1.0
      expect(positions[0].position.y).toBeLessThan(positions[1].position.y);
      expect(positions[1].position.y).toBeLessThan(positions[2].position.y);
      // All at same X and Z
      expect(positions.every((p) => p.position.x === 0)).toBe(true);
      expect(positions.every((p) => p.position.z === 0)).toBe(true);
    });

    it('should respect custom center point', () => {
      const config: LayoutConfig = {
        ...DEFAULT_CONFIG,
        centerPoint: { x: 5, y: 2, z: -3 },
      };
      const positions = centeredLayout(1, config);

      expect(positions[0].position.x).toBe(5);
      expect(positions[0].position.y).toBe(2);
      expect(positions[0].position.z).toBe(-3);
    });

    it('should return empty array for zero objects', () => {
      const positions = centeredLayout(0, DEFAULT_CONFIG);
      expect(positions).toHaveLength(0);
    });
  });

  describe('gridLayout', () => {
    it('should arrange 4 objects in 2x2 grid', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, cols: 2 };
      const positions = gridLayout(4, config);

      expect(positions).toHaveLength(4);
      // Check grid arrangement
      const xs = positions.map((p) => p.position.x);
      const zs = positions.map((p) => p.position.z);
      expect(new Set(xs).size).toBe(2); // 2 unique X values
      expect(new Set(zs).size).toBe(2); // 2 unique Z values
    });

    it('should center grid around centerPoint', () => {
      const config: LayoutConfig = {
        ...DEFAULT_CONFIG,
        centerPoint: { x: 0, y: 0, z: 0 },
        cols: 2,
      };
      const positions = gridLayout(4, config);

      // Average position should be near center
      const avgX = positions.reduce((sum, p) => sum + p.position.x, 0) / 4;
      const avgZ = positions.reduce((sum, p) => sum + p.position.z, 0) / 4;
      expect(avgX).toBeCloseTo(0, 5);
      expect(avgZ).toBeCloseTo(0, 5);
    });

    it('should use spacing for grid cells', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, spacing: 2, cols: 2 };
      const positions = gridLayout(4, config);

      // Distance between columns should be spacing
      const col0 = positions.filter((_, i) => i % 2 === 0)[0].position.x;
      const col1 = positions.filter((_, i) => i % 2 === 1)[0].position.x;
      expect(Math.abs(col1 - col0)).toBeCloseTo(2, 5);
    });

    it('should auto-calculate columns when not specified', () => {
      const positions = gridLayout(9, DEFAULT_CONFIG);

      expect(positions).toHaveLength(9);
      // sqrt(9) = 3, so should be 3x3
      const uniqueXs = new Set(positions.map((p) => p.position.x.toFixed(2)));
      expect(uniqueXs.size).toBe(3);
    });

    it('should keep all objects at ground level', () => {
      const positions = gridLayout(4, DEFAULT_CONFIG);
      expect(positions.every((p) => p.position.y === 0)).toBe(true);
    });
  });

  describe('circularLayout', () => {
    it('should place single object at center', () => {
      const positions = circularLayout(1, DEFAULT_CONFIG);

      expect(positions).toHaveLength(1);
      expect(positions[0].position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should arrange objects in a circle with given radius', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, radius: 3 };
      const positions = circularLayout(4, config);

      expect(positions).toHaveLength(4);
      // All objects should be at radius distance from center
      positions.forEach((p) => {
        const distance = Math.sqrt(p.position.x ** 2 + p.position.z ** 2);
        expect(distance).toBeCloseTo(3, 5);
      });
    });

    it('should evenly distribute objects around circle', () => {
      const positions = circularLayout(4, DEFAULT_CONFIG);

      // Angular spacing should be 90 degrees (PI/2)
      for (let i = 0; i < positions.length; i++) {
        const next = (i + 1) % positions.length;
        const angle1 = Math.atan2(positions[i].position.z, positions[i].position.x);
        const angle2 = Math.atan2(positions[next].position.z, positions[next].position.x);
        let diff = angle2 - angle1;
        if (diff < 0) diff += 2 * Math.PI;
        expect(diff).toBeCloseTo(Math.PI / 2, 1);
      }
    });

    it('should rotate objects to face center', () => {
      const positions = circularLayout(4, DEFAULT_CONFIG);

      // Rotation Y should point toward center
      positions.forEach((p) => {
        const expectedAngle = -Math.atan2(p.position.z, p.position.x) - Math.PI / 2;
        // Normalize angles for comparison
        const normalizedExpected = ((expectedAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const normalizedActual = ((p.rotation.y % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        expect(normalizedActual).toBeCloseTo(normalizedExpected, 1);
      });
    });
  });

  describe('semicircleLayout', () => {
    it('should place single object at center', () => {
      const positions = semicircleLayout(1, DEFAULT_CONFIG);

      expect(positions).toHaveLength(1);
      expect(positions[0].position).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should spread objects across 180 degrees', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, radius: 2 };
      const positions = semicircleLayout(3, config);

      expect(positions).toHaveLength(3);
      // Semicircle spans from -PI/2 to +PI/2 (left to right when viewed from front)
      // First object at -PI/2: (cos(-PI/2)*r, 0, sin(-PI/2)*r) = (0, 0, -2)
      // Last object at +PI/2: (cos(PI/2)*r, 0, sin(PI/2)*r) = (0, 0, 2)
      expect(positions[0].position.z).toBeCloseTo(-2, 5); // Back
      expect(positions[2].position.z).toBeCloseTo(2, 5);  // Front
    });

    it('should place all objects at correct radius', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, radius: 3 };
      const positions = semicircleLayout(5, config);

      positions.forEach((p) => {
        const distance = Math.sqrt(p.position.x ** 2 + p.position.z ** 2);
        expect(distance).toBeCloseTo(3, 5);
      });
    });

    it('should have all objects facing forward (Y rotation = 0)', () => {
      const positions = semicircleLayout(5, DEFAULT_CONFIG);

      positions.forEach((p) => {
        expect(p.rotation.y).toBe(0);
      });
    });
  });

  describe('pyramidLayout', () => {
    it('should stack objects in layers', () => {
      const positions = pyramidLayout(6, DEFAULT_CONFIG);

      expect(positions).toHaveLength(6);
      // Should have objects at different Y levels
      const uniqueYs = new Set(positions.map((p) => p.position.y.toFixed(2)));
      expect(uniqueYs.size).toBeGreaterThan(1);
    });

    it('should place fewer objects on higher layers', () => {
      const positions = pyramidLayout(10, DEFAULT_CONFIG);

      // Group by Y position (layer)
      const layers = new Map<string, number>();
      positions.forEach((p) => {
        const key = p.position.y.toFixed(2);
        layers.set(key, (layers.get(key) || 0) + 1);
      });

      const layerCounts = Array.from(layers.entries())
        .sort(([a], [b]) => parseFloat(a) - parseFloat(b))
        .map(([, count]) => count);

      // Should have multiple layers
      expect(layerCounts.length).toBeGreaterThan(1);
      // Bottom layer (first) should not be smaller than top layer (last)
      expect(layerCounts[0]).toBeGreaterThanOrEqual(layerCounts[layerCounts.length - 1]);
    });

    it('should start from ground level', () => {
      const positions = pyramidLayout(3, DEFAULT_CONFIG);
      const minY = Math.min(...positions.map((p) => p.position.y));
      expect(minY).toBe(0);
    });
  });

  describe('scatteredLayout', () => {
    it('should place objects within radius', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, radius: 3 };
      const positions = scatteredLayout(10, config);

      positions.forEach((p) => {
        const distance = Math.sqrt(p.position.x ** 2 + p.position.z ** 2);
        expect(distance).toBeLessThanOrEqual(3.01); // Small tolerance
      });
    });

    it('should produce same result with same seed', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, randomSeed: 12345 };
      const positions1 = scatteredLayout(5, config);
      const positions2 = scatteredLayout(5, config);

      expect(positions1).toEqual(positions2);
    });

    it('should produce different results with different seeds', () => {
      const config1: LayoutConfig = { ...DEFAULT_CONFIG, randomSeed: 111 };
      const config2: LayoutConfig = { ...DEFAULT_CONFIG, randomSeed: 222 };
      const positions1 = scatteredLayout(5, config1);
      const positions2 = scatteredLayout(5, config2);

      // At least one position should be different
      const isDifferent = positions1.some(
        (p, i) =>
          p.position.x !== positions2[i].position.x ||
          p.position.z !== positions2[i].position.z
      );
      expect(isDifferent).toBe(true);
    });

    it('should apply random rotations', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, randomSeed: 42 };
      const positions = scatteredLayout(5, config);

      const rotations = positions.map((p) => p.rotation.y);
      const uniqueRotations = new Set(rotations.map((r) => r.toFixed(2)));
      expect(uniqueRotations.size).toBeGreaterThan(1);
    });
  });

  describe('lineLayout', () => {
    it('should arrange objects in a line along X axis', () => {
      const positions = lineLayout(3, DEFAULT_CONFIG);

      expect(positions).toHaveLength(3);
      // All at same Z
      expect(positions.every((p) => p.position.z === 0)).toBe(true);
      // All at same Y
      expect(positions.every((p) => p.position.y === 0)).toBe(true);
    });

    it('should center line around centerPoint', () => {
      const positions = lineLayout(3, DEFAULT_CONFIG);

      const avgX = positions.reduce((sum, p) => sum + p.position.x, 0) / 3;
      expect(avgX).toBeCloseTo(0, 5);
    });

    it('should use spacing between objects', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, spacing: 2 };
      const positions = lineLayout(3, config);

      // Distance between adjacent objects should be spacing
      for (let i = 0; i < positions.length - 1; i++) {
        const dist = positions[i + 1].position.x - positions[i].position.x;
        expect(dist).toBeCloseTo(2, 5);
      }
    });

    it('should respect custom center point', () => {
      const config: LayoutConfig = {
        ...DEFAULT_CONFIG,
        centerPoint: { x: 10, y: 0, z: 5 },
      };
      const positions = lineLayout(3, config);

      expect(positions.every((p) => p.position.z === 5)).toBe(true);
      const avgX = positions.reduce((sum, p) => sum + p.position.x, 0) / 3;
      expect(avgX).toBeCloseTo(10, 5);
    });
  });

  describe('clusterLayout', () => {
    it('should place objects close together', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, spacing: 2 };
      const positions = clusterLayout(5, config);

      // All objects should be within tight radius
      const clusterRadius = config.spacing * 0.3;
      positions.forEach((p) => {
        const distance = Math.sqrt(p.position.x ** 2 + p.position.z ** 2);
        expect(distance).toBeLessThanOrEqual(clusterRadius + 0.01);
      });
    });

    it('should have slight Y variation', () => {
      const positions = clusterLayout(10, DEFAULT_CONFIG);

      const uniqueYs = new Set(positions.map((p) => p.position.y.toFixed(4)));
      expect(uniqueYs.size).toBeGreaterThan(1);
    });

    it('should have slight rotation variation', () => {
      const positions = clusterLayout(10, DEFAULT_CONFIG);

      const uniqueRotations = new Set(positions.map((p) => p.rotation.y.toFixed(4)));
      expect(uniqueRotations.size).toBeGreaterThan(1);
    });

    it('should be reproducible with same seed', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, randomSeed: 999 };
      const positions1 = clusterLayout(5, config);
      const positions2 = clusterLayout(5, config);

      expect(positions1).toEqual(positions2);
    });
  });

  describe('LAYOUT_PRESETS', () => {
    it('should have all preset functions', () => {
      expect(LAYOUT_PRESETS.centered).toBe(centeredLayout);
      expect(LAYOUT_PRESETS.grid).toBe(gridLayout);
      expect(LAYOUT_PRESETS.circular).toBe(circularLayout);
      expect(LAYOUT_PRESETS.semicircle).toBe(semicircleLayout);
      expect(LAYOUT_PRESETS.pyramid).toBe(pyramidLayout);
      expect(LAYOUT_PRESETS.scattered).toBe(scatteredLayout);
      expect(LAYOUT_PRESETS.line).toBe(lineLayout);
      expect(LAYOUT_PRESETS.cluster).toBe(clusterLayout);
    });
  });

  describe('getLayoutPositions', () => {
    it('should return positions for known presets', () => {
      const presets = ['centered', 'grid', 'circular', 'semicircle', 'pyramid', 'scattered', 'line', 'cluster'] as const;

      presets.forEach((preset) => {
        const config: LayoutConfig = { ...DEFAULT_CONFIG, preset };
        const positions = getLayoutPositions(preset, 3, config);
        expect(positions).toHaveLength(3);
      });
    });

    it('should return center positions for custom preset', () => {
      const config: LayoutConfig = { ...DEFAULT_CONFIG, preset: 'custom' };
      const positions = getLayoutPositions('custom', 3, config);

      expect(positions).toHaveLength(3);
      // All at center point for manual positioning
      positions.forEach((p) => {
        expect(p.position).toEqual(config.centerPoint);
      });
    });
  });
});
