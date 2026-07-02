import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ key: string[] }>;
}

/**
 * GET /api/assets/[...key]
 *
 * Serve a binary asset (mesh .glb, background/capture image, manifest.json) from the Asset table —
 * the read side of PostgresStorageProvider. Keys are per-job and content never changes after
 * persist (re-generation gets a new jobId), so responses are cacheable as immutable.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { key: segments } = await params;
    const key = segments.join('/');

    const asset = await prisma.asset.findUnique({ where: { key } });
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(asset.data), {
      status: 200,
      headers: {
        'Content-Type': asset.contentType,
        'Content-Length': String(asset.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[API] Asset serve error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
