import { NextResponse } from 'next/server';
import { getJobStatus, getMultiObjectJobStatus, buildSceneObjectsFromJob, getMultiObjectJob } from '@/lib/pipeline';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/generate/:id
 *
 * Get the status of a generation job.
 *
 * Response for single-object job:
 * - 200 OK: GeneratedAsset object
 *
 * Response for multi-object job:
 * - 200 OK: {
 *     id: string,
 *     type: 'multi',
 *     status: JobStatus,
 *     progress: number (0-100),
 *     background: { status, url?, error? },
 *     objects: Array<{ id, prompt, status, progress?, meshUrl?, error? }>,
 *     createdAt: Date,
 *     completedAt?: Date
 *   }
 *
 * - 404 Not Found: { error: 'Job not found' }
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Try multi-object job first
    const multiJob = getMultiObjectJobStatus(id);
    if (multiJob) {
      return NextResponse.json({
        id: multiJob.id,
        type: 'multi',
        status: multiJob.status,
        progress: multiJob.progress,
        background: multiJob.background,
        objects: multiJob.objects,
        createdAt: multiJob.createdAt,
        completedAt: multiJob.completedAt,
      });
    }

    // Try single-object job
    const singleJob = getJobStatus(id);
    if (singleJob) {
      return NextResponse.json({
        ...singleJob,
        type: 'single',
      });
    }

    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get job status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
