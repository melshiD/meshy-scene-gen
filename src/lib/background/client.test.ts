import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Create mock that will be used across all tests
const mockGenerate = vi.fn();

// Mock OpenAI module
vi.mock('openai', () => {
  return {
    default: class MockOpenAI {
      images = {
        generate: mockGenerate,
      };
    },
  };
});

import {
  BackgroundClient,
  createBackgroundClient,
  createBackgroundClientFromEnv,
  enhanceBackgroundPrompt,
  listMoods,
  getMoodDescription,
  isValidSize,
} from './client';

describe('BackgroundClient', () => {
  const mockApiKey = 'test-openai-key';
  let client: BackgroundClient;

  beforeEach(() => {
    mockGenerate.mockReset();
    client = createBackgroundClient({ apiKey: mockApiKey });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createBackgroundClient', () => {
    it('should create a client with valid config', () => {
      const c = createBackgroundClient({ apiKey: 'test-key' });
      expect(c).toBeInstanceOf(BackgroundClient);
    });

    it('should throw if API key is missing', () => {
      expect(() => createBackgroundClient({ apiKey: '' })).toThrow(
        'OpenAI API key is required'
      );
    });
  });

  describe('createBackgroundClientFromEnv', () => {
    it('should create client from environment variable', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'env-api-key';

      const c = createBackgroundClientFromEnv();
      expect(c).toBeInstanceOf(BackgroundClient);

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it('should throw if environment variable is missing', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => createBackgroundClientFromEnv()).toThrow(
        'OPENAI_API_KEY environment variable is required'
      );

      process.env.OPENAI_API_KEY = originalEnv;
    });
  });

  describe('generate', () => {
    it('should generate a background with default options', async () => {
      const mockUrl = 'https://oai.example.com/image.png';
      const mockRevisedPrompt = 'Enhanced prompt';

      mockGenerate.mockResolvedValueOnce({
        data: [{ url: mockUrl, revised_prompt: mockRevisedPrompt }],
      });

      const result = await client.generate({ prompt: 'a sunset beach' });

      expect(result.url).toBe(mockUrl);
      expect(result.revisedPrompt).toBe(mockRevisedPrompt);
      expect(mockGenerate).toHaveBeenCalledWith({
        model: 'dall-e-3',
        prompt: expect.stringContaining('a sunset beach'),
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural',
      });
    });

    it('should support custom size, quality, and style', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: [{ url: 'https://example.com/image.png' }],
      });

      await client.generate({
        prompt: 'a forest scene',
        size: '1792x1024',
        quality: 'standard',
        style: 'vivid',
      });

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          size: '1792x1024',
          quality: 'standard',
          style: 'vivid',
        })
      );
    });

    it('should include context in enhanced prompt', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: [{ url: 'https://example.com/image.png' }],
      });

      await client.generate({
        prompt: 'mountain landscape',
        context: 'Dramatic lighting with stormy sky.',
      });

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Dramatic lighting with stormy sky'),
        })
      );
    });

    it('should throw if no image URL returned', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: [{}],
      });

      await expect(client.generate({ prompt: 'test' })).rejects.toThrow(
        'No image URL returned from DALL-E'
      );
    });
  });

  describe('generateVariations', () => {
    it('should generate multiple variations', async () => {
      mockGenerate
        .mockResolvedValueOnce({
          data: [{ url: 'https://example.com/1.png' }],
        })
        .mockResolvedValueOnce({
          data: [{ url: 'https://example.com/2.png' }],
        })
        .mockResolvedValueOnce({
          data: [{ url: 'https://example.com/3.png' }],
        });

      const results = await client.generateVariations(
        { prompt: 'a city skyline' },
        3
      );

      expect(results).toHaveLength(3);
      expect(results[0].url).toBe('https://example.com/1.png');
      expect(results[1].url).toBe('https://example.com/2.png');
      expect(results[2].url).toBe('https://example.com/3.png');
    });

    it('should handle partial failures gracefully', async () => {
      mockGenerate
        .mockResolvedValueOnce({
          data: [{ url: 'https://example.com/1.png' }],
        })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({
          data: [{ url: 'https://example.com/3.png' }],
        });

      const results = await client.generateVariations({ prompt: 'test' }, 3);

      expect(results).toHaveLength(2);
    });
  });

  describe('generateWithMood', () => {
    it('should add mood context to generation', async () => {
      mockGenerate.mockResolvedValueOnce({
        data: [{ url: 'https://example.com/image.png' }],
      });

      await client.generateWithMood('forest scene', 'dramatic');

      expect(mockGenerate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Dramatic lighting'),
        })
      );
    });

    it('should support all mood presets', async () => {
      const moods = listMoods();

      for (const mood of moods) {
        mockGenerate.mockResolvedValueOnce({
          data: [{ url: 'https://example.com/image.png' }],
        });

        await client.generateWithMood('test scene', mood);
      }

      expect(mockGenerate).toHaveBeenCalledTimes(moods.length);
    });
  });
});

describe('Helper functions', () => {
  describe('enhanceBackgroundPrompt', () => {
    it('should add background-specific instructions', () => {
      const result = enhanceBackgroundPrompt('a sunset beach');

      expect(result).toContain('a sunset beach');
      expect(result).toContain('Professional quality');
      expect(result).toContain('focal area');
    });

    it('should include context if provided', () => {
      const result = enhanceBackgroundPrompt(
        'a sunset beach',
        'Warm golden hour lighting.'
      );

      expect(result).toContain('Warm golden hour lighting');
      expect(result).toContain('a sunset beach');
    });
  });

  describe('listMoods', () => {
    it('should return all available moods', () => {
      const moods = listMoods();

      expect(moods).toContain('dramatic');
      expect(moods).toContain('soft');
      expect(moods).toContain('energetic');
      expect(moods).toContain('calm');
      expect(moods).toContain('luxurious');
      expect(moods).toContain('playful');
      expect(moods).toContain('professional');
      expect(moods).toContain('nature');
      expect(moods).toHaveLength(8);
    });
  });

  describe('getMoodDescription', () => {
    it('should return description for each mood', () => {
      const moods = listMoods();

      for (const mood of moods) {
        const description = getMoodDescription(mood);
        expect(typeof description).toBe('string');
        expect(description.length).toBeGreaterThan(10);
      }
    });
  });

  describe('isValidSize', () => {
    it('should return true for valid sizes', () => {
      expect(isValidSize('1024x1024')).toBe(true);
      expect(isValidSize('1792x1024')).toBe(true);
      expect(isValidSize('1024x1792')).toBe(true);
    });

    it('should return false for invalid sizes', () => {
      expect(isValidSize('512x512')).toBe(false);
      expect(isValidSize('invalid')).toBe(false);
      expect(isValidSize('')).toBe(false);
    });
  });
});
