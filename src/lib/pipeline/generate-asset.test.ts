import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parsePrompts, validateRequest, getJobStatus } from './generate-asset';
import { clearJobs } from './job-store';
import { clearCustomPresets } from '@/lib/presets';

// Mock the external modules
vi.mock('@/lib/image-gen', () => ({
  decomposePrompt: vi.fn(),
  createManualPrompt: vi.fn(),
  generateBackgroundWithMood: vi.fn(),
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
