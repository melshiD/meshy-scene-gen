/**
 * Background Image Generation Client
 *
 * Generates scene backgrounds using the OpenAI images API (GPT-image family;
 * dall-e-3 was removed from the API on 2026-05-12).
 */

import OpenAI from 'openai';

// ============================================================================
// Types
// ============================================================================

export interface BackgroundClientConfig {
  apiKey: string;
  /** Image model (defaults to BACKGROUND_IMAGE_MODEL env var, then gpt-image-1) */
  model?: string;
}

export type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
export type ImageQuality = 'low' | 'medium' | 'high' | 'auto';

export interface GenerateBackgroundOptions {
  /** The scene/background description */
  prompt: string;
  /** Image dimensions (default: 1024x1024) */
  size?: ImageSize;
  /** Image quality (default: medium) */
  quality?: ImageQuality;
  /** Additional context to prepend to prompt */
  context?: string;
}

export interface GeneratedBackground {
  /** data: URL carrying the generated image (GPT-image models return b64 only) */
  url: string;
  /** Revised prompt if model modified it */
  revisedPrompt?: string;
}

export interface BackgroundError extends Error {
  code?: string;
  statusCode?: number;
}

// ============================================================================
// Prompt Engineering
// ============================================================================

const BACKGROUND_SYSTEM_CONTEXT = `
You are generating a background image for 3D product/character placement.
The background should:
- Have depth and dimension suitable for 3D object placement
- Leave a clear focal area in the center/foreground for the 3D object
- Have appropriate lighting that will complement a 3D rendered object
- Be high quality and suitable for commercial/professional use
`.trim();

/**
 * Enhance a basic prompt with background-specific instructions
 */
export function enhanceBackgroundPrompt(
  prompt: string,
  context?: string
): string {
  const parts: string[] = [];

  if (context) {
    parts.push(context);
  }

  // Add background-specific enhancements
  parts.push(prompt);
  parts.push(
    'Professional quality, suitable as a background for 3D product placement.'
  );
  parts.push('Clear focal area in center, good depth and lighting.');

  return parts.join(' ');
}

// ============================================================================
// Client Implementation
// ============================================================================

/**
 * Creates a background generation client instance
 */
export function createBackgroundClient(
  config: BackgroundClientConfig
): BackgroundClient {
  return new BackgroundClient(config);
}

export class BackgroundClient {
  private openai: OpenAI;
  private model: string;

  constructor(config: BackgroundClientConfig) {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.openai = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? process.env.BACKGROUND_IMAGE_MODEL ?? 'gpt-image-1';
  }

  /**
   * Generate a background image from a prompt
   */
  async generate(options: GenerateBackgroundOptions): Promise<GeneratedBackground> {
    const enhancedPrompt = enhanceBackgroundPrompt(
      options.prompt,
      options.context
    );

    try {
      // GPT-image param surface (docs, 2026-07): model, prompt, n, size, quality. The legacy
      // dall-e-3 params response_format/style don't exist here (dall-e-3 removed 2026-05-12).
      const response = await this.openai.images.generate({
        model: this.model,
        prompt: enhancedPrompt,
        n: 1,
        size: options.size ?? '1024x1024',
        quality: options.quality ?? 'medium',
      });

      const image = response.data?.[0];
      // GPT-image models return base64 only; url branch kept as a fallback.
      const url = image?.b64_json
        ? `data:image/png;base64,${image.b64_json}`
        : image?.url;
      if (!url) {
        throw new Error('No image payload returned from the images API');
      }

      return {
        url,
        revisedPrompt: image?.revised_prompt,
      };
    } catch (err) {
      // Re-throw if already a BackgroundError or standard Error
      if (err instanceof Error) {
        // Check if it's an OpenAI API error by duck typing
        const apiErr = err as { status?: number; code?: string | null };
        if (apiErr.status !== undefined) {
          const bgError = new Error(err.message) as BackgroundError;
          bgError.code = apiErr.code ?? undefined;
          bgError.statusCode = apiErr.status;
          throw bgError;
        }
        throw err;
      }

      throw new Error('Unknown error during image generation');
    }
  }

  /**
   * Generate multiple background variations
   */
  async generateVariations(
    options: GenerateBackgroundOptions,
    count: number = 3
  ): Promise<GeneratedBackground[]> {
    // Independent requests give more varied results than a single n>1 call
    const promises = Array.from({ length: count }, () =>
      this.generate(options)
    );

    const results = await Promise.allSettled(promises);

    return results
      .filter(
        (r): r is PromiseFulfilledResult<GeneratedBackground> =>
          r.status === 'fulfilled'
      )
      .map((r) => r.value);
  }

  /**
   * Generate a background optimized for specific moods
   */
  async generateWithMood(
    basePrompt: string,
    mood: BackgroundMood,
    options?: Omit<GenerateBackgroundOptions, 'prompt' | 'context'>
  ): Promise<GeneratedBackground> {
    const moodContext = MOOD_CONTEXTS[mood];

    return this.generate({
      ...options,
      prompt: basePrompt,
      context: moodContext,
    });
  }
}

// ============================================================================
// Mood Presets
// ============================================================================

export type BackgroundMood =
  | 'dramatic'
  | 'soft'
  | 'energetic'
  | 'calm'
  | 'luxurious'
  | 'playful'
  | 'professional'
  | 'nature';

const MOOD_CONTEXTS: Record<BackgroundMood, string> = {
  dramatic:
    'Dramatic lighting with strong shadows and highlights, cinematic mood, high contrast.',
  soft: 'Soft, diffused lighting, gentle gradients, calm and peaceful atmosphere.',
  energetic:
    'Vibrant colors, dynamic composition, sense of movement and energy.',
  calm: 'Serene and tranquil, muted colors, zen-like peaceful atmosphere.',
  luxurious:
    'Premium feel, rich textures, elegant and sophisticated, high-end aesthetic.',
  playful:
    'Fun and whimsical, bright cheerful colors, lighthearted atmosphere.',
  professional:
    'Clean and modern, neutral tones, corporate/business appropriate.',
  nature:
    'Natural environment, organic textures, earthy tones, outdoor setting.',
};

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a client from environment variables
 */
export function createBackgroundClientFromEnv(): BackgroundClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
  return createBackgroundClient({ apiKey });
}

/**
 * List available mood presets
 */
export function listMoods(): BackgroundMood[] {
  return Object.keys(MOOD_CONTEXTS) as BackgroundMood[];
}

/**
 * Get description for a mood
 */
export function getMoodDescription(mood: BackgroundMood): string {
  return MOOD_CONTEXTS[mood];
}

/**
 * Validate image size
 */
export function isValidSize(size: string): size is ImageSize {
  return ['1024x1024', '1536x1024', '1024x1536', 'auto'].includes(size);
}
