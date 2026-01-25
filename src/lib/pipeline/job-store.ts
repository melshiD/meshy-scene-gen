import type {
  GeneratedAsset,
  JobStatus,
  MultiObjectGenerationJob,
  ObjectGenerationStatus,
  LayoutPreset,
} from '@/types';

/**
 * In-memory job store for tracking generation jobs.
 * In production, this would be replaced with Redis or a database.
 */

const jobs: Map<string, GeneratedAsset> = new Map();
const multiObjectJobs: Map<string, MultiObjectGenerationJob> = new Map();

/**
 * Create a new job entry
 */
export function createJob(params: {
  prompt: string;
  objectPrompt?: string;
  backgroundPrompt?: string;
  presetId?: string;
}): GeneratedAsset {
  const id = generateJobId();
  const job: GeneratedAsset = {
    id,
    status: 'pending',
    prompt: params.prompt,
    objectPrompt: params.objectPrompt,
    backgroundPrompt: params.backgroundPrompt,
    presetId: params.presetId,
    createdAt: new Date(),
  };
  jobs.set(id, job);
  return job;
}

/**
 * Get a job by ID
 */
export function getJob(id: string): GeneratedAsset | undefined {
  return jobs.get(id);
}

/**
 * Update job status
 */
export function updateJobStatus(id: string, status: JobStatus): void {
  const job = jobs.get(id);
  if (job) {
    job.status = status;
  }
}

/**
 * Update job with completion data (full completion with captures)
 */
export function completeJob(
  id: string,
  assets: { full: string; web: string; thumb: string },
  meshUrl: string
): void {
  const job = jobs.get(id);
  if (job) {
    job.status = 'completed';
    job.assets = assets;
    job.meshUrl = meshUrl;
    job.completedAt = new Date();
  }
}

/**
 * Mark server-side generation complete (assets ready, awaiting client capture)
 *
 * Sets status to 'processing' with meshUrl and backgroundUrl populated.
 * Client should load these into Three.js and POST captures to /api/captures.
 */
export function completeServerSideJob(
  id: string,
  meshUrl: string,
  backgroundUrl: string
): void {
  const job = jobs.get(id);
  if (job) {
    // Keep status as 'processing' - client still needs to capture
    job.meshUrl = meshUrl;
    job.backgroundUrl = backgroundUrl;
  }
}

/**
 * Add captures to a job and mark complete
 */
export function addCapturesAndComplete(
  id: string,
  assets: { full: string; web: string; thumb: string }
): void {
  const job = jobs.get(id);
  if (job) {
    job.status = 'completed';
    job.assets = assets;
    job.completedAt = new Date();
  }
}

/**
 * Mark job as failed
 */
export function failJob(id: string, error: string): void {
  const job = jobs.get(id);
  if (job) {
    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();
  }
}

/**
 * List all jobs (most recent first)
 */
