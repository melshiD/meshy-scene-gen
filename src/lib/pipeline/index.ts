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
  composeAndCapture,
  validateRequest,
  type GenerateAssetResult,
  type GenerateAssetOptions,
} from './generate-asset';

// Job management
export {
  createJob,
  getJob,
  updateJobStatus,
  completeJob,
  failJob,
  listJobs,
  deleteJob,
  clearJobs,
} from './job-store';
