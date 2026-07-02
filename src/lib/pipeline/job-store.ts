import type {
  GeneratedAsset,
  JobStatus,
  MultiObjectGenerationJob,
  LayoutPreset,
} from '@/types';
import type {
  Job as PrismaJob,
  MultiObjectJob as PrismaMultiJob,
  MultiObjectObject as PrismaMultiObj,
} from '@prisma/client';
import { ManifestBuilder } from '@/lib/manifest';
import { prisma } from '@/lib/db';

/**
 * Postgres-backed job store (shared Lodestar core-Postgres, via Prisma).
 *
 * Replaces the previous in-memory Map + .next/cache JSON files, which did not survive an ephemeral
 * container restart. Every data function is async now; callers await. `updateMany`/`deleteMany` are
 * used for mutations so a missing id is a no-op (matches the old `if (job) {...}` semantics) rather
 * than throwing P2025.
 *
 * The manifest-builder store at the bottom stays an in-memory Map: it is transient working state held
 * only for the duration of a single in-flight job (single container instance). A restart mid-job drops
 * it — acceptable; completed jobs/scenes/presets are durable in Postgres + R2.
 */

// ---- row -> app-type mappers (Prisma nulls -> undefined; Json cast) ----------------------------

function toGeneratedAsset(r: PrismaJob): GeneratedAsset {
  return {
    id: r.id,
    status: r.status,
    prompt: r.prompt,
    objectPrompt: r.objectPrompt ?? undefined,
    backgroundPrompt: r.backgroundPrompt ?? undefined,
    mood: r.mood ?? undefined,
    presetId: r.presetId ?? undefined,
    assets: (r.assets as GeneratedAsset['assets']) ?? undefined,
    meshUrl: r.meshUrl ?? undefined,
    backgroundUrl: r.backgroundUrl ?? undefined,
    manifestUrl: r.manifestUrl ?? undefined,
    error: r.error ?? undefined,
    createdAt: r.createdAt,
    completedAt: r.completedAt ?? undefined,
  };
}

function toMultiObjectJob(
  r: PrismaMultiJob & { objects: PrismaMultiObj[] }
): MultiObjectGenerationJob {
  return {
    id: r.id,
    status: r.status,
    background: {
      status: r.backgroundStatus,
      url: r.backgroundUrl ?? undefined,
      error: r.backgroundError ?? undefined,
    },
    objects: r.objects.map((o) => ({
      id: o.objectId,
      prompt: o.prompt,
      status: o.status,
      progress: o.progress ?? undefined,
      meshUrl: o.meshUrl ?? undefined,
      error: o.error ?? undefined,
    })),
    createdAt: r.createdAt,
    completedAt: r.completedAt ?? undefined,
  };
}

// ============================================================================
// Single-Object Job Store
// ============================================================================

/**
 * Create a new job entry
 */
export async function createJob(params: {
  prompt: string;
  objectPrompt?: string;
  backgroundPrompt?: string;
  presetId?: string;
}): Promise<GeneratedAsset> {
  const row = await prisma.job.create({
    data: {
      id: generateJobId(),
      status: 'pending',
      prompt: params.prompt,
      objectPrompt: params.objectPrompt,
      backgroundPrompt: params.backgroundPrompt,
      presetId: params.presetId,
    },
  });
  return toGeneratedAsset(row);
}

/**
 * Get a job by ID
 */
export async function getJob(id: string): Promise<GeneratedAsset | undefined> {
  const row = await prisma.job.findUnique({ where: { id } });
  return row ? toGeneratedAsset(row) : undefined;
}

/**
 * Update job status
 */
export async function updateJobStatus(id: string, status: JobStatus): Promise<void> {
  await prisma.job.updateMany({ where: { id }, data: { status } });
}

/**
 * Update job with decomposed prompts after AI parsing
 */
export async function updateJobDecomposedPrompts(
  id: string,
  objectPrompt: string,
  backgroundPrompt: string,
  mood?: string
): Promise<void> {
  await prisma.job.updateMany({
    where: { id },
    data: { objectPrompt, backgroundPrompt, ...(mood ? { mood } : {}) },
  });
}

