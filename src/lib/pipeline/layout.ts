import type { Vec3, LayoutPreset, LayoutConfig, SceneObject } from '@/types';

/**
 * Layout utility for positioning multiple objects in a scene
 */

/**
 * Calculate positions for objects based on layout preset
 */
export function calculateLayout(
  objectCount: number,
  config: LayoutConfig
): Vec3[] {
  switch (config.preset) {
    case 'centered':
      return layoutCentered(objectCount, config);
    case 'grid':
      return layoutGrid(objectCount, config);
    case 'circular':
      return layoutCircular(objectCount, config);
    case 'semicircle':
      return layoutSemicircle(objectCount, config);
    case 'pyramid':
      return layoutPyramid(objectCount, config);
    case 'scattered':
      return layoutScattered(objectCount, config);
    case 'line':
      return layoutLine(objectCount, config);
    case 'cluster':
      return layoutCluster(objectCount, config);
    case 'custom':
      return layoutCentered(objectCount, config); // Fallback
    default:
      return layoutCentered(objectCount, config);
  }
}

/**
 * Centered layout - all objects stacked at center (useful for 1-2 objects)
 */
function layoutCentered(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, spacing } = config;

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spacing;
    positions.push({
      x: centerPoint.x + offset,
      y: centerPoint.y,
      z: centerPoint.z,
    });
  }
  return positions;
}

/**
 * Grid layout - arrange objects in a grid pattern
 */
function layoutGrid(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, spacing } = config;
  const cols = config.cols ?? Math.ceil(Math.sqrt(count));
  const rows = config.rows ?? Math.ceil(count / cols);

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const xOffset = (col - (cols - 1) / 2) * spacing;
    const zOffset = (row - (rows - 1) / 2) * spacing;
    positions.push({
      x: centerPoint.x + xOffset,
      y: centerPoint.y,
      z: centerPoint.z + zOffset,
    });
  }
  return positions;
}

/**
 * Circular layout - arrange objects in a circle
 */
function layoutCircular(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, radius } = config;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    positions.push({
      x: centerPoint.x + Math.cos(angle) * radius,
      y: centerPoint.y,
      z: centerPoint.z + Math.sin(angle) * radius,
    });
  }
  return positions;
}

/**
 * Semicircle layout - arrange objects in a half circle facing camera
 */
function layoutSemicircle(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, radius } = config;

  for (let i = 0; i < count; i++) {
    // Spread across 180 degrees (PI radians), centered at front
    const angle = Math.PI + (i / Math.max(count - 1, 1)) * Math.PI;
    positions.push({
      x: centerPoint.x + Math.cos(angle) * radius,
      y: centerPoint.y,
      z: centerPoint.z + Math.sin(angle) * radius,
    });
  }
  return positions;
}

/**
 * Pyramid layout - stack objects in a pyramid formation
 */
function layoutPyramid(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, spacing } = config;

  // Build pyramid row by row
  let remaining = count;
  let row = 0;
  let placed = 0;

  while (remaining > 0) {
    const rowSize = Math.min(row + 1, remaining);
    for (let i = 0; i < rowSize; i++) {
      const xOffset = (i - (rowSize - 1) / 2) * spacing;
      positions.push({
        x: centerPoint.x + xOffset,
        y: centerPoint.y + row * spacing * 0.8,
        z: centerPoint.z - row * spacing * 0.3,
      });
      placed++;
      remaining--;
    }
    row++;
  }
  return positions;
}

/**
 * Scattered layout - pseudo-random positions within radius
 */
function layoutScattered(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, radius, randomSeed = 12345 } = config;

  // Simple seeded random for reproducibility
  let seed = randomSeed;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const dist = random() * radius;
    positions.push({
      x: centerPoint.x + Math.cos(angle) * dist,
      y: centerPoint.y,
      z: centerPoint.z + Math.sin(angle) * dist,
    });
  }
  return positions;
}

/**
 * Line layout - arrange objects in a horizontal line
 */
function layoutLine(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, spacing } = config;

  for (let i = 0; i < count; i++) {
    const xOffset = (i - (count - 1) / 2) * spacing;
    positions.push({
      x: centerPoint.x + xOffset,
      y: centerPoint.y,
      z: centerPoint.z,
    });
  }
  return positions;
}

/**
 * Cluster layout - tight grouping with slight offsets
 */
function layoutCluster(count: number, config: LayoutConfig): Vec3[] {
  const positions: Vec3[] = [];
  const { centerPoint, spacing, randomSeed = 54321 } = config;

  let seed = randomSeed;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280 - 0.5; // -0.5 to 0.5
  };

  for (let i = 0; i < count; i++) {
    positions.push({
      x: centerPoint.x + random() * spacing,
      y: centerPoint.y + random() * spacing * 0.3, // Less vertical variation
      z: centerPoint.z + random() * spacing,
    });
  }
  return positions;
}

/**
 * Apply layout positions to scene objects
 */
export function applyLayoutToObjects(
  objects: SceneObject[],
  config: LayoutConfig
): SceneObject[] {
  const positions = calculateLayout(objects.length, config);
  return objects.map((obj, i) => ({
    ...obj,
    position: positions[i] ?? obj.position,
  }));
}

/**
 * Get default layout config for a preset
 */
export function getLayoutDefaults(preset: LayoutPreset): Partial<LayoutConfig> {
  switch (preset) {
    case 'grid':
      return { spacing: 1.5 };
    case 'circular':
    case 'semicircle':
      return { radius: 2.5 };
    case 'pyramid':
      return { spacing: 1.2 };
    case 'scattered':
      return { radius: 3.0 };
    case 'line':
      return { spacing: 1.5 };
    case 'cluster':
      return { spacing: 0.8 };
    default:
      return { spacing: 1.0 };
  }
}
