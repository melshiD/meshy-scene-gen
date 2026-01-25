import type {
  GenerateRequest,
  GeneratedAsset,
  SceneConfig,
  MultiObjectGenerateRequest,
  MultiObjectGenerationJob,
  LayoutConfig,
  SceneObject,
  MeshyArtStyle,
} from '@/types';
import { decomposePrompt, createManualPrompt, generateBackgroundWithMood, generateBackground } from '@/lib/image-gen';
import { generateMesh, getMeshUrl, type CreateMeshTaskOptions } from '@/lib/meshy';
// NOTE: Scene composition (Three.js) happens client-side now
// The server generates mesh + background, client loads them and captures
import { buildSceneConfig, getPreset, type SceneConfigOverrides } from '@/lib/presets';
import { persistBackground, persistMesh } from '@/lib/storage';
import {
  createJob,
  updateJobStatus,
  updateJobDecomposedPrompts,
  completeJob,
  completeServerSideJob,
  failJob,
  getJob,
  createMultiObjectJob,
  getMultiObjectJob,
  updateMultiObjectJobStatus,
  updateBackgroundStatus,
  updateObjectStatus,
  isMultiObjectJobComplete,
  completeMultiObjectJob,
  failMultiObjectJob,
  getMultiObjectJobProgress,
} from './job-store';
import { calculateLayout, getLayoutDefaults } from './layout';

/**
 * Result of asset generation (server-side)
 *
 * Note: Captures are done client-side now. This returns the raw assets
 * needed for the client to compose and capture the scene.
 */
export interface GenerateAssetResult {
  jobId: string;
  meshUrl: string;
  backgroundUrl: string;
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
    console.log('[PIPELINE] Using split prompts (skipping decomposition)');
    console.log(`[PIPELINE] Object prompt: "${request.objectPrompt}"`);
    console.log(`[PIPELINE] Background prompt: "${request.backgroundPrompt}"`);
    return {
      objectPrompt: request.objectPrompt,
      backgroundPrompt: request.backgroundPrompt,
      mood: 'neutral',
    };
  }

  // If single prompt, decompose with AI
  if (request.prompt) {
    console.log('[PIPELINE] Stage start: prompt decomposition');
    const result = await decomposePrompt(request.prompt);
    if (!result.success) {
      console.log(`[PIPELINE] Stage failed: prompt decomposition - ${result.error}`);
      throw new Error(`Failed to decompose prompt: ${result.error}`);
    }
    console.log('[PIPELINE] Stage complete: prompt decomposition');
    console.log(`[PIPELINE] Object prompt: "${result.data.object}"`);
    console.log(`[PIPELINE] Background prompt: "${result.data.background}"`);
    console.log(`[PIPELINE] Mood: "${result.data.mood}"`);
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

  console.log('[PIPELINE] Stage start: parallel asset generation (mesh + background)');

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
    console.log(`[PIPELINE] Stage failed: background generation - ${bgResult.error}`);
    throw new Error(`Background generation failed: ${bgResult.error}`);
  }

  const meshUrl = getMeshUrl(meshTask, 'glb');

  console.log('[PIPELINE] Stage complete: mesh generation');
  console.log('[PIPELINE] Stage complete: background generation');
  console.log(`[PIPELINE] Mesh URL: ${meshUrl.substring(0, 60)}...`);
  console.log(`[PIPELINE] Background URL: ${bgResult.url.substring(0, 60)}...`);

  return { meshUrl, backgroundUrl: bgResult.url };
}

// NOTE: composeAndCapture has been removed from server-side
// Scene composition and capture now happens client-side in the browser
// where Three.js has access to WebGL and the DOM

/**
 * Main orchestration function: Generate assets from request
 *
 * Server-side workflow:
 * 1. Parse prompts (decompose if single prompt)
 * 2. Generate mesh (Meshy) and background (DALL-E) in parallel
 * 3. Persist assets to storage
 * 4. Build scene config from preset + overrides
 * 5. Return URLs and config for client-side rendering
 *
 * Client-side (not in this function):
 * - Load mesh and background into Three.js
 * - Apply scene config
 * - Capture at multiple resolutions
 * - Upload captures
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

  // Create a job record for tracking
  const job = createJob({
    prompt: request.prompt ?? `${objectPrompt} on ${backgroundPrompt}`,
    objectPrompt,
    backgroundPrompt,
    presetId: request.preset,
  });

  return {
    jobId: job.id,
    meshUrl,
    backgroundUrl,
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

  console.log(`[PIPELINE] Job created: ${job.id}`);
  console.log(`[PIPELINE] Job prompt: "${prompt}"`);
  if (request.preset) {
    console.log(`[PIPELINE] Using preset: ${request.preset}`);
  }

  // Start async generation (don't await)
  processJob(job.id, request, options).catch((error) => {
    console.error(`[PIPELINE] Job ${job.id} failed:`, error);
    failJob(job.id, error instanceof Error ? error.message : 'Unknown error');
  });

  return job.id;
}

/**
 * Process a generation job (internal)
 *
 * Server-side processing:
 * 1. Parse/decompose prompts
 * 2. Generate mesh (Meshy) and background (DALL-E) in parallel
 * 3. Persist assets to storage
 * 4. Mark job as ready for client-side capture
 *
 * Client then:
 * 1. Loads meshUrl + backgroundUrl into Three.js
 * 2. Applies preset configuration
 * 3. Captures scene
 * 4. POSTs captures to /api/captures
 */