/**
 * Update job with completion data (full completion with captures)
 */
export async function completeJob(
  id: string,
  assets: { full: string; web: string; thumb: string },
  meshUrl: string
): Promise<void> {
  await prisma.job.updateMany({
    where: { id },
    data: { status: 'completed', assets, meshUrl, completedAt: new Date() },
  });
}

/**
 * Mark server-side generation complete (assets ready, awaiting client capture)
 *
 * Populates meshUrl and backgroundUrl but keeps status as 'processing' — the client still needs to
 * load these into Three.js and POST captures to /api/captures.
 */
export async function completeServerSideJob(
  id: string,
  meshUrl: string,
  backgroundUrl: string
): Promise<void> {
  await prisma.job.updateMany({ where: { id }, data: { meshUrl, backgroundUrl } });
}

/**
 * Add captures to a job and mark complete
 */
export async function addCapturesAndComplete(
  id: string,
  assets: { full: string; web: string; thumb: string }
): Promise<void> {
  await prisma.job.updateMany({
    where: { id },
    data: { status: 'completed', assets, completedAt: new Date() },
  });
}

/**
 * Mark job as failed
 */
export async function failJob(id: string, error: string): Promise<void> {
  await prisma.job.updateMany({
    where: { id },
    data: { status: 'failed', error, completedAt: new Date() },
  });
}

/**
 * List all jobs (most recent first)
 */
export async function listJobs(limit = 100): Promise<GeneratedAsset[]> {
  const rows = await prisma.job.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
  return rows.map(toGeneratedAsset);
}

/**
 * Delete a job
 */
export async function deleteJob(id: string): Promise<boolean> {
  const { count } = await prisma.job.deleteMany({ where: { id } });
  return count > 0;
}

/**
 * Clear all jobs (for testing)
 */
export async function clearJobs(): Promise<void> {
  await prisma.job.deleteMany({});
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
export async function createMultiObjectJob(params: {
  backgroundPrompt: string;
  objects: Array<{ prompt: string; artStyle?: string }>;
  layoutPreset?: LayoutPreset;
  scenePreset?: string;
}): Promise<MultiObjectGenerationJob> {
  const row = await prisma.multiObjectJob.create({
    data: {
      id: generateJobId(),
      status: 'pending',
      backgroundStatus: 'pending',
      objects: {
        create: params.objects.map((obj, index) => ({
          objectId: `obj-${index}`,
          prompt: obj.prompt,
          status: 'pending',
        })),
      },
    },
    include: { objects: { orderBy: { objectId: 'asc' } } },
  });
  return toMultiObjectJob(row);
}

/**
 * Get a multi-object job by ID
 */
export async function getMultiObjectJob(
  id: string
): Promise<MultiObjectGenerationJob | undefined> {
  const row = await prisma.multiObjectJob.findUnique({
    where: { id },
    include: { objects: { orderBy: { objectId: 'asc' } } },
  });
  return row ? toMultiObjectJob(row) : undefined;
}

/**
 * Update multi-object job status
 */
export async function updateMultiObjectJobStatus(id: string, status: JobStatus): Promise<void> {
  await prisma.multiObjectJob.updateMany({ where: { id }, data: { status } });
}

/**
 * Update background status for a multi-object job
 */
export async function updateBackgroundStatus(
  jobId: string,
  status: JobStatus,
  url?: string,
  error?: string
): Promise<void> {
  await prisma.multiObjectJob.updateMany({
    where: { id: jobId },
    data: {
      backgroundStatus: status,
      ...(url ? { backgroundUrl: url } : {}),
      ...(error ? { backgroundError: error } : {}),
    },
  });
}

/**
 * Update object status for a multi-object job
 */
export async function updateObjectStatus(
  jobId: string,
  objectId: string,
  status: JobStatus,
  progress?: number,
  meshUrl?: string,
  error?: string
): Promise<void> {
  await prisma.multiObjectObject.updateMany({
    where: { jobId, objectId },
    data: {
      status,
      ...(progress !== undefined ? { progress } : {}),
      ...(meshUrl ? { meshUrl } : {}),
      ...(error ? { error } : {}),
    },
  });
}

/**
 * Check if all components of a multi-object job are complete
 */
export async function isMultiObjectJobComplete(jobId: string): Promise<boolean> {
  const job = await getMultiObjectJob(jobId);
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
export async function completeMultiObjectJob(jobId: string): Promise<void> {
  const job = await getMultiObjectJob(jobId);
  if (!job) return;

  const bgFailed = job.background.status === 'failed';
  const anyObjFailed = job.objects.some((obj) => obj.status === 'failed');

  await prisma.multiObjectJob.updateMany({
    where: { id: jobId },
    data: {
      status: bgFailed || anyObjFailed ? 'failed' : 'completed',
      completedAt: new Date(),
    },
  });
}

/**
 * Mark a multi-object job as failed
 */
export async function failMultiObjectJob(jobId: string, error: string): Promise<void> {
  // Overall job -> failed. Any still-pending/processing background or objects -> failed with the error.
  await prisma.multiObjectJob.updateMany({
    where: { id: jobId },
    data: { status: 'failed', completedAt: new Date() },
  });
  await prisma.multiObjectJob.updateMany({
    where: { id: jobId, backgroundStatus: { in: ['pending', 'processing'] } },
    data: { backgroundStatus: 'failed', backgroundError: error },
  });
  await prisma.multiObjectObject.updateMany({
    where: { jobId, status: { in: ['pending', 'processing'] } },
    data: { status: 'failed', error },
  });
}

/**
 * List all multi-object jobs (most recent first)
 */
export async function listMultiObjectJobs(limit = 100): Promise<MultiObjectGenerationJob[]> {
  const rows = await prisma.multiObjectJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { objects: { orderBy: { objectId: 'asc' } } },
  });
  return rows.map(toMultiObjectJob);
}

