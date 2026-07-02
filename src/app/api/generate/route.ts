import { NextResponse } from 'next/server';
import type { GenerateRequest, MultiObjectGenerateRequest } from '@/types';
import {
  startGenerationJob,
  validateRequest,
  isMultiObjectRequest,
  validateMultiObjectRequest,
  startMultiObjectGenerationJob,
} from '@/lib/pipeline';

/**
 * POST /api/generate
 *
 * Start a new asset generation job.
 *
 * Single-object request body (legacy):
 * - prompt?: string - Single prompt (will be decomposed by AI)
 * - objectPrompt?: string - Direct object prompt (skip AI decomposition)
 * - backgroundPrompt?: string - Direct background prompt (skip AI decomposition)
 * - preset?: string - Preset ID for scene configuration
 * - overrides?: Partial<SceneConfig> - Override specific preset values
 *
 * Multi-object request body:
 * - backgroundPrompt: string - Background prompt
 * - objects: Array<{ prompt: string; artStyle?: string }> - Objects to generate
 * - layoutPreset?: string - Layout preset for positioning objects
 * - scenePreset?: string - Scene preset for camera/lighting
 * - maxObjects?: number - Maximum number of objects (default: 10)
 *
 * Response:
 * - 202 Accepted: { id: string, status: 'pending', type: 'single' | 'multi' }
 * - 400 Bad Request: { error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as GenerateRequest | MultiObjectGenerateRequest;

    // Detect multi-object vs single-object request
    if (isMultiObjectRequest(body)) {
      // Multi-object request
      console.log(`[API] POST /api/generate - Multi-object request (${body.objects.length} objects)`);
      console.log(`[API] Background: "${body.backgroundPrompt}"`);

      const validation = await validateMultiObjectRequest(body);
      if (!validation.valid) {
        console.log(`[API] Validation failed: ${validation.error}`);
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      const jobId = await startMultiObjectGenerationJob(body);

      console.log(`[API] Multi-object job created: ${jobId}`);
      return NextResponse.json(
        { id: jobId, status: 'pending', type: 'multi', objectCount: body.objects.length },
        { status: 202 }
      );
    } else {
      // Legacy single-object request
      const prompt = body.prompt ?? `${body.objectPrompt} + ${body.backgroundPrompt}`;
      console.log(`[API] POST /api/generate - Single-object request`);
      console.log(`[API] Prompt: "${prompt}"`);

      const validation = await validateRequest(body);
      if (!validation.valid) {
        console.log(`[API] Validation failed: ${validation.error}`);
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      const jobId = await startGenerationJob(body);

      console.log(`[API] Single-object job created: ${jobId}`);
      return NextResponse.json(
        { id: jobId, status: 'pending', type: 'single' },
        { status: 202 }
      );
    }
  } catch (error) {
    console.error('[API] Generate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
