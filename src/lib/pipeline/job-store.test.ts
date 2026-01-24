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
  beforeEach(() => {
    clearJobs();
  });

  describe('createJob', () => {
    it('should create a job with pending status', () => {
      const job = createJob({
        prompt: 'crystal dragon',
      });

      expect(job.id).toBeDefined();
      expect(job.id).toMatch(/^job-/);
      expect(job.status).toBe('pending');
      expect(job.prompt).toBe('crystal dragon');
      expect(job.createdAt).toBeInstanceOf(Date);
    });

    it('should store optional fields', () => {
      const job = createJob({
        prompt: 'dragon on mountain',
        objectPrompt: 'crystal dragon',
        backgroundPrompt: 'misty mountain',
        presetId: 'hero',
      });

      expect(job.objectPrompt).toBe('crystal dragon');
      expect(job.backgroundPrompt).toBe('misty mountain');
      expect(job.presetId).toBe('hero');
    });

    it('should generate unique IDs', () => {
      const job1 = createJob({ prompt: 'test1' });
      const job2 = createJob({ prompt: 'test2' });

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getJob', () => {
    it('should retrieve a created job', () => {
      const created = createJob({ prompt: 'test' });
      const retrieved = getJob(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent job', () => {
      const job = getJob('nonexistent');
      expect(job).toBeUndefined();
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status', () => {
      const job = createJob({ prompt: 'test' });
      updateJobStatus(job.id, 'processing');

      const updated = getJob(job.id);
      expect(updated?.status).toBe('processing');
    });

    it('should not throw for non-existent job', () => {
      expect(() => updateJobStatus('nonexistent', 'processing')).not.toThrow();
    });
  });

  describe('completeJob', () => {
    it('should complete job with assets', () => {
      const job = createJob({ prompt: 'test' });
      updateJobStatus(job.id, 'processing');

      completeJob(
        job.id,
        {
          full: 'https://example.com/full.png',
          web: 'https://example.com/web.webp',
          thumb: 'https://example.com/thumb.webp',
        },
        'https://example.com/mesh.glb'
      );

      const completed = getJob(job.id);
      expect(completed?.status).toBe('completed');
      expect(completed?.assets?.full).toBe('https://example.com/full.png');
      expect(completed?.assets?.web).toBe('https://example.com/web.webp');
      expect(completed?.assets?.thumb).toBe('https://example.com/thumb.webp');
      expect(completed?.meshUrl).toBe('https://example.com/mesh.glb');
      expect(completed?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('failJob', () => {
    it('should mark job as failed with error', () => {
      const job = createJob({ prompt: 'test' });
      updateJobStatus(job.id, 'processing');

      failJob(job.id, 'Something went wrong');

      const failed = getJob(job.id);
      expect(failed?.status).toBe('failed');
      expect(failed?.error).toBe('Something went wrong');
      expect(failed?.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('listJobs', () => {
    it('should return jobs in reverse chronological order', async () => {
      const job1 = createJob({ prompt: 'first' });
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      const job2 = createJob({ prompt: 'second' });
      await new Promise((r) => setTimeout(r, 10));
      const job3 = createJob({ prompt: 'third' });

      const jobs = listJobs();

      expect(jobs.length).toBe(3);
      expect(jobs[0].id).toBe(job3.id);
      expect(jobs[1].id).toBe(job2.id);
      expect(jobs[2].id).toBe(job1.id);
    });

    it('should respect limit parameter', () => {
      createJob({ prompt: 'first' });
      createJob({ prompt: 'second' });
      createJob({ prompt: 'third' });

      const jobs = listJobs(2);
      expect(jobs.length).toBe(2);
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', () => {
      const job = createJob({ prompt: 'test' });
      expect(getJob(job.id)).toBeDefined();

      const result = deleteJob(job.id);
      expect(result).toBe(true);
      expect(getJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      const result = deleteJob('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('clearJobs', () => {
    it('should clear all jobs', () => {
      createJob({ prompt: 'first' });
      createJob({ prompt: 'second' });

      expect(listJobs().length).toBe(2);

      clearJobs();

      expect(listJobs().length).toBe(0);
    });
  });
});

// ============================================================================
// Multi-Object Job Store Tests
// ============================================================================

describe('Multi-Object Job Store', () => {
  beforeEach(() => {
    clearMultiObjectJobs();
  });

  describe('createMultiObjectJob', () => {
    it('should create a multi-object job with pending status', () => {
      const job = createMultiObjectJob({
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

    it('should generate unique IDs', () => {
      const job1 = createMultiObjectJob({
        backgroundPrompt: 'bg1',
        objects: [{ prompt: 'obj1' }],
      });
      const job2 = createMultiObjectJob({
        backgroundPrompt: 'bg2',
        objects: [{ prompt: 'obj2' }],
      });

      expect(job1.id).not.toBe(job2.id);
    });
  });

  describe('getMultiObjectJob', () => {
    it('should retrieve a created job', () => {
      const created = createMultiObjectJob({
        backgroundPrompt: 'test bg',
        objects: [{ prompt: 'test obj' }],
      });
      const retrieved = getMultiObjectJob(created.id);

      expect(retrieved).toEqual(created);
    });

    it('should return undefined for non-existent job', () => {
      const job = getMultiObjectJob('nonexistent');
      expect(job).toBeUndefined();
    });
  });

  describe('updateMultiObjectJobStatus', () => {
    it('should update job status', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateMultiObjectJobStatus(job.id, 'processing');

      const updated = getMultiObjectJob(job.id);
      expect(updated?.status).toBe('processing');
    });
  });

  describe('updateBackgroundStatus', () => {
    it('should update background status', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateBackgroundStatus(job.id, 'processing');

      const updated = getMultiObjectJob(job.id);
      expect(updated?.background.status).toBe('processing');
    });

    it('should update background with URL on completion', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');

      const updated = getMultiObjectJob(job.id);
      expect(updated?.background.status).toBe('completed');
      expect(updated?.background.url).toBe('https://example.com/bg.png');
    });

    it('should update background with error on failure', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateBackgroundStatus(job.id, 'failed', undefined, 'Generation failed');

      const updated = getMultiObjectJob(job.id);
      expect(updated?.background.status).toBe('failed');
      expect(updated?.background.error).toBe('Generation failed');
    });
  });

  describe('updateObjectStatus', () => {
    it('should update object status with progress', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      updateObjectStatus(job.id, 'obj-0', 'processing', 50);

      const updated = getMultiObjectJob(job.id);
      expect(updated?.objects[0].status).toBe('processing');
      expect(updated?.objects[0].progress).toBe(50);
    });

    it('should update object with mesh URL on completion', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      const updated = getMultiObjectJob(job.id);
      expect(updated?.objects[0].status).toBe('completed');
      expect(updated?.objects[0].meshUrl).toBe('https://example.com/mesh.glb');
    });

    it('should update object with error on failure', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateObjectStatus(job.id, 'obj-0', 'failed', undefined, undefined, 'Mesh failed');

      const updated = getMultiObjectJob(job.id);
      expect(updated?.objects[0].status).toBe('failed');
      expect(updated?.objects[0].error).toBe('Mesh failed');
    });
  });

  describe('isMultiObjectJobComplete', () => {
    it('should return false when job is pending', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });

      expect(isMultiObjectJobComplete(job.id)).toBe(false);
    });

    it('should return true when all components are completed', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh1.glb');
      updateObjectStatus(job.id, 'obj-1', 'completed', 100, 'https://example.com/mesh2.glb');

      expect(isMultiObjectJobComplete(job.id)).toBe(true);
    });

    it('should return true when some components failed', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      updateObjectStatus(job.id, 'obj-0', 'failed', undefined, undefined, 'Error');

      expect(isMultiObjectJobComplete(job.id)).toBe(true);
    });

    it('should return false for non-existent job', () => {
      expect(isMultiObjectJobComplete('nonexistent')).toBe(false);
    });
  });

  describe('completeMultiObjectJob', () => {
    it('should set status to completed when all succeed', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      completeMultiObjectJob(job.id);

      const updated = getMultiObjectJob(job.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.completedAt).toBeInstanceOf(Date);
    });

    it('should set status to failed when any component fails', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');
      updateObjectStatus(job.id, 'obj-1', 'failed', undefined, undefined, 'Error');

      completeMultiObjectJob(job.id);

      const updated = getMultiObjectJob(job.id);
      expect(updated?.status).toBe('failed');
    });
  });

  describe('failMultiObjectJob', () => {
    it('should mark job as failed and fail pending items', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      failMultiObjectJob(job.id, 'Critical error');

      const updated = getMultiObjectJob(job.id);
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
    it('should return 0 for pending job', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });

      expect(getMultiObjectJobProgress(job.id)).toBe(0);
    });

    it('should return 100 when fully completed', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');

      expect(getMultiObjectJobProgress(job.id)).toBe(100);
    });

    it('should return partial progress', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj1' }, { prompt: 'obj2' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/mesh.glb');
      // obj-1 still pending

      // Background = 20%, each object = 40%
      // Progress = 20 + 40 + 0 = 60
      expect(getMultiObjectJobProgress(job.id)).toBe(60);
    });

    it('should return 0 for non-existent job', () => {
      expect(getMultiObjectJobProgress('nonexistent')).toBe(0);
    });
  });

  describe('listMultiObjectJobs', () => {
    it('should return jobs in reverse chronological order', async () => {
      const job1 = createMultiObjectJob({
        backgroundPrompt: 'first',
        objects: [{ prompt: 'obj' }],
      });
      await new Promise((r) => setTimeout(r, 10));
      const job2 = createMultiObjectJob({
        backgroundPrompt: 'second',
        objects: [{ prompt: 'obj' }],
      });

      const jobs = listMultiObjectJobs();

      expect(jobs.length).toBe(2);
      expect(jobs[0].id).toBe(job2.id);
      expect(jobs[1].id).toBe(job1.id);
    });
  });

  describe('deleteMultiObjectJob', () => {
    it('should delete a job', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'test',
        objects: [{ prompt: 'obj' }],
      });

      const result = deleteMultiObjectJob(job.id);
      expect(result).toBe(true);
      expect(getMultiObjectJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      expect(deleteMultiObjectJob('nonexistent')).toBe(false);
    });
  });

  describe('clearMultiObjectJobs', () => {
    it('should clear all multi-object jobs', () => {
      createMultiObjectJob({ backgroundPrompt: 'bg1', objects: [{ prompt: 'obj1' }] });
      createMultiObjectJob({ backgroundPrompt: 'bg2', objects: [{ prompt: 'obj2' }] });

      expect(listMultiObjectJobs().length).toBe(2);

      clearMultiObjectJobs();

      expect(listMultiObjectJobs().length).toBe(0);
    });
  });
});
