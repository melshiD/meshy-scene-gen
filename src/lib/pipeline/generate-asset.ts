import type { GenerateRequest, GeneratedAsset, SceneConfig } from '@/types';
import { decomposePrompt, createManualPrompt, generateBackgroundWithMood } from '@/lib/image-gen';
import { generateMesh, getMeshUrl, type CreateMeshTaskOptions } from '@/lib/meshy';
import { createScene, captureMultiResolution, type MultiCaptureResult } from '@/lib/scene';
import { buildSceneConfig, getPreset, type SceneConfigOverrides } from '@/lib/presets';
import { createJob, updateJobStatus, completeJob, failJob, getJob } from './job-store';

/**
 * Result of asset generation
 */
export interface GenerateAssetResult {
  jobId: string;
  captures: MultiCaptureResult;
  meshUrl: string;
  sceneConfig: SceneConfig;
}

/**
 * Options for asset generation
 */
export interface GenerateAssetOptions {
  /** Callback for progress updates */
  onProgress?: (stage: string, progress: number) => void;
  /** Meshy art style */
  meshArtStyle?: CreateMeshTaskOptions['artStyle'];
  /** Scene dimensions */
  width?: number;
  height?: number;
}

/**
 * Parse the generate request to extract object and background prompts
 */
export async function parsePrompts(
  request: GenerateRequest
): Promise<{ objectPrompt: string; backgroundPrompt: string; mood: string }> {
  // If split prompts provided, use them directly
  if (request.objectPrompt && request.backgroundPrompt) {
    return {
      objectPrompt: request.objectPrompt,
      backgroundPrompt: request.backgroundPrompt,
      mood: 'neutral',
    };
  }

  // If single prompt, decompose with AI
  if (request.prompt) {
    const result = await decomposePrompt(request.prompt);
    if (!result.success) {
      throw new Error(`Failed to decompose prompt: ${result.error}`);
    }
    return {
      objectPrompt: result.data.object,
      backgroundPrompt: result.data.background,
      mood: result.data.mood,
    };
  }

  throw new Error('Either prompt or objectPrompt+backgroundPrompt must be provided');
}

/**
 * Generate 3D mesh and background image in parallel
 */
export async function generateAssets(
  objectPrompt: string,
  backgroundPrompt: string,
  mood: string,
  options?: Pick<GenerateAssetOptions, 'onProgress' | 'meshArtStyle'>
): Promise<{ meshUrl: string; backgroundUrl: string }> {
  const { onProgress, meshArtStyle = 'realistic' } = options ?? {};

  // Run Meshy and DALL-E in parallel
  const [meshTask, bgResult] = await Promise.all([
    generateMesh({
      prompt: objectPrompt,
      artStyle: meshArtStyle,
      mode: 'preview',
      onProgress: (task) => {
        onProgress?.('mesh', task.progress ?? 0);
      },
    }),
    generateBackgroundWithMood(backgroundPrompt, mood).then((result) => {
      onProgress?.('background', 100);
      return result;
    }),
  ]);

  if (!bgResult.success) {
    throw new Error(`Background generation failed: ${bgResult.error}`);
  }

  const meshUrl = getMeshUrl(meshTask, 'glb');

  return { meshUrl, backgroundUrl: bgResult.url };
}

/**
 * Compose the scene and capture images
 */
export async function composeAndCapture(
  sceneConfig: SceneConfig,
  options?: Pick<GenerateAssetOptions, 'onProgress' | 'width' | 'height'>
): Promise<MultiCaptureResult> {
  const { onProgress, width = 2048, height = 2048 } = options ?? {};

  onProgress?.('scene', 0);

  // Create the Three.js scene
  const sceneResult = await createScene(sceneConfig, {
    width,
    height,
    antialias: true,
    shadows: true,
  });

  onProgress?.('scene', 50);

  try {
    // Capture at multiple resolutions
    const captures = await captureMultiResolution(
      sceneResult.renderer,
      sceneResult.scene,
      sceneResult.camera
    );

    onProgress?.('scene', 100);

    return captures;
  } finally {
    // Clean up scene resources
    sceneResult.dispose();
  }
}

