import { describe, it, expect, beforeEach } from 'vitest';
import {
  createJob,
  getJob,
  updateJobStatus,
  completeJob,
  failJob,
  listJobs,
  deleteJob,
  clearJobs,
  // Multi-object job functions
  createMultiObjectJob,
  getMultiObjectJob,
  updateMultiObjectJobStatus,
  updateBackgroundStatus,
  updateObjectStatus,
  isMultiObjectJobComplete,
  completeMultiObjectJob,
  failMultiObjectJob,
  listMultiObjectJobs,
  deleteMultiObjectJob,
  clearMultiObjectJobs,
  getMultiObjectJobProgress,
} from './job-store';

describe('Job Store', () => {
  beforeEach(async () => {
    await clearJobs();
  });

  describe('createJob', () => {
    it('should create a job with pending status', async () => {
      const job = await createJob({
        prompt: 'crystal dragon',
      });

      expect(job.id).toBeDefined();
      expect(job.id).toMatch(/^job-/);
      expect(job.status).toBe('pending');
      expect(job.prompt).toBe('crystal dragon');
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('should store optional fields', async () => {
      const job = await createJob({
        prompt: 'dragon on mountain',
        objectPrompt: 'crystal dragon',
        backgroundPrompt: 'misty mountain',
        presetId: 'hero',
      });

      expect(job.objectPrompt).toBe('crystal dragon');
      expect(job.backgroundPrompt).toBe('misty mountain');
      expect(job.presetId).toBe('hero');
    });

    it('should generate unique IDs', async () => {
      const job1 = await createJob({ prompt: 'test1' });
      const job2 = await createJob({ prompt: 'test2' });

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getJob', () => {
    it('should retrieve a created job', async () => {
      const created = await createJob({ prompt: 'test' });
      const retrieved = await getJob(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent job', async () => {
      const job = await getJob('nonexistent');
      expect(job).toBeUndefined();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status', async () => {
      const job = await createJob({ prompt: 'test' });
      await updateJobStatus(job.id, 'processing');

      const updated = await getJob(job.id);
      expect(updated?.status).toBe('processing');
    });

    it('should not throw for non-existent job', async () => {
      await expect(updateJobStatus('nonexistent', 'processing')).resolves.not.toThrow();
    });
  });

  describe('completeJob', () => {
    it('should complete job with assets', async () => {
      const job = await createJob({ prompt: 'test' });
      await updateJobStatus(job.id, 'processing');

      await completeJob(
        job.id,
        {
          full: 'https://example.com/full.png',
          web: 'https://example.com/web.webp',
          thumb: 'https://example.com/thumb.webp',
        },
        'https://example.com/mesh.glb'
      );

      const completed = await getJob(job.id);
      expect(completed?.status).toBe('completed');
      expect(completed?.assets?.full).toBe('https://example.com/full.png');
      expect(completed?.assets?.web).toBe('https://example.com/web.webp');
      expect(completed?.assets?.thumb).toBe('https://example.com/thumb.webp');
      expect(completed?.meshUrl).toBe('https://example.com/mesh.glb');
      expect(completed?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('failJob', () => {
    it('should mark job as failed with error', async () => {
      const job = await createJob({ prompt: 'test' });
      await updateJobStatus(job.id, 'processing');

      await failJob(job.id, 'Something went wrong');

      const failed = await getJob(job.id);
      expect(failed?.status).toBe('failed');
      expect(failed?.error).toBe('Something went wrong');
      expect(failed?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('listJobs', () => {
    it('should return jobs in reverse chronological order', async () => {
      const job1 = await createJob({ prompt: 'first' });
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      const job2 = await createJob({ prompt: 'second' });
      await new Promise((r) => setTimeout(r, 10));
      const job3 = await createJob({ prompt: 'third' });

      const jobs = await listJobs();

      expect(jobs.length).toBe(3);
      expect(jobs[0].id).toBe(job3.id);
      expect(jobs[1].id).toBe(job2.id);
      expect(jobs[2].id).toBe(job1.id);
    });

    it('should respect limit parameter', async () => {
      await createJob({ prompt: 'first' });
      await createJob({ prompt: 'second' });
      await createJob({ prompt: 'third' });

      const jobs = await listJobs(2);
      expect(jobs.length).toBe(2);
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      const job = await createJob({ prompt: 'test' });
      expect(await getJob(job.id)).toBeDefined();

      const result = await deleteJob(job.id);
      expect(result).toBe(true);
      expect(await getJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', async () => {
      const result = await deleteJob('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clearJobs', () => {
    it('should clear all jobs', async () => {
      await createJob({ prompt: 'first' });
      await createJob({ prompt: 'second' });

      expect((await listJobs()).length).toBe(2);

      await clearJobs();

      expect((await listJobs()).length).toBe(0);
    });
  });
});

// ============================================================================
// Multi-Object Job Store Tests
// ============================================================================

describe('Multi-Object Job Store', () => {
  beforeEach(async () => {
    await clearMultiObjectJobs();
  });

  describe('createMultiObjectJob', () => {
    it('should create a multi-object job with pending status', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'misty mountain landscape',
        objects: [
          { prompt: 'crystal dragon' },
          { prompt: 'golden trophy' },
        ],
      });

      expect(job.id).toBeDefined();
      expect(job.id).toMatch(/^job-/);
      expect(job.status).toBe('pending');
      expect(job.background.status).toBe('pending');
      expect(job.objects.length).toBe(2);
      expect(job.objects[0].id).toBe('obj-0');
      expect(job.objects[0].prompt).toBe('crystal dragon');
      expect(job.objects[0].status).toBe('pending');
      expect(job.objects[1].id).toBe('obj-1');
      expect(job.objects[1].prompt).toBe('golden trophy');
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', async () => {
      const job1 = await createMultiObjectJob({
        backgroundPrompt: 'bg1',
        objects: [{ prompt: 'obj1' }],
      });
      const job2 = await createMultiObjectJob({
        backgroundPrompt: 'bg2',
        objects: [{ prompt: 'obj2' }],
      });

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getMultiObjectJob', () => {
    it('should retrieve a created job', async () => {
      const created = await createMultiObjectJob({
        backgroundPrompt: 'test bg',
        objects: [{ prompt: 'test obj' }],
      });
      const retrieved = await getMultiObjectJob(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent job', async () => {
      const job = await getMultiObjectJob('nonexistent');
      expect(job).toBeUndefined();
    });
  });

  describe('updateMultiObjectJobStatus', () => {
    it('should update job status', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateMultiObjectJobStatus(job.id, 'processing');

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.status).toBe('processing');
    });
  });

  describe('updateBackgroundStatus', () => {
    it('should update background status', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateBackgroundStatus(job.id, 'processing');

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.background.status).toBe('processing');
    });

    it('should update background with URL on completion', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.background.status).toBe('completed');
      expect(updated?.background.url).toBe('https://example.com/bg.png');
    });

    it('should update background with error on failure', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateBackgroundStatus(job.id, 'failed', undefined, 'Generation failed');

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.background.status).toBe('failed');
      expect(updated?.background.error).toBe('Generation failed');
    });
  });

  describe('updateObjectStatus', () => {
    it('should update object status with progress', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      await updateObjectStatus(job.id, 'obj-0', 'processing', 50);

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.objects[0].status).toBe('processing');
      expect(updated?.objects[0].progress).toBe(50);
    });

    it('should update object with mesh URL on completion', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.objects[0].status).toBe('completed');
      expect(updated?.objects[0].meshUrl).toBe('https://example.com/mesh.glb');
    });

    it('should update object with error on failure', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateObjectStatus(job.id, 'obj-0', 'failed', undefined, undefined, 'Mesh failed');

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.objects[0].status).toBe('failed');
      expect(updated?.objects[0].error).toBe('Mesh failed');
    });
  });

  describe('isMultiObjectJobComplete', () => {
    it('should return false when job is pending', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });

      expect(await isMultiObjectJobComplete(job.id)).toBe(false);
    });

    it('should return true when all components are completed', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      await updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      await updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh1.glb');
      await updateObjectStatus(job.id, 'obj-1', 'completed', 100, 'https://example.com/mesh2.glb');

      expect(await isMultiObjectJobComplete(job.id)).toBe(true);
    });

    it('should return true when some components failed', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      await updateObjectStatus(job.id, 'obj-0', 'failed', undefined, undefined, 'Error');

      expect(await isMultiObjectJobComplete(job.id)).toBe(true);
    });

    it('should return false for non-existent job', async () => {
      expect(await isMultiObjectJobComplete('nonexistent')).toBe(false);
    });
  });

  describe('completeMultiObjectJob', () => {
    it('should set status to completed when all succeed', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      await updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      await completeMultiObjectJob(job.id);

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should set status to failed when any component fails', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      await updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      await updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');
      await updateObjectStatus(job.id, 'obj-1', 'failed', undefined, undefined, 'Error');

      await completeMultiObjectJob(job.id);

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.status).toBe('failed');
    });
  });

  describe('failMultiObjectJob', () => {
    it('should mark job as failed and fail pending items', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      await updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      await failMultiObjectJob(job.id, 'Critical error');

      const updated = await getMultiObjectJob(job.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.background.status).toBe('failed');
      expect(updated?.background.error).toBe('Critical error');
      // obj-0 was already completed, should stay completed
      expect(updated?.objects[0].status).toBe('completed');
      // obj-1 was pending, should be failed
      expect(updated?.objects[1].status).toBe('failed');
      expect(updated?.objects[1].error).toBe('Critical error');
    });
  });

  describe('getMultiObjectJobProgress', () => {
    it('should return 0 for pending job', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });

      expect(await getMultiObjectJobProgress(job.id)).toBe(0);
    });

    it('should return 100 when fully completed', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      await updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      await updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      expect(await getMultiObjectJobProgress(job.id)).toBe(100);
    });

    it('should return partial progress', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      await updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      await updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');
      // obj-1 still pending

      // Background = 20%, each object = 40%
      // Progress = 20 + 40 + 0 = 60
      expect(await getMultiObjectJobProgress(job.id)).toBe(60);
    });

    it('should return 0 for non-existent job', async () => {
      expect(await getMultiObjectJobProgress('nonexistent')).toBe(0);
    });
  });

  describe('listMultiObjectJobs', () => {
    it('should return jobs in reverse chronological order', async () => {
      const job1 = await createMultiObjectJob({
        backgroundPrompt: 'first',
        objects: [{ prompt: 'obj' }],
      });
      await new Promise((r) => setTimeout(r, 10));
      const job2 = await createMultiObjectJob({
        backgroundPrompt: 'second',
        objects: [{ prompt: 'obj' }],
      });

      const jobs = await listMultiObjectJobs();

      expect(jobs.length).toBe(2);
      expect(jobs[0].id).toBe(job2.id);
      expect(jobs[1].id).toBe(job1.id);
    });
  });

  describe('deleteMultiObjectJob', () => {
    it('should delete a job', async () => {
      const job = await createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });

      const result = await deleteMultiObjectJob(job.id);
      expect(result).toBe(true);
      expect(await getMultiObjectJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', async () => {
      expect(await deleteMultiObjectJob('nonexistent')).toBe(false);
    });
  });

  describe('clearMultiObjectJobs', () => {
    it('should clear all multi-object jobs', async () => {
      await createMultiObjectJob({ backgroundPrompt: 'bg1', objects: [{ prompt: 'obj1' }] });
      await createMultiObjectJob({ backgroundPrompt: 'bg2', objects: [{ prompt: 'obj2' }] });

      expect((await listMultiObjectJobs()).length).toBe(2);

      await clearMultiObjectJobs();

      expect((await listMultiObjectJobs()).length).toBe(0);
    });
  });
});
