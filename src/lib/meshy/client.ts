import type {
  MeshyTask,
  MeshyTaskStatus,
  MeshyCreateTaskRequest,
  MeshyArtStyle,
} from '@/types';

// ============================================================================
// Configuration
// ============================================================================

const MESHY_API_BASE = 'https://api.meshy.ai/v2';
const DEFAULT_POLL_INTERVAL_MS = 5000;
// 10 minutes PER STAGE (preview and refine each get their own window). 5 min proved too tight in
// prod 2026-07-02: under Meshy load both stages crawled past 300s at 99% and our own watchdog
// failed jobs whose tasks then completed server-side anyway (Meshy dedups identical creates back
// to the live task, so the abandonment wasn't billed twice — but the job still failed for nothing).
const DEFAULT_MAX_POLL_TIME_MS = 600000;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY_MS = 1000;

// ============================================================================
// Error Types
// ============================================================================

export class MeshyError extends Error {
  constructor(
    message: string,
    public readonly code: MeshyErrorCode,
    public readonly statusCode?: number,
    public readonly taskId?: string
  ) {
    super(message);
    this.name = 'MeshyError';
  }
}

export type MeshyErrorCode =
  | 'API_KEY_MISSING'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'TASK_FAILED'
  | 'TASK_EXPIRED'
  | 'INVALID_RESPONSE'
  | 'MAX_RETRIES_EXCEEDED';

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  shouldRetry: (error: unknown) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: DEFAULT_MAX_RETRIES,
  initialDelayMs: DEFAULT_INITIAL_DELAY_MS,
  maxDelayMs: 30000,
  shouldRetry: (error: unknown): boolean => {
    if (error instanceof MeshyError) {
      // Retry on network errors, rate limits, and 5xx status codes
      return (
        error.code === 'NETWORK_ERROR' ||
        error.statusCode === 429 ||
        (error.statusCode !== undefined && error.statusCode >= 500)
      );
    }
    return false;
  },
};

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.3 + 0.85; // 0.85-1.15
      await sleep(delay * jitter);
      delay = Math.min(delay * 2, opts.maxDelayMs);
    }
  }

  throw new MeshyError(
    'Max retries exceeded',
    'MAX_RETRIES_EXCEEDED',
    undefined,
    undefined
  );
}

// ============================================================================
// Task-Level Retry (server-side transient failures)
// ============================================================================
// The HTTP retry above never sees these: Meshy can accept a task and then fail it
// server-side (status FAILED) with a "please retry" style task_error — observed live
// 2026-07-02 as "The generation service is temporarily unavailable. Please retry.".
// Failed tasks aren't billed, so recreating one is credit-safe; a fresh task only
// bills if it succeeds. TIMEOUT is deliberately NOT retried: the original task may
// still complete (and bill) server-side, so recreating it risks double spend.

const TRANSIENT_TASK_ERROR =
  /temporarily unavailable|please retry|try again|internal (server )?error/i;

/** Waits between task recreations; length = extra attempts after the first. */
const TASK_RETRY_DELAYS_MS = [30_000, 60_000];

function isTransientTaskFailure(error: unknown): boolean {
  return (
    error instanceof MeshyError &&
    error.code === 'TASK_FAILED' &&
    TRANSIENT_TASK_ERROR.test(error.message)
  );
}

/**
 * Run one create-task+wait stage, recreating the task when Meshy fails it
 * server-side with a transient error.
 */
async function withTaskRetry<T>(stage: string, run: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= TASK_RETRY_DELAYS_MS.length || !isTransientTaskFailure(error)) {
        throw error;
      }
      const delayMs = TASK_RETRY_DELAYS_MS[attempt];
      console.log(
        `[MESHY] ${stage}: transient server-side task failure (${(error as Error).message}) — ` +
          `recreating task in ${delayMs / 1000}s (retry ${attempt + 1}/${TASK_RETRY_DELAYS_MS.length})`
      );
      await sleep(delayMs);
    }
  }
}

// ============================================================================
// API Client
// ============================================================================

function getApiKey(): string {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    throw new MeshyError(
      'MESHY_API_KEY environment variable is not set',
      'API_KEY_MISSING'
    );
  }
  return apiKey;
}

