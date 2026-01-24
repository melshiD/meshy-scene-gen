import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createMeshTask,
  getMeshTaskStatus,
  waitForMesh,
  getMeshUrl,
  generateMesh,
  MeshyError,
} from './client';
import type { MeshyTask } from '@/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Meshy API Client', () => {
  const originalEnv = process.env.MESHY_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MESHY_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env.MESHY_API_KEY = originalEnv;
  });

  describe('createMeshTask', () => {
    it('should create a task with default options', async () => {
      const mockTask: MeshyTask = {
        id: 'task-123',
        status: 'PENDING',
        progress: 0,
        created_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      const result = await createMeshTask({ prompt: 'a red cube' });

      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toContain('/text-to-3d');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual({
        mode: 'preview',
        prompt: 'a red cube',
        art_style: 'realistic',
      });
    });

    it('should support custom art style and negative prompt', async () => {
      const mockTask: MeshyTask = {
        id: 'task-456',
        status: 'PENDING',
        progress: 0,
        created_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      await createMeshTask({
        prompt: 'a blue sphere',
        artStyle: 'cartoon',
        negativePrompt: 'realistic, photorealistic',
        mode: 'preview',
      });

      const [, options] = mockFetch.mock.calls[0];
      expect(JSON.parse(options.body)).toEqual({
        mode: 'preview',
        prompt: 'a blue sphere',
        art_style: 'cartoon',
        negative_prompt: 'realistic, photorealistic',
      });
    });

    it('should throw MeshyError if API key is missing', async () => {
      delete process.env.MESHY_API_KEY;

      await expect(createMeshTask({ prompt: 'test' })).rejects.toThrow(
        MeshyError
      );
      await expect(createMeshTask({ prompt: 'test' })).rejects.toThrow(
        'MESHY_API_KEY environment variable is not set'
      );
    });
  });

  describe('getMeshTaskStatus', () => {
    it('should fetch task by ID', async () => {
      const mockTask: MeshyTask = {
        id: 'task-789',
        status: 'SUCCEEDED',
        progress: 100,
        model_urls: {
          glb: 'https://example.com/model.glb',
          fbx: 'https://example.com/model.fbx',
          usdz: 'https://example.com/model.usdz',
          obj: 'https://example.com/model.obj',
        },
        thumbnail_url: 'https://example.com/thumb.png',
        created_at: Date.now(),
        finished_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      const result = await getMeshTaskStatus('task-789');

      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/text-to-3d/task-789'),
        expect.anything()
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(JSON.stringify({ message: 'Task not found' })),
      });

      await expect(getMeshTaskStatus('invalid-id')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('waitForMesh', () => {
    it('should return immediately if task is succeeded', async () => {
      const mockTask: MeshyTask = {
        id: 'task-123',
        status: 'SUCCEEDED',
        progress: 100,
        model_urls: { glb: 'url', fbx: 'url', usdz: 'url', obj: 'url' },
        created_at: Date.now(),
        finished_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      const result = await waitForMesh('task-123');
      expect(result.status).toBe('SUCCEEDED');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on failed task', async () => {
      const mockTask: MeshyTask = {
        id: 'task-123',
        status: 'FAILED',
        progress: 50,
        task_error: { message: 'Generation failed' },
        created_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      await expect(waitForMesh('task-123')).rejects.toThrow('Generation failed');
    });

    it('should throw on expired task', async () => {
      const mockTask: MeshyTask = {
        id: 'task-123',
        status: 'EXPIRED',
        progress: 0,
        created_at: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTask),
      });

      await expect(waitForMesh('task-123')).rejects.toThrow(
        'Mesh task expired before completion'
      );
    });

    it('should call onProgress callback', async () => {
      const progressCallback = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'task-123',
            status: 'SUCCEEDED',
            progress: 100,
            model_urls: { glb: 'url', fbx: 'url', usdz: 'url', obj: 'url' },
            created_at: Date.now(),
          }),
      });

      await waitForMesh('task-123', { onProgress: progressCallback });

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'SUCCEEDED', progress: 100 })
      );
    });
  });

  describe('getMeshUrl', () => {
    it('should return GLB URL from completed task', () => {
      const task: MeshyTask = {
        id: 'task-123',
        status: 'SUCCEEDED',
        progress: 100,
        model_urls: {
          glb: 'https://example.com/model.glb',
          fbx: 'https://example.com/model.fbx',
          usdz: 'https://example.com/model.usdz',
          obj: 'https://example.com/model.obj',
        },
        created_at: Date.now(),
      };

      expect(getMeshUrl(task)).toBe('https://example.com/model.glb');
      expect(getMeshUrl(task, 'fbx')).toBe('https://example.com/model.fbx');
    });

    it('should throw if task not succeeded', () => {
      const task: MeshyTask = {
        id: 'task-123',
        status: 'PENDING',
        progress: 0,
        created_at: Date.now(),
      };

      expect(() => getMeshUrl(task)).toThrow(MeshyError);
      expect(() => getMeshUrl(task)).toThrow('expected SUCCEEDED');
    });

    it('should throw if model_urls missing', () => {
      const task: MeshyTask = {
        id: 'task-123',
        status: 'SUCCEEDED',
        progress: 100,
        created_at: Date.now(),
      };

      expect(() => getMeshUrl(task)).toThrow('model_urls is missing');
    });
  });

  describe('generateMesh', () => {
    it('should create and wait for mesh', async () => {
      const pendingTask: MeshyTask = {
        id: 'task-123',
        status: 'PENDING',
        progress: 0,
        created_at: Date.now(),
      };

      const completedTask: MeshyTask = {
        id: 'task-123',
        status: 'SUCCEEDED',
        progress: 100,
        model_urls: { glb: 'url', fbx: 'url', usdz: 'url', obj: 'url' },
        created_at: Date.now(),
        finished_at: Date.now(),
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(pendingTask),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(completedTask),
        });

      const result = await generateMesh({ prompt: 'test object' });

      expect(result.status).toBe('SUCCEEDED');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('MeshyError', () => {
    it('should have proper error properties', () => {
      const error = new MeshyError('Test error', 'API_ERROR', 500, 'task-123');

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('API_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.taskId).toBe('task-123');
      expect(error.name).toBe('MeshyError');
    });
  });
});
