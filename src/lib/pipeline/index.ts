/**
 * Pipeline Module
 *
 * Main orchestration for the 3D scene generation pipeline.
 * Coordinates Meshy (3D mesh), DALL-E (background), and Three.js (composition).
 *
 * @example
 * ```typescript
 * import { startGenerationJob, getJobStatus } from '@/lib/pipeline';
 *
 * // Start a job
 * const jobId = await startGenerationJob({
 *   prompt: 'crystal dragon on misty mountain',
 *   preset: 'hero'
 * });
 *
 * // Check status later
 * const job = getJobStatus(jobId);
 * if (job?.status === 'completed') {
 *   console.log(job.assets);
 * }
 * ```
 */

// Main generation functions
export {
  generateAsset,
  startGenerationJob,
  getJobStatus,
  parsePrompts,
  generateAssets,
  validateRequest,
  type GenerateAssetResult,
  type GenerateAssetOptions,
  // Multi-object generation
  validateMultiObjectRequest,
  isMultiObjectRequest,
  startMultiObjectGenerationJob,
  buildSceneObjectsFromJob,
  getMultiObjectJobStatus,
  type MultiObjectGenerateOptions,
} from './generate-asset';

// Job management
export {
  createJob,
  getJob,
  updateJobStatus,
  completeJob,
  completeServerSideJob,
  addCapturesAndComplete,
  failJob,
  listJobs,
  deleteJob,
  clearJobs,
  // Multi-object job management
  createMultiObjectJob,
  getMultiObjectJob,
  updateMultiObjectJobStatus,
  updateBackgroundStatus,
  updateObjectStatus,
  isMultiObjectJobComplete,
  completeMultiObjectJob,
  failMultiObjectJob,
  listMultiObjectJobs,
  deleteMultiObjectJob,
  clearMultiObjectJobs,
  getMultiObjectJobProgress,
} from './job-store';

// Layout utilities
export {
  calculateLayout,
  applyLayoutToObjects,
  getLayoutDefaults,
} from './layout';
