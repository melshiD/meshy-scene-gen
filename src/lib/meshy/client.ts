/**
 * Meshy API Client
 *
 * Handles text-to-3D mesh generation via Meshy.ai API
 * https://docs.meshy.ai/api
 */

import type {
  MeshyTask,
  MeshyTaskStatus,
  MeshyArtStyle,
  MeshyCreateTaskRequest,
} from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface MeshyClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface CreateTaskOptions {
  prompt: string;
  artStyle?: MeshyArtStyle;
  negativePrompt?: string;
  mode?: 'preview' | 'refine';
}

export interface PollOptions {
  /** Polling interval in ms (default: 5000) */
  interval?: number;
  /** Max wait time in ms (default: 300000 = 5 minutes) */
  timeout?: number;
  /** Callback on progress update */
  onProgress?: (progress: number, status: MeshyTaskStatus) => void;
}

export interface MeshyError extends Error {
  statusCode?: number;
  response?: unknown;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_URL = 'https://api.meshy.ai/v2';
const DEFAULT_POLL_INTERVAL = 5000;
const DEFAULT_POLL_TIMEOUT = 300000;

// ============================================================================
// Client Implementation
// ============================================================================

/**
 * Creates a Meshy API client instance
 */
export function createMeshyClient(config: MeshyClientConfig): MeshyClient {
  return new MeshyClient(config);
}

export class MeshyClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MeshyClientConfig) {
    if (!config.apiKey) {
      throw new Error('Meshy API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  /**
   * Create a text-to-3D task
   */
  async createTask(options: CreateTaskOptions): Promise<MeshyTask> {
    const body: MeshyCreateTaskRequest = {
      mode: options.mode ?? 'preview',
      prompt: options.prompt,
      art_style: options.artStyle ?? 'realistic',
      negative_prompt: options.negativePrompt,
    };

    const response = await this.request<{ result: string }>(
      '/text-to-3d',
      'POST',
      body
    );

    // API returns { result: taskId }
    return this.getTask(response.result);
  }

  /**
   * Get task status and details
   */
  async getTask(taskId: string): Promise<MeshyTask> {
    return this.request<MeshyTask>(`/text-to-3d/${taskId}`, 'GET');
  }

  /**
   * Poll task until completion or failure
   */
  async pollUntilComplete(
    taskId: string,
    options: PollOptions = {}
  ): Promise<MeshyTask> {
    const interval = options.interval ?? DEFAULT_POLL_INTERVAL;
    const timeout = options.timeout ?? DEFAULT_POLL_TIMEOUT;
    const startTime = Date.now();

    while (true) {
      const task = await this.getTask(taskId);

      if (options.onProgress) {
        options.onProgress(task.progress ?? 0, task.status);
      }

      if (task.status === 'SUCCEEDED') {
        return task;
      }

      if (task.status === 'FAILED') {
        const error = new Error(
          task.task_error?.message ?? 'Meshy task failed'
        ) as MeshyError;
        error.response = task;
        throw error;
      }

      if (task.status === 'EXPIRED') {
        const error = new Error('Meshy task expired') as MeshyError;
        error.response = task;
        throw error;
      }

      if (Date.now() - startTime > timeout) {
        const error = new Error(
          `Meshy task polling timed out after ${timeout}ms`
        ) as MeshyError;
        error.response = task;
        throw error;
      }

      await sleep(interval);
    }
  }

  /**
   * Create task and poll until complete (convenience method)
   */
  async generateMesh(
    options: CreateTaskOptions,
    pollOptions?: PollOptions
  ): Promise<MeshyTask> {
    const task = await this.createTask(options);
    return this.pollUntilComplete(task.id, pollOptions);
  }

  /**
   * Refine an existing preview task to higher quality
   */
  async refineTask(previewTaskId: string): Promise<MeshyTask> {
    const response = await this.request<{ result: string }>(
      '/text-to-3d',
      'POST',
      {
        mode: 'refine',
        preview_task_id: previewTaskId,
      }
    );

    return this.getTask(response.result);
  }

  /**
   * List recent tasks
   */
  async listTasks(
    options: { pageNum?: number; pageSize?: number } = {}
  ): Promise<MeshyTask[]> {
    const params = new URLSearchParams();
    if (options.pageNum) params.set('pageNum', String(options.pageNum));
    if (options.pageSize) params.set('pageSize', String(options.pageSize));

    const query = params.toString();
    const endpoint = query ? `/text-to-3d?${query}` : '/text-to-3d';

    return this.request<MeshyTask[]>(endpoint, 'GET');
  }

  /**
   * Make authenticated request to Meshy API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST',
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorMessage = `Meshy API error: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        // Ignore JSON parse errors
      }

      const error = new Error(errorMessage) as MeshyError;
      error.statusCode = response.status;
      throw error;
    }

    return response.json();
  }
}

// ============================================================================
// Helpers
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a client from environment variables
 */
export function createMeshyClientFromEnv(): MeshyClient {
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) {
    throw new Error('MESHY_API_KEY environment variable is required');
  }
  return createMeshyClient({ apiKey });
}

/**
 * Check if a task is in a terminal state
 */
export function isTaskComplete(status: MeshyTaskStatus): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'EXPIRED';
}

/**
 * Check if a task is still processing
 */
export function isTaskPending(status: MeshyTaskStatus): boolean {
  return status === 'PENDING' || status === 'IN_PROGRESS';
}

/**
 * Get GLB URL from completed task
 */
export function getGlbUrl(task: MeshyTask): string | null {
  return task.model_urls?.glb ?? null;
}