/**
 * Delete a multi-object job
 */
export async function deleteMultiObjectJob(id: string): Promise<boolean> {
  const { count } = await prisma.multiObjectJob.deleteMany({ where: { id } });
  return count > 0;
}

/**
 * Clear all multi-object jobs (for testing)
 */
export async function clearMultiObjectJobs(): Promise<void> {
  await prisma.multiObjectJob.deleteMany({});
}

/**
 * Calculate overall progress for a multi-object job
 */
export async function getMultiObjectJobProgress(jobId: string): Promise<number> {
  const job = await getMultiObjectJob(jobId);
  if (!job) return 0;

  // Weight: background = 20%, objects = 80% (split evenly)
  const bgWeight = 0.2;
  const objWeight = 0.8 / Math.max(job.objects.length, 1);

  let progress = 0;

  if (job.background.status === 'completed') {
    progress += bgWeight * 100;
  } else if (job.background.status === 'processing') {
    progress += bgWeight * 50;
  }

  for (const obj of job.objects) {
    if (obj.status === 'completed') {
      progress += objWeight * 100;
    } else if (obj.status === 'processing') {
      progress += objWeight * (obj.progress ?? 50);
    }
  }

  return Math.round(progress);
}

/**
 * Update job with manifest URL after manifest is saved
 */
export async function updateJobManifestUrl(id: string, manifestUrl: string): Promise<void> {
  await prisma.job.updateMany({ where: { id }, data: { manifestUrl } });
}

// ============================================================================
// Manifest Builder Store (in-memory, transient — see file header)
// ============================================================================

const manifestBuilders: Map<string, ManifestBuilder> = new Map();

/**
 * Get a manifest builder for a job
 */
export function getManifestBuilder(jobId: string): ManifestBuilder | undefined {
  return manifestBuilders.get(jobId);
}

/**
 * Set a manifest builder for a job
 */
export function setManifestBuilder(jobId: string, builder: ManifestBuilder): void {
  manifestBuilders.set(jobId, builder);
}

/**
 * Delete a manifest builder for a job
 */
export function deleteManifestBuilder(jobId: string): void {
  manifestBuilders.delete(jobId);
}
