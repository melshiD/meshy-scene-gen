/**
 * Background Image Generation
 *
 * GPT-image powered background generation for 3D scenes
 */

export {
  BackgroundClient,
  createBackgroundClient,
  createBackgroundClientFromEnv,
  enhanceBackgroundPrompt,
  listMoods,
  getMoodDescription,
  isValidSize,
  type BackgroundClientConfig,
  type GenerateBackgroundOptions,
  type GeneratedBackground,
  type BackgroundError,
  type ImageSize,
  type ImageQuality,
  type BackgroundMood,
} from './client';
