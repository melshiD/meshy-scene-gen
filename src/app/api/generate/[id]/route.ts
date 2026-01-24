import { NextResponse } from 'next/server';
import { getJobStatus } from '@/lib/pipeline';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/generate/:id
 *
 * Get the status of a generation job.
 *
 * Response:
 * - 200 OK: GeneratedAsset object
 * - 404 Not Found: { error: 'Job not found' }
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const job = getJobStatus(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
