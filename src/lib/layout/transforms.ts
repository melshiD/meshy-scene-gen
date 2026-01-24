/**
 * Layout Transforms
 *
 * Transform operations for scene objects:
 * - Centering
 * - Scale normalization
 * - Camera alignment
 */

import type { SceneObject, Vec3 } from '@/types';
import { calculateGroupBoundingBox } from './constraints';

/**
 * Center a group of objects around a point
 *
 * @param objects - Scene objects to center
 * @param targetCenter - Point to center around (default origin)
 * @returns Objects with adjusted positions
 */
export function centerObjects(
  objects: SceneObject[],
  targetCenter: Vec3 = { x: 0, y: 0, z: 0 }
): SceneObject[] {
  if (objects.length === 0) {
    return [];
  }

  const bounds = calculateGroupBoundingBox(objects);

  // Calculate offset to move current center to target center
  const offset: Vec3 = {
    x: targetCenter.x - bounds.center.x,
    y: 0, // Don't adjust Y to preserve ground plane
    z: targetCenter.z - bounds.center.z,
  };

  return objects.map((obj) => ({
    ...obj,
    position: {
      x: obj.position.x + offset.x,
      y: obj.position.y + offset.y,
      z: obj.position.z + offset.z,
    },
  }));
}

/**
 * Center objects with Y adjustment (full 3D centering)
 *
 * @param objects - Scene objects to center
 * @param targetCenter - Point to center around
 * @returns Objects with adjusted positions in all axes
 */
export function centerObjects3D(
  objects: SceneObject[],
  targetCenter: Vec3 = { x: 0, y: 0, z: 0 }
): SceneObject[] {
  if (objects.length === 0) {
    return [];
  }

  const bounds = calculateGroupBoundingBox(objects);

  const offset: Vec3 = {
    x: targetCenter.x - bounds.center.x,
    y: targetCenter.y - bounds.center.y,
    z: targetCenter.z - bounds.center.z,
  };

  return objects.map((obj) => ({
    ...obj,
    position: {
      x: obj.position.x + offset.x,
      y: obj.position.y + offset.y,
      z: obj.position.z + offset.z,
    },
  }));
}

/** Scale normalization strategy */
export type NormalizeStrategy =
  | 'uniform'     // All objects same scale
  | 'relative'    // Maintain relative proportions
  | 'fit'         // Fit all within max size
  | 'largest';    // Scale to match largest

/**
 * Normalize scales of objects
 *
 * @param objects - Scene objects
 * @param strategy - Normalization strategy
 * @param targetScale - Target scale value (meaning depends on strategy)
 * @returns Objects with adjusted scales
 */
export function normalizeScales(
  objects: SceneObject[],
  strategy: NormalizeStrategy = 'relative',
  targetScale: number = 1
): SceneObject[] {
  if (objects.length === 0) {
    return [];
  }

  const scales = objects.map((obj) => obj.scale);
  const maxScale = Math.max(...scales);
  const minScale = Math.min(...scales);

  switch (strategy) {
    case 'uniform':
      // All objects get the same scale
      return objects.map((obj) => ({
        ...obj,
        scale: targetScale,
      }));

    case 'relative':
      // Maintain proportions, scale largest to targetScale
      if (maxScale === 0) return objects;
      const relativeMultiplier = targetScale / maxScale;
      return objects.map((obj) => ({
        ...obj,
        scale: obj.scale * relativeMultiplier,
      }));

    case 'fit':
      // Scale all to fit within targetScale, maintaining proportions
      if (maxScale === 0) return objects;
      const fitMultiplier = Math.min(targetScale / maxScale, 1);
      return objects.map((obj) => ({
        ...obj,
        scale: obj.scale * fitMultiplier,
      }));

    case 'largest':
      // Scale smaller objects to match the largest
      return objects.map((obj) => ({
        ...obj,
        scale: maxScale,
      }));

    default:
      return objects;
  }
}

/**
 * Scale all objects by a factor
 *
 * @param objects - Scene objects
 * @param factor - Scale multiplier
 * @returns Objects with adjusted scales
 */
