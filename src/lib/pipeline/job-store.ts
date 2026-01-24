import type { GeneratedAsset, JobStatus } from '@/types';

/**
 * In-memory job store for tracking generation jobs.
 * In production, this would be replaced with Redis or a database.
 */

const jobs: Map<string, GeneratedAsset> = new Map();

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
 * Update job with completion data
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
