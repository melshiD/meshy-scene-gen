/**
 * Layout Presets
 *
 * Each preset defines how to position N objects in 3D space.
 * Positions are calculated relative to a center point with configurable spacing.
 */

import type { Vec3, LayoutConfig, LayoutPreset } from '@/types';

/** Position result for a single object */
export interface LayoutPosition {
  position: Vec3;
  rotation: Vec3;
}

/** Layout function signature */
export type LayoutFunction = (
  count: number,
  config: LayoutConfig
) => LayoutPosition[];

/**
 * Centered layout - all objects at center point
 * Useful for single objects or stacked arrangements
 */
export function centeredLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, spacing } = config;

  for (let i = 0; i < count; i++) {
    // Stack vertically with spacing if multiple objects
    const yOffset = count > 1 ? (i - (count - 1) / 2) * spacing : 0;
    positions.push({
      position: {
        x: centerPoint.x,
        y: centerPoint.y + yOffset,
        z: centerPoint.z,
      },
      rotation: { x: 0, y: 0, z: 0 },
    });
  }

  return positions;
}

/**
 * Grid layout - arrange objects in rows and columns
 */
export function gridLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, spacing, cols = Math.ceil(Math.sqrt(count)) } = config;
  const rows = Math.ceil(count / cols);

  // Center the grid around centerPoint
  const offsetX = ((cols - 1) * spacing) / 2;
  const offsetZ = ((rows - 1) * spacing) / 2;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    positions.push({
      position: {
        x: centerPoint.x + col * spacing - offsetX,
        y: centerPoint.y,
        z: centerPoint.z + row * spacing - offsetZ,
      },
      rotation: { x: 0, y: 0, z: 0 },
    });
  }

  return positions;
}

/**
 * Circular layout - arrange objects in a circle
 */
export function circularLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, radius } = config;

  if (count === 1) {
    return [{
      position: { ...centerPoint },
      rotation: { x: 0, y: 0, z: 0 },
    }];
  }

  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep - Math.PI / 2; // Start from front
    positions.push({
      position: {
        x: centerPoint.x + Math.cos(angle) * radius,
        y: centerPoint.y,
        z: centerPoint.z + Math.sin(angle) * radius,
      },
      // Face toward center
      rotation: { x: 0, y: -angle - Math.PI / 2, z: 0 },
    });
  }

  return positions;
}

/**
 * Semicircle layout - arrange objects in a half circle facing camera
 */
export function semicircleLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, radius } = config;

  if (count === 1) {
    return [{
      position: { ...centerPoint },
      rotation: { x: 0, y: 0, z: 0 },
    }];
  }

  // Spread across 180 degrees (-90 to +90)
  const angleStep = Math.PI / (count - 1);

  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + i * angleStep;
    positions.push({
      position: {
        x: centerPoint.x + Math.cos(angle) * radius,
        y: centerPoint.y,
        z: centerPoint.z + Math.sin(angle) * radius,
      },
      // Face forward (toward camera at negative Z)
      rotation: { x: 0, y: 0, z: 0 },
    });
  }

  return positions;
}

/**
 * Pyramid layout - stack objects in pyramid formation
 */
export function pyramidLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, spacing } = config;

  // Calculate pyramid layers - bottom has most, top has fewest
  const layers: number[] = [];
  let remaining = count;
  let layerSize = Math.ceil(Math.sqrt(count)); // Start with largest layer

  while (remaining > 0) {
    const thisLayer = Math.min(layerSize, remaining);
    layers.push(thisLayer);
    remaining -= thisLayer;
    // Reduce layer size for next layer (going up)
    layerSize = Math.max(1, layerSize - 1);
  }

  let objectIndex = 0;
  for (let l = 0; l < layers.length; l++) {
    const layerCount = layers[l];
    const cols = Math.ceil(Math.sqrt(layerCount));
    const rows = Math.ceil(layerCount / cols);
    const offsetX = ((cols - 1) * spacing) / 2;
    const offsetZ = ((rows - 1) * spacing) / 2;

    for (let i = 0; i < layerCount && objectIndex < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      positions.push({
        position: {
          x: centerPoint.x + col * spacing - offsetX,
          y: centerPoint.y + l * spacing,
          z: centerPoint.z + row * spacing - offsetZ,
        },
        rotation: { x: 0, y: 0, z: 0 },
      });
      objectIndex++;
    }
  }

  return positions;
}

/**
 * Seeded random number generator for consistent scatter
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Scattered layout - random positions within radius
 */
export function scatteredLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, radius, randomSeed = 42 } = config;
  const random = seededRandom(randomSeed);

  for (let i = 0; i < count; i++) {
    // Random position within circle
    const angle = random() * 2 * Math.PI;
    const distance = Math.sqrt(random()) * radius; // sqrt for uniform distribution
    const yRotation = random() * 2 * Math.PI;

    positions.push({
      position: {
        x: centerPoint.x + Math.cos(angle) * distance,
        y: centerPoint.y,
        z: centerPoint.z + Math.sin(angle) * distance,
      },
      rotation: { x: 0, y: yRotation, z: 0 },
    });
  }

  return positions;
}

/**
 * Line layout - arrange objects in a straight line
 */
export function lineLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, spacing } = config;

  // Center the line around centerPoint
  const totalWidth = (count - 1) * spacing;
  const startX = centerPoint.x - totalWidth / 2;

  for (let i = 0; i < count; i++) {
    positions.push({
      position: {
        x: startX + i * spacing,
        y: centerPoint.y,
        z: centerPoint.z,
      },
      rotation: { x: 0, y: 0, z: 0 },
    });
  }

  return positions;
}

/**
 * Cluster layout - tight grouping with slight random offsets
 */
export function clusterLayout(count: number, config: LayoutConfig): LayoutPosition[] {
  const positions: LayoutPosition[] = [];
  const { centerPoint, spacing, randomSeed = 42 } = config;
  const random = seededRandom(randomSeed);

  // Tight cluster with small offsets
  const clusterRadius = spacing * 0.3;

  for (let i = 0; i < count; i++) {
    const angle = random() * 2 * Math.PI;
    const distance = random() * clusterRadius;
    const yOffset = (random() - 0.5) * spacing * 0.2;

    positions.push({
      position: {
        x: centerPoint.x + Math.cos(angle) * distance,
        y: centerPoint.y + yOffset,
        z: centerPoint.z + Math.sin(angle) * distance,
      },
      rotation: {
        x: 0,
        y: random() * Math.PI * 0.25 - Math.PI * 0.125, // Slight rotation variation
        z: 0,
      },
    });
  }

  return positions;
}

/**
 * Map of preset names to layout functions
 */
export const LAYOUT_PRESETS: Record<Exclude<LayoutPreset, 'custom'>, LayoutFunction> = {
  centered: centeredLayout,
  grid: gridLayout,
  circular: circularLayout,
  semicircle: semicircleLayout,
  pyramid: pyramidLayout,
  scattered: scatteredLayout,
  line: lineLayout,
  cluster: clusterLayout,
};

/**
 * Get positions for a layout preset
 */
export function getLayoutPositions(
  preset: LayoutPreset,
  count: number,
  config: LayoutConfig
): LayoutPosition[] {
  if (preset === 'custom') {
    // Custom preset returns empty - positions are set manually
    return Array(count).fill(null).map(() => ({
      position: { ...config.centerPoint },
      rotation: { x: 0, y: 0, z: 0 },
    }));
  }

  const layoutFn = LAYOUT_PRESETS[preset];
  return layoutFn(count, config);
}
