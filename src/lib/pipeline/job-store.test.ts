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
