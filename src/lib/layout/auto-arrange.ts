/**
 * Auto-Arrange Module
 *
 * Applies layout presets to scene objects, calculating positions
 * based on preset type and spacing configuration.
 */

import type { SceneObject, LayoutConfig } from '@/types';
import { getLayoutPositions } from './presets';
import { enforceGroundPlane, preventOverlap } from './constraints';

/** Options for auto-arrange */
export interface AutoArrangeOptions {
  /** Apply ground plane constraint */
  applyGroundPlane?: boolean;
  /** Apply overlap prevention */
  preventOverlaps?: boolean;
  /** Minimum spacing for overlap prevention */
  minSpacing?: number;
  /** Only arrange unlocked objects */
  respectLocks?: boolean;
}

const DEFAULT_OPTIONS: AutoArrangeOptions = {
  applyGroundPlane: true,
  preventOverlaps: true,
  minSpacing: 0.5,
  respectLocks: true,
};

/**
 * Apply a layout preset to scene objects
 *
 * @param objects - Array of scene objects to arrange
 * @param config - Layout configuration with preset and spacing
 * @param options - Additional options for constraints
 * @returns New array of scene objects with updated positions
 */
export function applyLayout(
  objects: SceneObject[],
  config: LayoutConfig,
  options: AutoArrangeOptions = {}
): SceneObject[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (objects.length === 0) {
    return [];
  }

  // Separate locked and unlocked objects
  const lockedObjects = opts.respectLocks
    ? objects.filter((obj) => obj.locked)
    : [];
  const objectsToArrange = opts.respectLocks
    ? objects.filter((obj) => !obj.locked)
    : [...objects];

  // Get layout positions for objects to arrange
  const positions = getLayoutPositions(
    config.preset,
    objectsToArrange.length,
    config
  );

  // Apply positions to objects
  let arrangedObjects = objectsToArrange.map((obj, index) => ({
    ...obj,
    position: positions[index].position,
    rotation: positions[index].rotation,
  }));

  // Apply ground plane constraint if enabled
  if (opts.applyGroundPlane && config.groundPlane) {
    arrangedObjects = enforceGroundPlane(arrangedObjects);
  }

  // Prevent overlaps if enabled
  if (opts.preventOverlaps && opts.minSpacing) {
    arrangedObjects = preventOverlap(arrangedObjects, opts.minSpacing);
  }

  // Combine locked and arranged objects, preserving original order
  const result: SceneObject[] = [];
  let arrangedIndex = 0;
  let lockedIndex = 0;

  for (const original of objects) {
    if (opts.respectLocks && original.locked) {
      result.push(lockedObjects[lockedIndex++]);
    } else {
      result.push(arrangedObjects[arrangedIndex++]);
    }
  }

  return result;
}

/**
 * Apply layout to specific objects by ID
 *
 * @param objects - All scene objects
 * @param ids - IDs of objects to arrange
 * @param config - Layout configuration
 * @param options - Additional options
 * @returns Updated array with selected objects arranged
 */
export function applyLayoutToSelection(
  objects: SceneObject[],
  ids: string[],
  config: LayoutConfig,
  options: AutoArrangeOptions = {}
): SceneObject[] {
  const idSet = new Set(ids);
  const selected = objects.filter((obj) => idSet.has(obj.id));
  const unselected = objects.filter((obj) => !idSet.has(obj.id));

  // Arrange only selected objects
  const arranged = applyLayout(selected, config, {
    ...options,
    respectLocks: false, // Selection overrides locks
  });

  // Merge back, preserving original order
  const result: SceneObject[] = [];
  let arrangedIndex = 0;

  for (const original of objects) {
    if (idSet.has(original.id)) {
      result.push(arranged[arrangedIndex++]);
    } else {
      result.push(original);
    }
  }

  return result;
}

/**
 * Rearrange objects to fill gaps when one is removed
 *
 * @param objects - Scene objects after removal
 * @param config - Layout configuration
 * @param options - Additional options
 * @returns Objects with adjusted positions
 */
export function compactLayout(
  objects: SceneObject[],
  config: LayoutConfig,
  options: AutoArrangeOptions = {}
): SceneObject[] {
  // Simply reapply the layout to fill gaps
  return applyLayout(objects, config, options);
}

/**
 * Add an object and rearrange to accommodate it
 *
 * @param objects - Existing scene objects
 * @param newObject - Object to add
 * @param config - Layout configuration
 * @param options - Additional options
 * @returns Updated array including new object
 */
export function addAndArrange(
  objects: SceneObject[],
  newObject: SceneObject,
  config: LayoutConfig,
  options: AutoArrangeOptions = {}
): SceneObject[] {
  const allObjects = [...objects, newObject];
  return applyLayout(allObjects, config, options);
}

/**
 * Redistribute spacing between objects
 *
 * @param objects - Scene objects
 * @param newSpacing - New spacing value
 * @param config - Current layout configuration
 * @returns Objects with redistributed positions
 */
export function redistributeSpacing(
  objects: SceneObject[],
  newSpacing: number,
  config: LayoutConfig
): SceneObject[] {
  const updatedConfig: LayoutConfig = {
    ...config,
    spacing: newSpacing,
  };
  return applyLayout(objects, updatedConfig);
}
