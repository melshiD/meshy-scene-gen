import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parsePrompts,
  validateRequest,
  getJobStatus,
  validateMultiObjectRequest,
  isMultiObjectRequest,
  buildSceneObjectsFromJob,
  getMultiObjectJobStatus,
} from './generate-asset';
import { clearJobs, clearMultiObjectJobs, createMultiObjectJob, updateBackgroundStatus, updateObjectStatus } from './job-store';
import { clearCustomPresets } from '@/lib/presets';
import type { MultiObjectGenerationJob } from '@/types';

// Mock the external modules
vi.mock('@/lib/image-gen', () => ({
  decomposePrompt: vi.fn(),
  createManualPrompt: vi.fn(),
  generateBackgroundWithMood: vi.fn(),
  generateBackground: vi.fn(),
}));

vi.mock('@/lib/meshy', () => ({
  generateMesh: vi.fn(),
  getMeshUrl: vi.fn(),
}));

vi.mock('@/lib/scene', () => ({
  createScene: vi.fn(),
  captureMultiResolution: vi.fn(),
}));

import { decomposePrompt } from '@/lib/image-gen';

describe('Generate Asset Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearJobs();
    clearMultiObjectJobs();
    clearCustomPresets();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parsePrompts', () => {
    it('should use split prompts directly', async () => {
      const result = await parsePrompts({
        objectPrompt: 'golden trophy',
        backgroundPrompt: 'marble pedestal',
      });

      expect(result.objectPrompt).toBe('golden trophy');
      expect(result.backgroundPrompt).toBe('marble pedestal');
      expect(result.mood).toBe('neutral');
      expect(decomposePrompt).not.toHaveBeenCalled();
    });

    it('should decompose single prompt', async () => {
      vi.mocked(decomposePrompt).mockResolvedValueOnce({
        success: true,
        data: {
          object: 'crystal dragon',
          background: 'misty mountain peaks',
          mood: 'dramatic',
          camera: 'low angle',
        },
      });

      const result = await parsePrompts({
        prompt: 'crystal dragon on misty mountain',
      });

      expect(result.objectPrompt).toBe('crystal dragon');
      expect(result.backgroundPrompt).toBe('misty mountain peaks');
      expect(result.mood).toBe('dramatic');
      expect(decomposePrompt).toHaveBeenCalledWith('crystal dragon on misty mountain');
    });

    it('should throw if decomposition fails', async () => {
      vi.mocked(decomposePrompt).mockResolvedValueOnce({
        success: false,
        error: 'Failed to parse prompt',
      });

      await expect(
        parsePrompts({ prompt: 'invalid prompt' })
      ).rejects.toThrow('Failed to decompose prompt: Failed to parse prompt');
    });

    it('should throw if no prompts provided', async () => {
      await expect(parsePrompts({})).rejects.toThrow(
        'Either prompt or objectPrompt+backgroundPrompt must be provided'
      );
    });
  });

  describe('validateRequest', () => {
    it('should accept valid single prompt request', () => {
      const result = validateRequest({
        prompt: 'crystal dragon on mountain',
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid split prompt request', () => {
      const result = validateRequest({
        objectPrompt: 'crystal dragon',
        backgroundPrompt: 'misty mountain',
      });

      expect(result.valid).toBe(true);
    });

    it('should reject request with no prompts', () => {
      const result = validateRequest({});

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Must provide either');
    });

    it('should reject request with only objectPrompt', () => {
      const result = validateRequest({
        objectPrompt: 'dragon',
      });

      expect(result.valid).toBe(false);
    });

    it('should reject request with only backgroundPrompt', () => {
      const result = validateRequest({
        backgroundPrompt: 'mountain',
      });

      expect(result.valid).toBe(false);
    });

    it('should accept request with preset', () => {
      const result = validateRequest({
        prompt: 'dragon',
        preset: 'hero',
      });

      expect(result.valid).toBe(true);
    });

    it('should reject request with non-existent preset', () => {
      const result = validateRequest({
        prompt: 'dragon',
        preset: 'nonexistent',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Preset "nonexistent" not found');
    });
  });

  describe('getJobStatus', () => {
    it('should return undefined for non-existent job', () => {
      const result = getJobStatus('nonexistent');
      expect(result).toBeUndefined();
    });
  });
});

// ============================================================================
// Multi-Object Generation Tests
// ============================================================================

describe('Multi-Object Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearJobs();
    clearMultiObjectJobs();
    clearCustomPresets();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isMultiObjectRequest', () => {
    it('should return true for multi-object request', () => {
      const result = isMultiObjectRequest({
        backgroundPrompt: 'mountain scene',
        objects: [{ prompt: 'dragon' }],
      });
      expect(result).toBe(true);
    });

    it('should return false for single-object request', () => {
      const result = isMultiObjectRequest({
        prompt: 'dragon on mountain',
      });
      expect(result).toBe(false);
    });

    it('should return false for split prompt request', () => {
      const result = isMultiObjectRequest({
        objectPrompt: 'dragon',
        backgroundPrompt: 'mountain',
      });
      expect(result).toBe(false);
    });
  });

  describe('validateMultiObjectRequest', () => {
    it('should accept valid multi-object request', () => {
      const result = validateMultiObjectRequest({
        backgroundPrompt: 'misty mountain',
        objects: [
          { prompt: 'crystal dragon' },
          { prompt: 'golden trophy' },
        ],
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject request without backgroundPrompt', () => {
      const result = validateMultiObjectRequest({
        backgroundPrompt: '',
        objects: [{ prompt: 'dragon' }],
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('backgroundPrompt is required');
    });

    it('should reject request without objects', () => {
      const result = validateMultiObjectRequest({
        backgroundPrompt: 'mountain',
        objects: [],
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('At least one object is required');
    });

    it('should reject request with too many objects', () => {
      const result = validateMultiObjectRequest({
        backgroundPrompt: 'mountain',
        objects: Array(11).fill({ prompt: 'object' }),
        maxObjects: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Too many objects');
    });

    it('should reject request with empty object prompt', () => {
      const result = validateMultiObjectRequest({
        backgroundPrompt: 'mountain',
        objects: [{ prompt: 'dragon' }, { prompt: '' }],
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Object at index 1 has empty prompt');
    });

    it('should reject request with non-existent scene preset', () => {
      const result = validateMultiObjectRequest({
        backgroundPrompt: 'mountain',
        objects: [{ prompt: 'dragon' }],
        scenePreset: 'nonexistent',
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Scene preset "nonexistent" not found');
    });

    it('should accept request with valid scene preset', () => {
      const result = validateMultiObjectRequest({
        backgroundPrompt: 'mountain',
        objects: [{ prompt: 'dragon' }],
        scenePreset: 'hero',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('buildSceneObjectsFromJob', () => {
    it('should build scene objects with positions from layout', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'mountain',
        objects: [
          { prompt: 'dragon' },
          { prompt: 'trophy' },
        ],
      });
      updateObjectStatus(job.id, 'obj-0', 'completed', 100, 'https://example.com/dragon.glb');
      updateObjectStatus(job.id, 'obj-1', 'completed', 100, 'https://example.com/trophy.glb');

      const updatedJob = createMultiObjectJob({
        backgroundPrompt: 'mountain',
        objects: [
          { prompt: 'dragon' },
          { prompt: 'trophy' },
        ],
      });
      updatedJob.objects[0].meshUrl = 'https://example.com/dragon.glb';
      updatedJob.objects[0].status = 'completed';
      updatedJob.objects[1].meshUrl = 'https://example.com/trophy.glb';
      updatedJob.objects[1].status = 'completed';

      const sceneObjects = buildSceneObjectsFromJob(updatedJob, 'line');

      expect(sceneObjects.length).toBe(2);
      expect(sceneObjects[0].meshUrl).toBe('https://example.com/dragon.glb');
      expect(sceneObjects[1].meshUrl).toBe('https://example.com/trophy.glb');
      // Positions should be different for line layout
      expect(sceneObjects[0].position.x).not.toBe(sceneObjects[1].position.x);
    });

    it('should use centered layout by default', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'mountain',
        objects: [{ prompt: 'single' }],
      });

      const sceneObjects = buildSceneObjectsFromJob(job);

      expect(sceneObjects.length).toBe(1);
      expect(sceneObjects[0].position).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('getMultiObjectJobStatus', () => {
    it('should return job with progress', () => {
      const job = createMultiObjectJob({
        backgroundPrompt: 'mountain',
        objects: [{ prompt: 'dragon' }],
      });
      updateBackgroundStatus(job.id, 'completed', 'https://example.com/bg.png');

      const result = getMultiObjectJobStatus(job.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(job.id);
      expect(result?.progress).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent job', () => {
      const result = getMultiObjectJobStatus('nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
