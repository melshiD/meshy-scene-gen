/**
 * Layout Constraints
 *
 * Functions for enforcing physical constraints on object positions:
 * - Ground plane alignment
 * - Overlap prevention
 * - Bounding box calculations
 */

import type { SceneObject, Vec3 } from '@/types';

/** Bounding box representation */
export interface BoundingBox {
  min: Vec3;
  max: Vec3;
  center: Vec3;
  size: Vec3;
}

/**
 * Estimate bounding box for an object based on scale
 * In a real implementation, this would use actual mesh bounds
 *
 * @param object - Scene object
 * @param baseSize - Assumed base size of normalized mesh (default 1 unit)
 * @returns Estimated bounding box
 */
export function calculateBoundingBox(
  object: SceneObject,
  baseSize: number = 1
): BoundingBox {
  const halfSize = (baseSize * object.scale) / 2;
  const { position } = object;

  return {
    min: {
      x: position.x - halfSize,
      y: position.y,
      z: position.z - halfSize,
    },
    max: {
      x: position.x + halfSize,
      y: position.y + baseSize * object.scale,
      z: position.z + halfSize,
    },
    center: {
      x: position.x,
      y: position.y + halfSize,
      z: position.z,
    },
    size: {
      x: baseSize * object.scale,
      y: baseSize * object.scale,
      z: baseSize * object.scale,
    },
  };
}

/**
 * Calculate the combined bounding box of multiple objects
 *
 * @param objects - Array of scene objects
 * @returns Combined bounding box encompassing all objects
 */
export function calculateGroupBoundingBox(objects: SceneObject[]): BoundingBox {
  if (objects.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      center: { x: 0, y: 0, z: 0 },
      size: { x: 0, y: 0, z: 0 },
    };
  }

  const bounds = objects.map((obj) => calculateBoundingBox(obj));

  const min: Vec3 = {
    x: Math.min(...bounds.map((b) => b.min.x)),
    y: Math.min(...bounds.map((b) => b.min.y)),
    z: Math.min(...bounds.map((b) => b.min.z)),
  };

  const max: Vec3 = {
    x: Math.max(...bounds.map((b) => b.max.x)),
    y: Math.max(...bounds.map((b) => b.max.y)),
    z: Math.max(...bounds.map((b) => b.max.z)),
  };

  return {
    min,
    max,
    center: {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2,
    },
    size: {
      x: max.x - min.x,
      y: max.y - min.y,
      z: max.z - min.z,
    },
  };
}

/**
 * Enforce ground plane constraint - set Y position to align bottom of objects at Y=0
 *
 * @param objects - Scene objects to constrain
 * @param groundLevel - Y coordinate of ground (default 0)
 * @returns Objects with positions adjusted to sit on ground plane
 */
export function enforceGroundPlane(
  objects: SceneObject[],
  groundLevel: number = 0
): SceneObject[] {
  return objects.map((obj) => {
    // Object position is assumed to be at object center-bottom
    // Adjust Y to sit on ground plane
    if (obj.position.y < groundLevel) {
      return {
        ...obj,
        position: {
          ...obj.position,
          y: groundLevel,
        },
      };
    }
    return obj;
  });
}

/**
 * Calculate distance between two objects' centers (XZ plane only)
 */
function horizontalDistance(a: SceneObject, b: SceneObject): number {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate required separation based on object scales
 */
function requiredSeparation(a: SceneObject, b: SceneObject, minSpacing: number): number {
  // Approximate radius based on scale
  const radiusA = a.scale * 0.5;
  const radiusB = b.scale * 0.5;
  return radiusA + radiusB + minSpacing;
}

/**
 * Prevent overlap between objects by ensuring minimum spacing
 * Uses iterative relaxation to push overlapping objects apart
 *
 * @param objects - Scene objects to check
 * @param minSpacing - Minimum distance between object edges
 * @param maxIterations - Maximum relaxation iterations
 * @returns Objects with adjusted positions to prevent overlaps
 */
export function preventOverlap(
  objects: SceneObject[],
  minSpacing: number = 0.5,
  maxIterations: number = 10
): SceneObject[] {
  if (objects.length < 2) {
    return objects;
  }

  // Create mutable copy of positions
  const positions = objects.map((obj) => ({ ...obj.position }));

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasOverlap = false;

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const objA = { ...objects[i], position: positions[i] };
        const objB = { ...objects[j], position: positions[j] };

        const distance = horizontalDistance(objA, objB);
        const required = requiredSeparation(objA, objB, minSpacing);

        if (distance < required) {
          hasOverlap = true;

          // Direction from A to B
          const dx = positions[j].x - positions[i].x;
          const dz = positions[j].z - positions[i].z;
          const len = Math.sqrt(dx * dx + dz * dz);

          if (len > 0.001) {
            // Calculate push direction and amount
            const overlap = required - distance;
            const pushAmount = overlap / 2;

            const nx = dx / len;
            const nz = dz / len;

            // Push apart
            positions[i].x -= nx * pushAmount;
            positions[i].z -= nz * pushAmount;
            positions[j].x += nx * pushAmount;
            positions[j].z += nz * pushAmount;
          } else {
            // Objects at same position - push in arbitrary direction
            // Push both objects apart, each by half the required distance
            positions[i].x -= required / 2;
            positions[j].x += required / 2;
          }
        }
      }
    }

    if (!hasOverlap) {
      break;
    }
  }

  // Return objects with updated positions
  return objects.map((obj, i) => ({
    ...obj,
    position: positions[i],
  }));
}

/**
 * Check if two objects overlap
 *
 * @param a - First object
 * @param b - Second object
 * @param margin - Additional margin to consider (default 0)
 * @returns True if objects overlap
 */
export function checkOverlap(
  a: SceneObject,
  b: SceneObject,
  margin: number = 0
): boolean {
  const distance = horizontalDistance(a, b);
  const required = requiredSeparation(a, b, margin);
  return distance < required;
}

/**
 * Find all overlapping pairs in a set of objects
 *
 * @param objects - Scene objects to check
 * @param margin - Additional margin to consider
 * @returns Array of overlapping object ID pairs
 */
export function findOverlaps(
  objects: SceneObject[],
  margin: number = 0
): Array<[string, string]> {
  const overlaps: Array<[string, string]> = [];

  for (let i = 0; i < objects.length; i++) {
    for (let j = i + 1; j < objects.length; j++) {
      if (checkOverlap(objects[i], objects[j], margin)) {
        overlaps.push([objects[i].id, objects[j].id]);
      }
    }
  }

  return overlaps;
}

/**
 * Constrain objects to stay within a boundary radius
 *
 * @param objects - Scene objects
 * @param center - Center point of boundary
 * @param radius - Maximum distance from center
 * @returns Objects constrained within boundary
 */
export function constrainToBoundary(
  objects: SceneObject[],
  center: Vec3,
  radius: number
): SceneObject[] {
  return objects.map((obj) => {
    const dx = obj.position.x - center.x;
    const dz = obj.position.z - center.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > radius && distance > 0.001) {
      // Move object to boundary
      const scale = radius / distance;
      return {
        ...obj,
        position: {
          x: center.x + dx * scale,
          y: obj.position.y,
          z: center.z + dz * scale,
        },
      };
    }

    return obj;
  });
}