/**
 * Main orchestration function: Generate complete asset from request
 *
 * Workflow:
 * 1. Parse prompts (decompose if single prompt)
 * 2. Generate mesh (Meshy) and background (DALL-E) in parallel
 * 3. Build scene config from preset + overrides
 * 4. Compose scene with Three.js
 * 5. Capture at multiple resolutions
 * 6. Return captures and metadata
 */
export async function generateAsset(
  request: GenerateRequest,
  options?: GenerateAssetOptions
): Promise<GenerateAssetResult> {
  const { onProgress } = options ?? {};

  // Step 1: Parse prompts
  onProgress?.('parsing', 0);
  const { objectPrompt, backgroundPrompt, mood } = await parsePrompts(request);
  onProgress?.('parsing', 100);

  // Step 2: Generate mesh and background in parallel
  const { meshUrl, backgroundUrl } = await generateAssets(
    objectPrompt,
    backgroundPrompt,
    mood,
    options
  );

  // Step 3: Build scene configuration
  const sceneConfig = buildSceneConfig(
    request.preset,
    backgroundUrl,
    meshUrl,
    request.overrides
  );

  // Step 4-5: Compose and capture
  const captures = await composeAndCapture(sceneConfig, options);

  // Create a job record for tracking
  const job = createJob({
    prompt: request.prompt ?? `${objectPrompt} on ${backgroundPrompt}`,
    objectPrompt,
    backgroundPrompt,
    presetId: request.preset,
  });

  return {
    jobId: job.id,
    captures,
    meshUrl,
    sceneConfig,
  };
}

/**
 * Start an async generation job
 *
 * Returns job ID immediately. Use getJob() to check status.
 * Job runs in background and updates status as it progresses.
 */
export async function startGenerationJob(
  request: GenerateRequest,
  options?: GenerateAssetOptions
): Promise<string> {
  // Create job entry first
  const prompt = request.prompt ?? `${request.objectPrompt} on ${request.backgroundPrompt}`;
  const job = createJob({
    prompt,
    objectPrompt: request.objectPrompt,
    backgroundPrompt: request.backgroundPrompt,
    presetId: request.preset,
  });

  // Start async generation (don't await)
  processJob(job.id, request, options).catch((error) => {
    console.error(`Job ${job.id} failed:`, error);
    failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
  });

  return job.id;
}

/**
 * Process a generation job (internal)
 */
async function processJob(
  jobId: string,
  request: GenerateRequest,
  options?: GenerateAssetOptions
): Promise<void> {
  updateJobStatus(jobId, 'processing');

  try {
    // Parse prompts
    const { objectPrompt, backgroundPrompt, mood } = await parsePrompts(request);

    // Generate assets
    const { meshUrl, backgroundUrl } = await generateAssets(
      objectPrompt,
      backgroundPrompt,
      mood,
      options
    );

    // Build scene config
    const sceneConfig = buildSceneConfig(
      request.preset,
      backgroundUrl,
      meshUrl,
      request.overrides
    );

    // Compose and capture
    const captures = await composeAndCapture(sceneConfig, options);

    // Store results as data URLs (in production, upload to storage and store URLs)
    completeJob(
      jobId,
      {
        full: captures.full.dataUrl,
        web: captures.web.dataUrl,
        thumb: captures.thumb.dataUrl,
      },
      meshUrl
    );
  } catch (error) {
    failJob(jobId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Get job status and results
 */
export function getJobStatus(jobId: string): GeneratedAsset | undefined {
  return getJob(jobId);
}

/**
 * Validate a generate request
 */
export function validateRequest(request: GenerateRequest): { valid: boolean; error?: string } {
  // Must have either prompt or both objectPrompt and backgroundPrompt
  if (!request.prompt && (!request.objectPrompt || !request.backgroundPrompt)) {
    return {
      valid: false,
      error: 'Must provide either "prompt" or both "objectPrompt" and "backgroundPrompt"',
    };
  }

  // If preset specified, verify it exists
  if (request.preset && !getPreset(request.preset)) {
    return {
      valid: false,
      error: `Preset "${request.preset}" not found`,
    };
  }

  return { valid: true };
}
