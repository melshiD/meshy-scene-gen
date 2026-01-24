import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MeshyClient,
  createMeshyClient,
  createMeshyClientFromEnv,
  isTaskComplete,
  isTaskPending,
  getGlbUrl,
} from './client';
import type { MeshyTask } from '@/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MeshyClient', () => {
  const mockApiKey = 'test-api-key';
  let client: MeshyClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = createMeshyClient({ apiKey: mockApiKey });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createMeshyClient', () => {
    it('should create a client with valid config', () => {
      const c = createMeshyClient({ apiKey: 'test-key' });
      expect(c).toBeInstanceOf(MeshyClient);
    });

    it('should throw if API key is missing', () => {
      expect(() => createMeshyClient({ apiKey: '' })).toThrow(
        'Meshy API key is required'
      );
    });

    it('should allow custom base URL', () => {
      const c = createMeshyClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
      });
      expect(c).toBeInstanceOf(MeshyClient);
    });
  });

  describe('createMeshyClientFromEnv', () => {
    it('should create client from environment variable', () => {
      const originalEnv = process.env.MESHY_API_KEY;
      process.env.MESHY_API_KEY = 'env-api-key';

      const c = createMeshyClientFromEnv();
      expect(c).toBeInstanceOf(MeshyClient);

      process.env.MESHY_API_KEY = originalEnv;
    });

    it('should throw if environment variable is missing', () => {
      const originalEnv = process.env.MESHY_API_KEY;
      delete process.env.MESHY_API_KEY;

      expect(() => createMeshyClientFromEnv()).toThrow(
        'MESHY_API_KEY environment variable is required'
      );

      process.env.MESHY_API_KEY = originalEnv;
    });
  });

  describe('createTask', () => {
    it('should create a task with default options', async () => {
      const mockTaskId = 'task-123';
      const mockTask: MeshyTask = {
        id: mockTaskId,
        status: 'PENDING',
        progress: 0,
        created_at: Date.now(),
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: mockTaskId }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTask),
        });

      const result = await client.createTask({ prompt: 'a red cube' });

      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Check POST request body
      const postCall = mockFetch.mock.calls[0];
      expect(postCall[0]).toContain('/text-to-3d');
      expect(postCall[1].method).toBe('POST');
      expect(JSON.parse(postCall[1].body)).toEqual({
        mode: 'preview',
        prompt: 'a red cube',
        art_style: 'realistic',
        negative_prompt: undefined,
      });
    });

    it('should support custom art style and negative prompt', async () => {
      const mockTaskId = 'task-456';
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: mockTaskId }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ id: mockTaskId, status: 'PENDING', progress: 0, created_at: Date.now() }),
        });

      await client.createTask({
        prompt: 'a blue sphere',
        artStyle: 'cartoon',
        negativePrompt: 'realistic, photorealistic',
        mode: 'preview',
      });

      const postCall = mockFetch.mock.calls[0];
      expect(JSON.parse(postCall[1].body)).toEqual({
        mode: 'preview',
        prompt: 'a blue sphere',
        art_style: 'cartoon',
        negative_prompt: 'realistic, photorealistic',
      });
    });
  });

  describe('getTask', () => {
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

      const result = await client.getTask('task-789');

      expect(result).toEqual(mockTask);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/text-to-3d/task-789'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Task not found' }),
      });

      await expect(client.getTask('invalid-id')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('pollUntilComplete', () => {
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

      const result = await client.pollUntilComplete('task-123');
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

      await expect(client.pollUntilComplete('task-123')).rejects.toThrow(
        'Generation failed'
      );
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

      await expect(client.pollUntilComplete('task-123')).rejects.toThrow(
        'Meshy task expired'
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

      await client.pollUntilComplete('task-123', {
        onProgress: progressCallback,
      });

      expect(progressCallback).toHaveBeenCalledWith(100, 'SUCCEEDED');
    });
  });

  describe('listTasks', () => {
    it('should list tasks without pagination', async () => {
      const mockTasks: MeshyTask[] = [
        { id: 'task-1', status: 'SUCCEEDED', progress: 100, created_at: Date.now() },
        { id: 'task-2', status: 'PENDING', progress: 0, created_at: Date.now() },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTasks),
      });

      const result = await client.listTasks();
      expect(result).toEqual(mockTasks);
    });

    it('should support pagination params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      await client.listTasks({ pageNum: 2, pageSize: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pageNum=2'),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=10'),
        expect.anything()
      );
    });
  });

  describe('refineTask', () => {
    it('should create a refine task from preview', async () => {
      const mockRefinedTaskId = 'refined-task-123';
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: mockRefinedTaskId }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: mockRefinedTaskId,
              status: 'PENDING',
              progress: 0,
              created_at: Date.now(),
            }),
        });

      const result = await client.refineTask('preview-task-123');

      expect(result.id).toBe(mockRefinedTaskId);
      const postCall = mockFetch.mock.calls[0];
      expect(JSON.parse(postCall[1].body)).toEqual({
        mode: 'refine',
        preview_task_id: 'preview-task-123',
      });
    });
  });
});

describe('Helper functions', () => {
  describe('isTaskComplete', () => {
    it('should return true for terminal states', () => {
      expect(isTaskComplete('SUCCEEDED')).toBe(true);
      expect(isTaskComplete('FAILED')).toBe(true);
      expect(isTaskComplete('EXPIRED')).toBe(true);
    });

    it('should return false for pending states', () => {
      expect(isTaskComplete('PENDING')).toBe(false);
      expect(isTaskComplete('IN_PROGRESS')).toBe(false);
    });
  });

  describe('isTaskPending', () => {
    it('should return true for pending states', () => {
      expect(isTaskPending('PENDING')).toBe(true);
      expect(isTaskPending('IN_PROGRESS')).toBe(true);
    });

    it('should return false for terminal states', () => {
      expect(isTaskPending('SUCCEEDED')).toBe(false);
      expect(isTaskPending('FAILED')).toBe(false);
      expect(isTaskPending('EXPIRED')).toBe(false);
    });
  });

  describe('getGlbUrl', () => {
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

      expect(getGlbUrl(task)).toBe('https://example.com/model.glb');
    });

    it('should return null if no model URLs', () => {
      const task: MeshyTask = {
        id: 'task-123',
        status: 'PENDING',
        progress: 0,
        created_at: Date.now(),
      };

      expect(getGlbUrl(task)).toBeNull();
    });
  });
});
