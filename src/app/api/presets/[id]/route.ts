import { NextResponse } from 'next/server';
import { getPreset, deletePreset, DEFAULT_PRESETS } from '@/lib/presets';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/presets/:id
 *
 * Get a specific preset by ID.
 *
 * Response:
 * - 200 OK: ScenePreset
 * - 404 Not Found: { error: 'Preset not found' }
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const preset = getPreset(id);

    if (!preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Get preset error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/presets/:id
 *
 * Delete a custom preset.
 *
 * Note: Default presets cannot be deleted.
 *
 * Response:
 * - 204 No Content: Successfully deleted
 * - 400 Bad Request: Cannot delete default preset
 * - 404 Not Found: Preset not found
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if it's a default preset
    if (DEFAULT_PRESETS.some((p) => p.id === id)) {
      return NextResponse.json(
        { error: 'Cannot delete default presets' },
        { status: 400 }
      );
    }

    const deleted = deletePreset(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete preset error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