export function scaleAll(objects: SceneObject[], factor: number): SceneObject[] {
  return objects.map((obj) => ({
    ...obj,
    scale: obj.scale * factor,
  }));
}

/**
 * Align objects to face the camera
 * Assumes camera is looking toward positive Z from negative Z
 *
 * @param objects - Scene objects
 * @param cameraPosition - Camera position in world space
 * @returns Objects rotated to face camera
 */
export function alignToCamera(
  objects: SceneObject[],
  cameraPosition: Vec3 = { x: 0, y: 2, z: -5 }
): SceneObject[] {
  return objects.map((obj) => {
    // Calculate angle from object to camera (XZ plane)
    const dx = cameraPosition.x - obj.position.x;
    const dz = cameraPosition.z - obj.position.z;
    const angle = Math.atan2(dx, dz);

    return {
      ...obj,
      rotation: {
        x: obj.rotation.x,
        y: angle,
        z: obj.rotation.z,
      },
    };
  });
}

/**
 * Align all objects to face a point
 *
 * @param objects - Scene objects
 * @param target - Point to face
 * @returns Objects rotated to face target
 */
export function alignToPoint(objects: SceneObject[], target: Vec3): SceneObject[] {
  return objects.map((obj) => {
    const dx = target.x - obj.position.x;
    const dz = target.z - obj.position.z;
    const angle = Math.atan2(dx, dz);

    return {
      ...obj,
      rotation: {
        x: obj.rotation.x,
        y: angle,
        z: obj.rotation.z,
      },
    };
  });
}

/**
 * Align objects to face outward from center
 *
 * @param objects - Scene objects
 * @param center - Center point to face away from
 * @returns Objects rotated to face outward
 */
export function alignOutward(
  objects: SceneObject[],
  center: Vec3 = { x: 0, y: 0, z: 0 }
): SceneObject[] {
  return objects.map((obj) => {
    const dx = obj.position.x - center.x;
    const dz = obj.position.z - center.z;
    const angle = Math.atan2(dx, dz);

    return {
      ...obj,
      rotation: {
        x: obj.rotation.x,
        y: angle,
        z: obj.rotation.z,
      },
    };
  });
}

/**
 * Align objects to face inward toward center
 *
 * @param objects - Scene objects
 * @param center - Center point to face
 * @returns Objects rotated to face inward
 */
export function alignInward(
  objects: SceneObject[],
  center: Vec3 = { x: 0, y: 0, z: 0 }
): SceneObject[] {
  return objects.map((obj) => {
    const dx = center.x - obj.position.x;
    const dz = center.z - obj.position.z;
    const angle = Math.atan2(dx, dz);

    return {
      ...obj,
      rotation: {
        x: obj.rotation.x,
        y: angle,
        z: obj.rotation.z,
      },
    };
  });
}

/**
 * Reset rotations to default (facing forward)
 *
 * @param objects - Scene objects
 * @returns Objects with zeroed rotations
 */
export function resetRotations(objects: SceneObject[]): SceneObject[] {
  return objects.map((obj) => ({
    ...obj,
    rotation: { x: 0, y: 0, z: 0 },
  }));
}

/**
 * Apply a uniform rotation offset to all objects
 *
 * @param objects - Scene objects
 * @param rotation - Rotation to add
 * @returns Objects with adjusted rotations
 */
export function rotateAll(objects: SceneObject[], rotation: Vec3): SceneObject[] {
  return objects.map((obj) => ({
    ...obj,
    rotation: {
      x: obj.rotation.x + rotation.x,
      y: obj.rotation.y + rotation.y,
      z: obj.rotation.z + rotation.z,
    },
  }));
}

/**
 * Translate all objects by an offset
 *
 * @param objects - Scene objects
 * @param offset - Translation offset
 * @returns Objects with adjusted positions
 */
export function translateAll(objects: SceneObject[], offset: Vec3): SceneObject[] {
  return objects.map((obj) => ({
    ...obj,
    position: {
      x: obj.position.x + offset.x,
      y: obj.position.y + offset.y,
      z: obj.position.z + offset.z,
    },
  }));
}
