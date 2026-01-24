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
const DEFAULT_MAX_POLL_TIME_MS = 300000; // 5 minutes
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
      // Retry on network errors and 5xx status codes
      return (
        error.code === 'NETWORK_ERROR' ||
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
}

/**
 * Create a new text-to-3D mesh generation task
 */
export async function createMeshTask(
  options: CreateMeshTaskOptions
): Promise<MeshyTask> {
  const { prompt, artStyle = 'realistic', negativePrompt, mode = 'preview' } = options;

  const requestBody: MeshyCreateTaskRequest = {
    mode,
    prompt,
    art_style: artStyle,
    ...(negativePrompt && { negative_prompt: negativePrompt }),
  };

  return withRetry(() =>
    meshyFetch<MeshyTask>('/text-to-3d', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })
  );
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

  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTimeMs) {
    const task = await getMeshTaskStatus(taskId);

    if (onProgress) {
      onProgress(task);
    }

    switch (task.status) {
      case 'SUCCEEDED':
        return task;

      case 'FAILED':
        throw new MeshyError(
          task.task_error?.message ?? 'Mesh generation failed',
          'TASK_FAILED',
          undefined,
          taskId
        );

      case 'EXPIRED':
        throw new MeshyError(
          'Mesh task expired before completion',
          'TASK_EXPIRED',
          undefined,
          taskId
        );

      case 'PENDING':
      case 'IN_PROGRESS':
        // Continue polling
        await sleep(pollIntervalMs);
        break;

      default:
        throw new MeshyError(
          `Unknown task status: ${task.status}`,
          'INVALID_RESPONSE',
          undefined,
          taskId
        );
    }
  }

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

  const task = await createMeshTask(createOptions);

  return waitForMesh(task.id, {
    pollIntervalMs,
    maxWaitTimeMs,
    onProgress,
  });
}