async function meshyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  const url = `${MESHY_API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = `Meshy API error: ${response.status} ${response.statusText}`;

      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.message) {
          message = parsed.message;
        }
      } catch {
        // Use default message if parsing fails
      }

      throw new MeshyError(message, 'API_ERROR', response.status);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof MeshyError) {
      throw error;
    }

    // Network or parsing error
    throw new MeshyError(
      error instanceof Error ? error.message : 'Network request failed',
      'NETWORK_ERROR'
    );
  }
}

// ============================================================================
// Public API
// ============================================================================

export interface CreateMeshTaskOptions {
  prompt: string;
  artStyle?: MeshyArtStyle;
  negativePrompt?: string;
  mode?: 'preview' | 'refine';
  /** For refine mode: the preview task ID to refine */
  previewTaskId?: string;
  /** For refine mode: enable PBR maps (metallic, roughness, normal) */
  enablePbr?: boolean;
  /** For refine mode: additional text prompt to guide texturing */
  texturePrompt?: string;
}

/** Response from Meshy task creation */
interface MeshyCreateResponse {
  result: string;  // Task ID
}

/**
 * Create a new text-to-3D mesh generation task
 */
export async function createMeshTask(
  options: CreateMeshTaskOptions
): Promise<MeshyTask> {
  const {
    prompt,
    artStyle = 'realistic',
    negativePrompt,
    mode = 'preview',
    previewTaskId,
    enablePbr = true,
    texturePrompt,
  } = options;

  if (mode === 'refine') {
    if (!previewTaskId) {
      throw new MeshyError('previewTaskId is required for refine mode', 'API_ERROR');
    }
    console.log(`[MESHY] Creating refine task for preview: ${previewTaskId} (enable_pbr: ${enablePbr})`);

    const requestBody = {
      mode: 'refine',
      preview_task_id: previewTaskId,
      enable_pbr: enablePbr,
      ...(texturePrompt && { texture_prompt: texturePrompt }),
    };

    const response = await withRetry(() =>
      meshyFetch<MeshyCreateResponse>('/text-to-3d', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
    );

    console.log(`[MESHY] Refine task created: ${response.result}`);
    return getMeshTaskStatus(response.result);
  }

  // Preview mode
  console.log(`[MESHY] Creating task: "${prompt}" (art_style: ${artStyle}, mode: ${mode})`);

  const requestBody: MeshyCreateTaskRequest = {
    mode,
    prompt,
    art_style: artStyle,
    ...(negativePrompt && { negative_prompt: negativePrompt }),
  };

  // Create task returns { result: taskId }
  const response = await withRetry(() =>
    meshyFetch<MeshyCreateResponse>('/text-to-3d', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })
  );

  console.log(`[MESHY] Task created: ${response.result}`);

  // Fetch the actual task status
  return getMeshTaskStatus(response.result);
}

/**
 * Get the current status of a mesh task
 */
export async function getMeshTaskStatus(taskId: string): Promise<MeshyTask> {
  return withRetry(() => meshyFetch<MeshyTask>(`/text-to-3d/${taskId}`));
}

export interface WaitForMeshOptions {
  pollIntervalMs?: number;
  maxWaitTimeMs?: number;
  onProgress?: (task: MeshyTask) => void;
}

/**
 * Wait for a mesh task to complete, polling at regular intervals
 */
export async function waitForMesh(
  taskId: string,
  options: WaitForMeshOptions = {}
): Promise<MeshyTask> {
  const {
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    maxWaitTimeMs = DEFAULT_MAX_POLL_TIME_MS,
    onProgress,
  } = options;

  console.log(`[MESHY] Waiting for task ${taskId} (poll interval: ${pollIntervalMs}ms, max wait: ${maxWaitTimeMs}ms)`);
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const task = await getMeshTaskStatus(taskId);

    if (onProgress) {
      onProgress(task);
    }

    switch (task.status) {
      case 'SUCCEEDED':
        console.log(`[MESHY] Task ${taskId} complete: ${task.model_urls?.glb ?? 'no URL'}`);
        return task;

      case 'FAILED':
        console.log(`[MESHY] Task ${taskId} failed: ${task.task_error?.message ?? 'Unknown error'}`);
        throw new MeshyError(
          task.task_error?.message ?? 'Mesh generation failed',
          'TASK_FAILED',
          undefined,
          taskId
        );

      case 'EXPIRED':
        console.log(`[MESHY] Task ${taskId} expired`);
        throw new MeshyError(
          'Mesh task expired before completion',
          'TASK_EXPIRED',
          undefined,
          taskId
        );

      case 'PENDING':
      case 'IN_PROGRESS':
        // Continue polling
        console.log(`[MESHY] Task ${taskId} progress: ${task.progress ?? 0}%`);
        await sleep(pollIntervalMs);
        break;

      default:
        console.log(`[MESHY] Task ${taskId} unknown status: ${task.status}`);
        throw new MeshyError(
          `Unknown task status: ${task.status}`,
          'INVALID_RESPONSE',
          undefined,
          taskId
        );
    }
  }

  console.log(`[MESHY] Task ${taskId} timed out after ${maxWaitTimeMs}ms`);
  throw new MeshyError(
    `Mesh generation timed out after ${maxWaitTimeMs}ms`,
    'TIMEOUT',
    undefined,
    taskId
  );
}

export type MeshFormat = 'glb' | 'fbx' | 'usdz' | 'obj';

/**
 * Get the URL for a completed mesh in the specified format
 */
export function getMeshUrl(task: MeshyTask, format: MeshFormat = 'glb'): string {
  if (task.status !== 'SUCCEEDED') {
    throw new MeshyError(
      `Cannot get mesh URL: task status is ${task.status}, expected SUCCEEDED`,
      'INVALID_RESPONSE',
      undefined,
      task.id
    );
  }

  if (!task.model_urls) {
    throw new MeshyError(
      'Task succeeded but model_urls is missing',
      'INVALID_RESPONSE',
      undefined,
      task.id
    );
  }

  const url = task.model_urls[format];
  if (!url) {
    throw new MeshyError(
      `Format ${format} not available for this mesh`,
      'INVALID_RESPONSE',
      undefined,
      task.id
    );
  }

  return url;
}

/**
 * Convenience function to create a mesh and wait for completion
 */
export async function generateMesh(
  options: CreateMeshTaskOptions & WaitForMeshOptions
): Promise<MeshyTask> {
  const { pollIntervalMs, maxWaitTimeMs, onProgress, ...createOptions } = options;

  return withTaskRetry('generate', async () => {
    const task = await createMeshTask(createOptions);

    return waitForMesh(task.id, {
      pollIntervalMs,
      maxWaitTimeMs,
      onProgress,
    });
  });
}

export interface GenerateTexturedMeshOptions {
  prompt: string;
  artStyle?: MeshyArtStyle;
  negativePrompt?: string;
  /** Enable PBR maps (metallic, roughness, normal). Defaults to true. */
  enablePbr?: boolean;
  /** Additional text prompt to guide the texturing process */
  texturePrompt?: string;
  /** Poll interval in milliseconds */
  pollIntervalMs?: number;
  /** Max wait time in milliseconds */
  maxWaitTimeMs?: number;
  /** Progress callback for preview stage and refine stage */
  onProgress?: (task: MeshyTask, stage: 'preview' | 'refine') => void;
}

/**
 * Generate a fully textured mesh using preview → refine workflow
 *
 * This is the recommended way to generate high-quality textured meshes.
 * The workflow:
 * 1. Create preview task (generates untextured geometry)
 * 2. Wait for preview to complete
 * 3. Create refine task (adds textures based on prompt)
 * 4. Wait for refine to complete
 * 5. Return the textured mesh
 */
export async function generateTexturedMesh(
  options: GenerateTexturedMeshOptions
): Promise<MeshyTask> {
  const {
    prompt,
    artStyle,
    negativePrompt,
    enablePbr = true,
    texturePrompt,
    pollIntervalMs,
    maxWaitTimeMs,
    onProgress,
  } = options;

  console.log(`[MESHY] Starting textured mesh generation: "${prompt}"`);

  // Stage 1: Preview (geometry generation). Retried as its own stage so a transient
  // server-side failure here never touches (or re-bills) a later refine.
  console.log('[MESHY] Stage 1: Creating preview task...');
  const completedPreview = await withTaskRetry('preview', async () => {
    const previewTask = await createMeshTask({
      prompt,
      artStyle,
      negativePrompt,
      mode: 'preview',
    });

    return waitForMesh(previewTask.id, {
      pollIntervalMs,
      maxWaitTimeMs,
      onProgress: (task) => {
        onProgress?.(task, 'preview');
      },
    });
  });

  console.log(`[MESHY] Stage 1 complete: Preview task ${completedPreview.id}`);

  // Stage 2: Refine (texture generation). Retried independently: a transient refine
  // failure recreates only the refine task — the completed (paid) preview is reused.
  console.log('[MESHY] Stage 2: Creating refine task...');
  const completedRefine = await withTaskRetry('refine', async () => {
    const refineTask = await createMeshTask({
      prompt, // Not used for refine, but kept for type consistency
      mode: 'refine',
      previewTaskId: completedPreview.id,
      enablePbr,
      texturePrompt: texturePrompt ?? prompt, // Use original prompt if no texture prompt
    });

    return waitForMesh(refineTask.id, {
      pollIntervalMs,
      maxWaitTimeMs,
      onProgress: (task) => {
        onProgress?.(task, 'refine');
      },
    });
  });

  console.log(`[MESHY] Stage 2 complete: Refine task ${completedRefine.id}`);
  console.log(`[MESHY] Textured mesh ready: ${completedRefine.model_urls?.glb ?? 'no URL'}`);

  return completedRefine;
}
