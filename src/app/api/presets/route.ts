import { NextResponse } from 'next/server';
import type { ScenePreset } from '@/types';
import { listPresets, savePreset } from '@/lib/presets';

/**
 * GET /api/presets
 *
 * List all available presets (custom + default).
 *
 * Response:
 * - 200 OK: ScenePreset[]
 */
export async function GET() {
  try {
    const presets = listPresets();
    return NextResponse.json(presets);
  } catch (error) {
    console.error('List presets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/presets
 *
 * Create a new custom preset.
 *
 * Request body: Omit<ScenePreset, 'id'> & { id?: string }
 *
 * Response:
 * - 201 Created: ScenePreset (with generated ID if not provided)
 * - 400 Bad Request: { error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as Omit<ScenePreset, 'id'> & { id?: string };

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    if (!body.object || !body.camera || !body.lighting) {
      return NextResponse.json(
        { error: 'Missing required fields: object, camera, and lighting are required' },
        { status: 400 }
      );
    }

    // Validate object structure
    if (
      body.object.position === undefined ||
      body.object.scale === undefined ||
      body.object.rotation === undefined
    ) {
      return NextResponse.json(
        { error: 'Invalid object config: position, scale, and rotation are required' },
        { status: 400 }
      );
    }

    // Validate camera structure
    if (
      body.camera.position === undefined ||
      body.camera.fov === undefined ||
      body.camera.lookAt === undefined
    ) {
      return NextResponse.json(
        { error: 'Invalid camera config: position, fov, and lookAt are required' },
        { status: 400 }
      );
    }

    // Validate lighting structure
    if (!body.lighting.preset) {
      return NextResponse.json(
        { error: 'Invalid lighting config: preset is required' },
        { status: 400 }
      );
    }

    const validPresets = ['dramatic', 'soft', 'studio'];
    if (!validPresets.includes(body.lighting.preset)) {
      return NextResponse.json(
        { error: `Invalid lighting preset: must be one of ${validPresets.join(', ')}` },
        { status: 400 }
      );
    }

    // Save the preset
    const preset = savePreset(body);

    return NextResponse.json(preset, { status: 201 });
  } catch (error) {
    console.error('Create preset error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
