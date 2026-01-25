import { NextResponse } from 'next/server';
import { getJob, addCapturesAndComplete } from '@/lib/pipeline';
import { uploadCaptures } from '@/lib/storage';

/**
 * POST /api/captures
 *
 * Upload captured scene images for a job.
 * Called by the client after rendering and capturing the scene in Three.js.
 *
 * Request body:
 * - jobId: string - The job ID to attach captures to
 * - captures: {
 *     full: string (base64 data URL or blob)
 *     web: string (base64 data URL or blob)
 *     thumb: string (base64 data URL or blob)
 *   }
 *
 * Response:
 * - 200 OK: { success: true, assets: { full, web, thumb } }
 * - 400 Bad Request: { error: string }
 * - 404 Not Found: { error: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    if (!body.captures) {
      return NextResponse.json({ error: 'captures object is required' }, { status: 400 });
    }

    const { full, web, thumb } = body.captures;
    if (!full || !web || !thumb) {
      return NextResponse.json(
        { error: 'captures must include full, web, and thumb' },
        { status: 400 }
      );
    }

    // Find the job
    const job = getJob(body.jobId);
    if (!job) {
      return NextResponse.json({ error: `Job ${body.jobId} not found` }, { status: 404 });
    }

    // Job should be in processing state (server-side complete, awaiting captures)
    if (job.status === 'completed') {
      return NextResponse.json(
        { error: 'Job already has captures' },
        { status: 400 }
      );
    }

    if (job.status === 'failed') {
      return NextResponse.json(
        { error: 'Cannot add captures to failed job' },
        { status: 400 }
      );
    }

    console.log(`[API] POST /api/captures - Job ${body.jobId}`);

    // Convert base64 data URLs to blobs for storage
    const captureBlobs = {
      full: await dataUrlToBlob(full),
      web: await dataUrlToBlob(web),
      thumb: await dataUrlToBlob(thumb),
    };

    // Upload captures to storage
    console.log(`[API] Uploading captures for job ${body.jobId}`);
    const captureUrls = await uploadCaptures(
      {
        full: { blob: captureBlobs.full, dataUrl: full, width: 2048, height: 2048, format: 'png' },
        web: { blob: captureBlobs.web, dataUrl: web, width: 800, height: 800, format: 'webp' },
        thumb: { blob: captureBlobs.thumb, dataUrl: thumb, width: 400, height: 400, format: 'webp' },
      },
      body.jobId
    );

    // Complete the job with capture URLs
    addCapturesAndComplete(body.jobId, captureUrls);

    console.log(`[API] Job ${body.jobId} completed with captures`);

    return NextResponse.json({
      success: true,
      assets: captureUrls,
    });
  } catch (error) {
    console.error('[API] Captures API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Convert base64 data URL to Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  // Handle both data URLs and regular URLs
  if (dataUrl.startsWith('data:')) {
    const response = await fetch(dataUrl);
    return response.blob();
  }
  // If it's a regular URL, fetch it
  const response = await fetch(dataUrl);
  return response.blob();
}
