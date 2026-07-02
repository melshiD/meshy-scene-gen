/**
 * API client for generation endpoints
 */

import type { GenerateRequest, JobStatus, CaptureSceneConfig, CapturesUploadRequest } from '@/types';

// ============================================================================
// Types
// ============================================================================

/** Response from POST /api/generate */
export interface GenerateResponse {
  id: string;
  status: 'pending';
  type: 'single' | 'multi';
  objectCount?: number;
}

/** Response from GET /api/generate/:id for single-object jobs */
export interface SingleJobStatusResponse {
  id: string;
  type: 'single';
  status: JobStatus;
  prompt: string;
  objectPrompt?: string;
  backgroundPrompt?: string;
  presetId?: string;
  assets?: {
    full: string;
    web: string;
    thumb: string;
  };
  meshUrl?: string;
  backgroundUrl?: string;
  manifestUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

/** Response from GET /api/generate/:id for multi-object jobs */
export interface MultiJobStatusResponse {
  id: string;
  type: 'multi';
  status: JobStatus;
  progress: number;
  background: {
    status: JobStatus;
    url?: string;
    error?: string;
  };
  objects: Array<{
    id: string;
    prompt: string;
    status: JobStatus;
    progress?: number;
    meshUrl?: string;
    error?: string;
  }>;
  createdAt: string;
  completedAt?: string;
}

export type JobStatusResponse = SingleJobStatusResponse | MultiJobStatusResponse;

/** Error response */
export interface ErrorResponse {
  error: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Start a new generation job
 */
export async function startGeneration(
  request: GenerateRequest
): Promise<GenerateResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Get the status of a generation job
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`/api/generate/${jobId}`);

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Poll a job until completion or failure
 *
 * For single-object jobs, also returns when meshUrl and backgroundUrl are available
 * (server-side complete, ready for client-side capture).
 */
export async function pollJobUntilComplete(
  jobId: string,
  options: {
    intervalMs?: number;
    maxAttempts?: number;
    onProgress?: (status: JobStatusResponse) => void;
    /** If true, also return when assets are ready but status is still 'processing' */
    returnOnAssetsReady?: boolean;
  } = {}
): Promise<JobStatusResponse> {
  const { intervalMs = 2000, maxAttempts = 300, onProgress, returnOnAssetsReady = true } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getJobStatus(jobId);

    // Call progress callback
    onProgress?.(status);

    // Check if job is complete or failed
    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    // For single-object jobs: check if server-side generation is complete (assets ready)
    if (returnOnAssetsReady && status.type === 'single') {
      const singleStatus = status as SingleJobStatusResponse;
      if (singleStatus.meshUrl && singleStatus.backgroundUrl) {
        // Assets are ready - server-side complete
        return status;
      }
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts++;
  }

  throw new Error('Job polling timed out');
}

/**
 * Determine the current generation stage from job status
 */
/** Response from POST /api/captures */
export interface CapturesResponse {
  success: boolean;
  assets: {
    full: string;
    web: string;
    thumb: string;
  };
  manifestUrl?: string;
}

/**
 * Upload captured scene images with scene configuration
 */
export async function uploadCaptures(
  jobId: string,
  captures: {
    full: string;  // base64 data URL
    web: string;
    thumb: string;
  },
  sceneConfig?: CaptureSceneConfig,
  metadata?: { tags?: string[]; custom?: Record<string, unknown> }
): Promise<CapturesResponse> {
  const body: CapturesUploadRequest = {
    jobId,
    captures,
    sceneConfig,
    metadata,
  };

  const response = await fetch('/api/captures', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Build CaptureSceneConfig from composer store state
 */
export function buildSceneConfigFromState(state: {
  camera: { position: { x: number; y: number; z: number }; fov: number; lookAt: { x: number; y: number; z: number } };
  lighting: { preset: string; intensity: number; color: string };
  object?: { position: { x: number; y: number; z: number }; scale: number; rotation: { x: number; y: number; z: number } };
  objects?: Array<{
    id: string;
    name: string;
    prompt?: string;
    artStyle?: string;
    position: { x: number; y: number; z: number };
    scale: number;
    rotation: { x: number; y: number; z: number };
    visible: boolean;
  }>;
}): CaptureSceneConfig {
  const config: CaptureSceneConfig = {
    camera: {
      position: state.camera.position,
      fov: state.camera.fov,
      lookAt: state.camera.lookAt,
    },
    lighting: {
      preset: state.lighting.preset as CaptureSceneConfig['lighting']['preset'],
      intensity: state.lighting.intensity,
      color: state.lighting.color,
    },
  };

  // For single object scenes
  if (state.object && (!state.objects || state.objects.length === 1)) {
    config.object = {
      position: state.object.position,
      scale: state.object.scale,
      rotation: state.object.rotation,
    };
  }

  // For multi-object scenes
  if (state.objects && state.objects.length > 1) {
    config.objects = state.objects.map(obj => ({
      id: obj.id,
      name: obj.name,
      prompt: obj.prompt ?? '',
      artStyle: obj.artStyle as CaptureSceneConfig['objects'] extends Array<infer T> ? T extends { artStyle?: infer A } ? A : never : never,
      transform: {
        position: obj.position,
        scale: obj.scale,
        rotation: obj.rotation,
      },
      visible: obj.visible,
    }));
  }

  return config;
}

export function getStageFromJobStatus(
  status: JobStatusResponse
): 'starting' | 'decomposing' | 'generating-mesh' | 'generating-background' | 'composing' | 'completed' | 'failed' {
  if (status.status === 'failed') {
    return 'failed';
  }

  if (status.status === 'completed') {
    return 'completed';
  }

  // For single-object jobs, we have limited info
  if (status.type === 'single') {
    // If we have decomposed prompts, we've passed decomposition
    if (status.objectPrompt || status.backgroundPrompt) {
      // If we have meshUrl, mesh is done
      if (status.meshUrl) {
        return 'composing';
      }
      return 'generating-mesh';
    }
    return 'decomposing';
  }

  // For multi-object jobs, we have richer status
  const bgStatus = status.background.status;
  const objectsProcessing = status.objects.some((o) => o.status === 'processing');
  const objectsPending = status.objects.some((o) => o.status === 'pending');
  const allObjectsDone = status.objects.every(
    (o) => o.status === 'completed' || o.status === 'failed'
  );

  // Background in progress
  if (bgStatus === 'processing') {
    return 'generating-background';
  }

  // Objects still generating
  if (objectsProcessing || objectsPending) {
    return 'generating-mesh';
  }

  // All done, composing
  if (allObjectsDone && bgStatus === 'completed') {
    return 'composing';
  }

  return 'generating-mesh';
}
