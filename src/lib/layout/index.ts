/**
 * Layout System
 *
 * Provides automatic arrangement of scene objects using various layout presets
 * and constraint enforcement.
 *
 * @module layout
 */

// Layout presets
export {
  type LayoutPosition,
  type LayoutFunction,
  LAYOUT_PRESETS,
  getLayoutPositions,
  centeredLayout,
  gridLayout,
  circularLayout,
  semicircleLayout,
  pyramidLayout,
  scatteredLayout,
  lineLayout,
  clusterLayout,
} from './presets';

// Auto-arrange functions
export {
  type AutoArrangeOptions,
  applyLayout,
  applyLayoutToSelection,
  compactLayout,
  addAndArrange,
  redistributeSpacing,
} from './auto-arrange';

// Constraints
export {
  type BoundingBox,
  calculateBoundingBox,
  calculateGroupBoundingBox,
  enforceGroundPlane,
  preventOverlap,
  checkOverlap,
  findOverlaps,
  constrainToBoundary,
} from './constraints';

// Transforms
export {
  type NormalizeStrategy,
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