export function listJobs(limit = 100): GeneratedAsset[] {
  return Array.from(jobs.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Delete a job
 */
export function deleteJob(id: string): boolean {
  return jobs.delete(id);
}

/**
 * Clear all jobs (for testing)
 */
export function clearJobs(): void {
  jobs.clear();
}

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================================
// Multi-Object Job Store
// ============================================================================

/**
 * Create a new multi-object generation job
 */
export function createMultiObjectJob(params: {
  backgroundPrompt: string;
  objects: Array<{ prompt: string; artStyle?: string }>;
  layoutPreset?: LayoutPreset;
  scenePreset?: string;
}): MultiObjectGenerationJob {
  const id = generateJobId();
  const job: MultiObjectGenerationJob = {
    id,
    status: 'pending',
    background: {
      status: 'pending',
    },
    objects: params.objects.map((obj, index) => ({
      id: `obj-${index}`,
      prompt: obj.prompt,
      status: 'pending' as JobStatus,
    })),
    createdAt: new Date(),
  };
  multiObjectJobs.set(id, job);
  return job;
}

/**
 * Get a multi-object job by ID
 */
export function getMultiObjectJob(id: string): MultiObjectGenerationJob | undefined {
  return multiObjectJobs.get(id);
}

/**
 * Update multi-object job status
 */
export function updateMultiObjectJobStatus(id: string, status: JobStatus): void {
  const job = multiObjectJobs.get(id);
  if (job) {
    job.status = status;
  }
}

/**
 * Update background status for a multi-object job
 */
export function updateBackgroundStatus(
  jobId: string,
  status: JobStatus,
  url?: string,
  error?: string
): void {
  const job = multiObjectJobs.get(jobId);
  if (job) {
    job.background.status = status;
    if (url) job.background.url = url;
    if (error) job.background.error = error;
  }
}

/**
 * Update object status for a multi-object job
 */
export function updateObjectStatus(
  jobId: string,
  objectId: string,
  status: JobStatus,
  progress?: number,
  meshUrl?: string,
  error?: string
): void {
  const job = multiObjectJobs.get(jobId);
  if (job) {
    const obj = job.objects.find((o) => o.id === objectId);
    if (obj) {
      obj.status = status;
      if (progress !== undefined) obj.progress = progress;
      if (meshUrl) obj.meshUrl = meshUrl;
      if (error) obj.error = error;
    }
  }
}

/**
 * Check if all components of a multi-object job are complete
 */
export function isMultiObjectJobComplete(jobId: string): boolean {
  const job = multiObjectJobs.get(jobId);
  if (!job) return false;

  const bgDone = job.background.status === 'completed' || job.background.status === 'failed';
  const objsDone = job.objects.every(
    (obj) => obj.status === 'completed' || obj.status === 'failed'
  );
  return bgDone && objsDone;
}

/**
 * Complete a multi-object job
 */
export function completeMultiObjectJob(jobId: string): void {
  const job = multiObjectJobs.get(jobId);
  if (job) {
    // Determine overall status based on components
    const bgFailed = job.background.status === 'failed';
    const anyObjFailed = job.objects.some((obj) => obj.status === 'failed');

    job.status = bgFailed || anyObjFailed ? 'failed' : 'completed';
    job.completedAt = new Date();
  }
}

/**
 * Mark a multi-object job as failed
 */
export function failMultiObjectJob(jobId: string, error: string): void {
  const job = multiObjectJobs.get(jobId);
  if (job) {
    job.status = 'failed';
    job.completedAt = new Date();
    // Mark any pending items as failed
    if (job.background.status === 'pending' || job.background.status === 'processing') {
      job.background.status = 'failed';
      job.background.error = error;
    }
    for (const obj of job.objects) {
      if (obj.status === 'pending' || obj.status === 'processing') {
        obj.status = 'failed';
        obj.error = error;
      }
    }
  }
}

/**
 * List all multi-object jobs (most recent first)
 */
export function listMultiObjectJobs(limit = 100): MultiObjectGenerationJob[] {
  return Array.from(multiObjectJobs.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Delete a multi-object job
 */
export function deleteMultiObjectJob(id: string): boolean {
  return multiObjectJobs.delete(id);
}

/**
 * Clear all multi-object jobs (for testing)
 */
export function clearMultiObjectJobs(): void {
  multiObjectJobs.clear();
}

/**
 * Calculate overall progress for a multi-object job
 */
export function getMultiObjectJobProgress(jobId: string): number {
  const job = multiObjectJobs.get(jobId);
  if (!job) return 0;

  // Weight: background = 20%, objects = 80% (split evenly)
  const bgWeight = 0.2;
  const objWeight = 0.8 / Math.max(job.objects.length, 1);

  let progress = 0;

  // Background progress
  if (job.background.status === 'completed') {
    progress += bgWeight * 100;
  } else if (job.background.status === 'processing') {
    progress += bgWeight * 50; // Assume 50% while processing
  }

  // Object progress
  for (const obj of job.objects) {
    if (obj.status === 'completed') {
      progress += objWeight * 100;
    } else if (obj.status === 'processing') {
      progress += objWeight * (obj.progress ?? 50);
    }
  }

  return Math.round(progress);
}