async function processJob(
  jobId: string,
  request: GenerateRequest,
  options?: GenerateAssetOptions
): Promise<void> {
  console.log(`[PIPELINE] Job ${jobId} processing started`);
  updateJobStatus(jobId, 'processing');

  try {
    // Parse prompts
    const { objectPrompt, backgroundPrompt, mood } = await parsePrompts(request);

    // Store decomposed prompts in job for UI display
    updateJobDecomposedPrompts(jobId, objectPrompt, backgroundPrompt, mood);

    // Generate assets (mesh and background in parallel)
    const { meshUrl: tempMeshUrl, backgroundUrl: tempBackgroundUrl } = await generateAssets(
      objectPrompt,
      backgroundPrompt,
      mood,
      options
    );

    // Persist background and mesh to storage in parallel
    // This ensures URLs remain valid after DALL-E/Meshy CDN expiry
    console.log('[PIPELINE] Stage start: persisting assets to storage');
    const [persistentBackgroundUrl, persistentMeshUrl] = await Promise.all([
      persistBackground(tempBackgroundUrl, jobId),
      persistMesh(tempMeshUrl, jobId, 'glb'),
    ]);
    console.log('[PIPELINE] Stage complete: assets persisted');
    console.log(`[PIPELINE] Mesh URL: ${persistentMeshUrl}`);
    console.log(`[PIPELINE] Background URL: ${persistentBackgroundUrl}`);

    // Mark server-side complete - client will load assets and capture
    // Job stays in 'processing' status until client POSTs captures
    completeServerSideJob(jobId, persistentMeshUrl, persistentBackgroundUrl);
    console.log(`[PIPELINE] Job ${jobId} server-side complete, awaiting client capture`);
  } catch (error) {
    console.log(`[PIPELINE] Job ${jobId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

// ============================================================================
// Multi-Object Generation
// ============================================================================

/**
 * Options for multi-object generation
 */
export interface MultiObjectGenerateOptions {
  /** Callback for progress updates */
  onProgress?: (jobId: string, progress: number) => void;
  /** Scene dimensions */
  width?: number;
  height?: number;
}

/**
 * Validate a multi-object generate request
 */
export function validateMultiObjectRequest(
  request: MultiObjectGenerateRequest
): { valid: boolean; error?: string } {
  if (!request.backgroundPrompt) {
    return { valid: false, error: 'backgroundPrompt is required' };
  }

  if (!request.objects || request.objects.length === 0) {
    return { valid: false, error: 'At least one object is required' };
  }

  const maxObjects = request.maxObjects ?? 10;
  if (request.objects.length > maxObjects) {
    return {
      valid: false,
      error: `Too many objects. Maximum is ${maxObjects}, got ${request.objects.length}`,
    };
  }

  for (let i = 0; i < request.objects.length; i++) {
    const obj = request.objects[i];
    if (!obj.prompt || obj.prompt.trim() === '') {
      return { valid: false, error: `Object at index ${i} has empty prompt` };
    }
  }

  // Validate scene preset if provided
  if (request.scenePreset && !getPreset(request.scenePreset)) {
    return { valid: false, error: `Scene preset "${request.scenePreset}" not found` };
  }

  return { valid: true };
}

/**
 * Check if a request is a multi-object request
 */
export function isMultiObjectRequest(
  request: GenerateRequest | MultiObjectGenerateRequest
): request is MultiObjectGenerateRequest {
  return 'objects' in request && Array.isArray(request.objects);
}

/**
 * Start a multi-object generation job
 *
 * Returns job ID immediately. Job runs in background.
 * Background and all objects are generated in parallel.
 */
export async function startMultiObjectGenerationJob(
  request: MultiObjectGenerateRequest,
  options?: MultiObjectGenerateOptions
): Promise<string> {
  // Create job entry
  const job = createMultiObjectJob({
    backgroundPrompt: request.backgroundPrompt,
    objects: request.objects,
    layoutPreset: request.layoutPreset,
    scenePreset: request.scenePreset,
  });

  console.log(`[PIPELINE] Multi-object job created: ${job.id}`);
  console.log(`[PIPELINE] Background prompt: "${request.backgroundPrompt}"`);
  console.log(`[PIPELINE] Object count: ${request.objects.length}`);
  request.objects.forEach((obj, i) => {
    console.log(`[PIPELINE]   Object ${i}: "${obj.prompt}" (style: ${obj.artStyle ?? 'realistic'})`);
  });

  // Start async generation (don't await)
  processMultiObjectJob(job.id, request, options).catch((error) => {
    console.error(`[PIPELINE] Multi-object job ${job.id} failed:`, error);
    failMultiObjectJob(job.id, error instanceof Error ? error.message : 'Unknown error');
  });

  return job.id;
}

/**
 * Process a multi-object generation job
 */
async function processMultiObjectJob(
  jobId: string,
  request: MultiObjectGenerateRequest,
  options?: MultiObjectGenerateOptions
): Promise<void> {
  console.log(`[PIPELINE] Multi-object job ${jobId} processing started`);
  updateMultiObjectJobStatus(jobId, 'processing');

  const job = getMultiObjectJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Generate background and all objects in parallel
    console.log('[PIPELINE] Stage start: parallel generation (1 background + ' + request.objects.length + ' objects)');
    const backgroundPromise = generateBackgroundAsync(jobId, request.backgroundPrompt);
    const objectPromises = request.objects.map((obj, index) =>
      generateObjectAsync(jobId, `obj-${index}`, obj.prompt, obj.artStyle ?? 'realistic')
    );

    // Wait for all generations to complete
    await Promise.all([backgroundPromise, ...objectPromises]);
    console.log('[PIPELINE] Stage complete: all parallel generations finished');

    // Check completion and update job status
    if (isMultiObjectJobComplete(jobId)) {
      completeMultiObjectJob(jobId);
      console.log(`[PIPELINE] Multi-object job ${jobId} completed successfully`);
    }

    options?.onProgress?.(jobId, getMultiObjectJobProgress(jobId));
  } catch (error) {
    console.log(`[PIPELINE] Multi-object job ${jobId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    failMultiObjectJob(jobId, error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Generate background async with status tracking
 */
async function generateBackgroundAsync(jobId: string, prompt: string): Promise<string | null> {
  console.log(`[PIPELINE] Background generation started for job ${jobId}`);
  updateBackgroundStatus(jobId, 'processing');

  try {
    const result = await generateBackground(prompt);
    if (!result.success) {
      console.log(`[PIPELINE] Background generation failed for job ${jobId}: ${result.error}`);
      updateBackgroundStatus(jobId, 'failed', undefined, result.error);
      return null;
    }

    // Persist background to storage before DALL-E URL expires
    console.log(`[PIPELINE] Persisting background for job ${jobId}`);
    const persistentUrl = await persistBackground(result.url, jobId);
    console.log(`[PIPELINE] Background complete for job ${jobId}`);
    updateBackgroundStatus(jobId, 'completed', persistentUrl);
    return persistentUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Background generation failed';
    console.log(`[PIPELINE] Background generation error for job ${jobId}: ${message}`);
    updateBackgroundStatus(jobId, 'failed', undefined, message);
    return null;
  }
}

/**
 * Generate a single object mesh async with status tracking
 */
async function generateObjectAsync(
  jobId: string,
  objectId: string,
  prompt: string,
  artStyle: MeshyArtStyle
): Promise<string | null> {
  console.log(`[PIPELINE] Object ${objectId} generation started: "${prompt}"`);
  updateObjectStatus(jobId, objectId, 'processing', 0);

  try {
    const meshTask = await generateMesh({
      prompt,
      artStyle,
      mode: 'preview',
      onProgress: (task) => {
        updateObjectStatus(jobId, objectId, 'processing', task.progress ?? 0);
      },
    });

    const tempMeshUrl = getMeshUrl(meshTask, 'glb');

    // Persist mesh to storage (use objectId in key for multi-object jobs)
    console.log(`[PIPELINE] Persisting mesh for object ${objectId}`);
    const persistentMeshUrl = await persistMesh(tempMeshUrl, `${jobId}/${objectId}`, 'glb');
    console.log(`[PIPELINE] Object ${objectId} complete`);
    updateObjectStatus(jobId, objectId, 'completed', 100, persistentMeshUrl);
    return persistentMeshUrl;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Mesh generation failed';
    console.log(`[PIPELINE] Object ${objectId} failed: ${message}`);
    updateObjectStatus(jobId, objectId, 'failed', undefined, undefined, message);
    return null;
  }
}

/**
 * Build scene objects from multi-object job result
 */
export function buildSceneObjectsFromJob(
  job: MultiObjectGenerationJob,
  layoutPreset?: LayoutConfig['preset']
): SceneObject[] {
  const layoutConfig: LayoutConfig = {
    preset: layoutPreset ?? 'centered',
    spacing: 1.0,
    groundPlane: true,
    centerPoint: { x: 0, y: 0, z: 0 },
    radius: 2.0,
    ...getLayoutDefaults(layoutPreset ?? 'centered'),
  };

  const positions = calculateLayout(job.objects.length, layoutConfig);

  return job.objects.map((obj, index) => ({
    id: obj.id,
    name: `Object ${index + 1}`,
    meshUrl: obj.meshUrl ?? null,
    prompt: obj.prompt,
    position: positions[index] ?? { x: 0, y: 0, z: 0 },
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 },
    visible: true,
    locked: false,
    status: obj.status,
    progress: obj.progress,
  }));
}

/**
 * Get multi-object job status with computed progress
 */
export function getMultiObjectJobStatus(jobId: string): (MultiObjectGenerationJob & { progress: number }) | undefined {
  const job = getMultiObjectJob(jobId);
  if (!job) return undefined;
  return {
    ...job,
    progress: getMultiObjectJobProgress(jobId),
  };
}
