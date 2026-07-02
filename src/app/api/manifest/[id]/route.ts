import { NextResponse } from 'next/server';
import { loadManifest } from '@/lib/manifest';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/manifest/:id
 *
 * Retrieve a scene manifest by job ID.
 *
 * Response:
 * - 200 OK: SceneManifest object
 * - 404 Not Found: { error: 'Manifest not found' }
 * - 500 Internal Server Error: { error: 'Failed to load manifest' }
 */
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    console.log(`[API] GET /api/manifest/${id} - Loading manifest`);

    const manifest = await loadManifest(id);

    if (!manifest) {
      console.log(`[API] Manifest ${id}: not found`);
      return NextResponse.json(
        { error: 'Manifest not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Manifest ${id}: found, type=${manifest.type}`);
    return NextResponse.json(manifest);
  } catch (error) {
    console.error('[API] Error loading manifest:', error);
    return NextResponse.json(
      { error: 'Failed to load manifest' },
      { status: 500 }
    );
  }
}
