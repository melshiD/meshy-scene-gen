/**
 * Image Generation Module
 *
 * Provides prompt parsing and background generation capabilities
 * for the 3D scene generator.
 *
 * @module image-gen
 */

// Prompt Parser exports
export { decomposePrompt, createManualPrompt, isValidDecomposedPrompt } from './prompt-parser';

// Background Generator exports
export {
  generateBackground,
  generateBackgroundWithMood,
  isValidSize,
  isValidQuality,
} from './background';

// Type re-exports for convenience
export type {
  BackgroundImageSize,
  BackgroundImageQuality,
  BackgroundConfig,
  GenerateBackgroundResult,
} from './background';
