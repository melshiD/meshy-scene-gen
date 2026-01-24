import { NextResponse } from 'next/server';
import type { GenerateRequest } from '@/types';
import { startGenerationJob, validateRequest } from '@/lib/pipeline';

/**
 * POST /api/generate
 *
 * Start a new asset generation job.
 *
 * Request body:
 * - prompt?: string - Single prompt (will be decomposed by AI)
 * - objectPrompt?: string - Direct object prompt (skip AI decomposition)
 * - backgroundPrompt?: string - Direct background prompt (skip AI decomposition)
 * - preset?: string - Preset ID for scene configuration
 * - overrides?: Partial<SceneConfig> - Override specific preset values
 *
 * Response:
 * - 202 Accepted: { id: string, status: 'pending' }
 * - 400 Bad Request: { error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as GenerateRequest;

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Start generation job (runs in background)
    const jobId = await startGenerationJob(body);

    return NextResponse.json(
      { id: jobId, status: 'pending' },
      { status: 202 }
    );
  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
