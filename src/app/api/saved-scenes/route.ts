import { NextResponse } from 'next/server';
import { listJobs } from '@/lib/pipeline';

// A GET-only handler is statically optimized by default — Next would prerender it at BUILD time
// (no DB → empty list baked into the build, served forever). Force per-request evaluation.
export const dynamic = 'force-dynamic';

interface SavedScene {
  id: string;
  name: string;
  prompt?: string;
  hasPrompt: boolean;
  meshUrl: string;
  backgroundUrl: string;
  createdAt: string;
}

/**
 * GET /api/saved-scenes
 *
 * List saved scenes from Postgres (the Job table) — jobs that have both a persisted mesh and
 * background. Assets themselves live in R2; this reads only metadata. Replaces the old filesystem
 * scan of public/generated (which does not exist on an ephemeral container).
 */
export async function GET() {
  try {
    const jobs = await listJobs(200);

    const scenes: SavedScene[] = jobs
      .filter((job) => job.meshUrl && job.backgroundUrl)
      .map((job) => {
        const prompt = job.prompt || job.objectPrompt;
        const name = prompt
          ? prompt.length > 40
            ? `${prompt.substring(0, 40)}...`
            : prompt
          : job.id;
        return {
          id: job.id,
          name,
          prompt,
          hasPrompt: !!prompt,
          meshUrl: job.meshUrl as string,
          backgroundUrl: job.backgroundUrl as string,
          createdAt: job.createdAt.toISOString(),
        };
      });

    // listJobs already returns newest-first; keep that order.
    return NextResponse.json({ scenes });
  } catch (error) {
    console.error('[API] Error listing saved scenes:', error);
    return NextResponse.json({ scenes: [] });
  }
}
