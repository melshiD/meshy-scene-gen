/**
 * Background Generator - Generate scene backgrounds via DALL-E 3
 *
 * Creates high-quality background images optimized for 3D scene composition.
 * Backgrounds are generated without the main subject to allow clean compositing.
 */

import OpenAI from 'openai';

// ============================================================================
// Types
// ============================================================================

/** Supported image sizes for DALL-E 3 */
export type DallESize = '1024x1024' | '1792x1024' | '1024x1792';

/** Image quality options */
export type DallEQuality = 'standard' | 'hd';

/** Image style options */
export type DallEStyle = 'vivid' | 'natural';

/** Configuration for background generation */
export interface BackgroundConfig {
  /** OpenAI API key (defaults to OPENAI_API_KEY env var) */
  apiKey?: string;
  /** Image size */
  size?: DallESize;
  /** Image quality */
  quality?: DallEQuality;
  /** Image style */
  style?: DallEStyle;
  /** Additional prompt modifiers */
  modifiers?: string[];
}

/** Successful generation result */
interface GenerateSuccess {
  success: true;
  /** URL to the generated image */
  url: string;
  /** Revised prompt used by DALL-E */
  revisedPrompt: string;
}

/** Failed generation result */
interface GenerateError {
  success: false;
  error: string;
}

export type GenerateBackgroundResult = GenerateSuccess | GenerateError;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<BackgroundConfig, 'apiKey' | 'modifiers'>> = {
  size: '1024x1024',
  quality: 'hd',
  style: 'natural',
};

/**
 * Prompt enhancement for better background generation
 * These modifiers help DALL-E produce backgrounds suitable for 3D compositing
 */
const BACKGROUND_MODIFIERS = [
  'empty scene without any objects in the foreground',
  'suitable for product photography compositing',
  'clean composition with space for subject placement',
  'professional lighting',
];

// ============================================================================
// OpenAI Client
// ============================================================================

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getClient(apiKey?: string): OpenAI {
  const key = apiKey ?? process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error(
      'OpenAI API key not found. Set OPENAI_API_KEY environment variable or pass apiKey option.'
    );
  }

  if (!openaiClient || apiKey) {
    openaiClient = new OpenAI({ apiKey: key });
  }

  return openaiClient;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate a background image using DALL-E 3
 *
 * @param description - Description of the background scene
 * @param config - Optional generation configuration
 * @returns GenerateBackgroundResult with image URL or error
 *
 * @example
 * ```typescript
 * const result = await generateBackground(
 *   "minimalist studio with soft gradient lighting",
 *   { quality: 'hd', style: 'natural' }
 * );
 * if (result.success) {
 *   console.log(result.url); // DALL-E image URL
 * }
 * ```
 */
export async function generateBackground(
  description: string,
  config: BackgroundConfig = {}
): Promise<GenerateBackgroundResult> {
  // Validate input
  if (!description || typeof description !== 'string') {
    return {
      success: false,
      error: 'Description must be a non-empty string',
    };
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length === 0) {
    return {
      success: false,
      error: 'Description cannot be empty',
    };
  }

  if (trimmedDescription.length > 4000) {
    return {
      success: false,
      error: 'Description exceeds maximum length of 4000 characters',
    };
  }

  try {
    const client = getClient(config.apiKey);

    // Build enhanced prompt with modifiers
    const userModifiers = config.modifiers ?? [];
    const allModifiers = [...BACKGROUND_MODIFIERS, ...userModifiers];
    const enhancedPrompt = buildBackgroundPrompt(trimmedDescription, allModifiers);

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: config.size ?? DEFAULT_CONFIG.size,
      quality: config.quality ?? DEFAULT_CONFIG.quality,
      style: config.style ?? DEFAULT_CONFIG.style,
      response_format: 'url',
    });

    if (!response.data || response.data.length === 0) {
      return {
        success: false,
        error: 'No image data in DALL-E response',
      };
    }

    const imageData = response.data[0];
    if (!imageData?.url) {
      return {
        success: false,
        error: 'No image URL in DALL-E response',
      };
    }

    return {
      success: true,
      url: imageData.url,
      revisedPrompt: imageData.revised_prompt ?? enhancedPrompt,
    };
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      // Handle specific API errors
      if (error.status === 400) {
        return {
          success: false,
          error: `Invalid request: ${error.message}`,
        };
      }
      if (error.status === 401) {
        return {
          success: false,
          error: 'Invalid API key',
        };
      }
      if (error.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
        };
      }
      if (error.status === 500) {
        return {
          success: false,
          error: 'OpenAI server error. Please try again.',
        };
      }

      return {
        success: false,
        error: `DALL-E API error: ${error.message}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate a background with mood-based styling
 *
 * Automatically adds mood-appropriate modifiers to the prompt.
 *
 * @param description - Base background description
 * @param mood - Mood/atmosphere to apply
 * @param config - Optional generation configuration
 */
export async function generateBackgroundWithMood(
  description: string,
  mood: string,
  config: BackgroundConfig = {}
): Promise<GenerateBackgroundResult> {
  const moodModifiers = getMoodModifiers(mood);
  const enhancedConfig: BackgroundConfig = {
    ...config,
    modifiers: [...(config.modifiers ?? []), ...moodModifiers],
  };

  return generateBackground(description, enhancedConfig);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build an enhanced prompt for background generation
 */
function buildBackgroundPrompt(description: string, modifiers: string[]): string {
  const modifierText = modifiers.join(', ');
  return `Background scene: ${description}. ${modifierText}`;
}

/**
 * Get mood-specific modifiers for prompt enhancement
 */
function getMoodModifiers(mood: string): string[] {
  const moodLower = mood.toLowerCase().trim();

  const moodMap: Record<string, string[]> = {
    dramatic: ['dramatic lighting with strong shadows', 'high contrast', 'cinematic atmosphere'],
    peaceful: ['soft natural lighting', 'calm atmosphere', 'serene environment'],
    cyberpunk: ['neon lighting', 'futuristic urban environment', 'tech aesthetic'],
    minimal: ['minimalist design', 'clean lines', 'subtle lighting'],
    luxury: ['premium materials', 'elegant lighting', 'high-end aesthetic'],
    nature: ['natural environment', 'organic elements', 'outdoor lighting'],
    studio: ['professional studio lighting', 'neutral backdrop', 'controlled environment'],
    vintage: ['warm tones', 'nostalgic atmosphere', 'retro aesthetic'],
    modern: ['contemporary design', 'sleek surfaces', 'modern architecture'],
    industrial: ['raw materials', 'exposed elements', 'urban industrial setting'],
  };

  return moodMap[moodLower] ?? [`${mood} atmosphere`, `${mood} mood lighting`];
}

/**
 * Validate a DALL-E size string
 */
export function isValidSize(size: string): size is DallESize {
  return ['1024x1024', '1792x1024', '1024x1792'].includes(size);
}

/**
 * Validate DALL-E quality option
 */
export function isValidQuality(quality: string): quality is DallEQuality {
  return ['standard', 'hd'].includes(quality);
}

/**
 * Validate DALL-E style option
 */
export function isValidStyle(style: string): style is DallEStyle {
  return ['vivid', 'natural'].includes(style);
}
