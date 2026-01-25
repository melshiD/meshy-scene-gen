/**
 * Prompt Parser - Decompose user prompts into structured scene components
 *
 * Uses OpenAI GPT to intelligently parse natural language prompts
 * into object, background, mood, and camera descriptions.
 */

import OpenAI from 'openai';
import type { DecomposedPrompt } from '@/types';

// ============================================================================
// Configuration
// ============================================================================

const SYSTEM_PROMPT = `You are a prompt decomposer for a 3D scene generator. Given a user's scene description, extract four components:

1. **object**: The main 3D object/subject to generate (for text-to-3D). Keep it simple and focused on one item.
2. **background**: A description for an AI background image (DALL-E). Should complement the object without including the object itself.
3. **mood**: The overall mood/atmosphere (e.g., "dramatic", "peaceful", "cyberpunk", "minimal").
4. **camera**: Suggested camera angle/framing (e.g., "eye level", "low angle hero shot", "top-down", "three-quarter view").

Respond ONLY with valid JSON matching this exact structure:
{
  "object": "...",
  "background": "...",
  "mood": "...",
  "camera": "..."
}

Guidelines:
- object: Focus on the physical item only, no environment. Good for 3D modeling.
- background: Describe environment WITHOUT the main object. Include lighting, colors, surfaces.
- mood: 1-3 words capturing the feeling.
- camera: Brief camera positioning description.`;

// ============================================================================
// Types
// ============================================================================

interface PromptParserConfig {
  apiKey?: string;
  model?: string;
}

interface ParseResult {
  success: true;
  data: DecomposedPrompt;
}

interface ParseError {
  success: false;
  error: string;
}

type ParseResponse = ParseResult | ParseError;

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
// Default Values
// ============================================================================

const DEFAULT_DECOMPOSED: DecomposedPrompt = {
  object: 'simple 3D object',
  background: 'minimal studio background with soft gradient lighting',
  mood: 'neutral',
  camera: 'three-quarter view',
};

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Decompose a natural language prompt into structured scene components
 *
 * @param prompt - User's scene description in natural language
 * @param config - Optional configuration (API key, model)
 * @returns ParseResponse with decomposed prompt or error
 *
 * @example
 * ```typescript
 * const result = await decomposePrompt("A golden trophy on a marble pedestal, dramatic lighting");
 * if (result.success) {
 *   console.log(result.data.object); // "golden trophy"
 *   console.log(result.data.background); // "marble pedestal with dramatic lighting..."
 * }
 * ```
 */
export async function decomposePrompt(
  prompt: string,
  config: PromptParserConfig = {}
): Promise<ParseResponse> {
  console.log(`[DECOMPOSE] Input: "${prompt}"`);

  // Validate input
  if (!prompt || typeof prompt !== 'string') {
    console.log('[DECOMPOSE] Error: Prompt must be a non-empty string');
    return {
      success: false,
      error: 'Prompt must be a non-empty string',
    };
  }

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    console.log('[DECOMPOSE] Error: Prompt cannot be empty');
    return {
      success: false,
      error: 'Prompt cannot be empty',
    };
  }

  if (trimmedPrompt.length > 2000) {
    console.log('[DECOMPOSE] Error: Prompt exceeds maximum length of 2000 characters');
    return {
      success: false,
      error: 'Prompt exceeds maximum length of 2000 characters',
    };
  }

  try {
    const client = getClient(config.apiKey);
    const model = config.model ?? 'gpt-4o-mini';

    console.log(`[DECOMPOSE] Calling OpenAI (model: ${model})`);
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: trimmedPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.log('[DECOMPOSE] Error: No response from OpenAI');
      return {
        success: false,
        error: 'No response from OpenAI',
      };
    }

    const parsed = JSON.parse(content) as Record<string, unknown>;

    // Validate required fields
    const decomposed: DecomposedPrompt = {
      object: typeof parsed.object === 'string' ? parsed.object : DEFAULT_DECOMPOSED.object,
      background:
        typeof parsed.background === 'string' ? parsed.background : DEFAULT_DECOMPOSED.background,
      mood: typeof parsed.mood === 'string' ? parsed.mood : DEFAULT_DECOMPOSED.mood,
      camera: typeof parsed.camera === 'string' ? parsed.camera : DEFAULT_DECOMPOSED.camera,
    };

    console.log(`[DECOMPOSE] Result: ${JSON.stringify(decomposed)}`);

    return {
      success: true,
      data: decomposed,
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof SyntaxError) {
      console.log('[DECOMPOSE] Error: Failed to parse AI response as JSON');
      return {
        success: false,
        error: 'Failed to parse AI response as JSON',
      };
    }

    if (error instanceof OpenAI.APIError) {
      console.log(`[DECOMPOSE] Error: OpenAI API error: ${error.message}`);
      return {
        success: false,
        error: `OpenAI API error: ${error.message}`,
      };
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.log(`[DECOMPOSE] Error: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Create a manual decomposed prompt without AI
 *
 * Useful for direct control or when AI parsing is not needed.
 *
 * @param parts - Partial prompt components to merge with defaults
 * @returns Complete DecomposedPrompt
 */
export function createManualPrompt(parts: Partial<DecomposedPrompt>): DecomposedPrompt {
  return {
    object: parts.object ?? DEFAULT_DECOMPOSED.object,
    background: parts.background ?? DEFAULT_DECOMPOSED.background,
    mood: parts.mood ?? DEFAULT_DECOMPOSED.mood,
    camera: parts.camera ?? DEFAULT_DECOMPOSED.camera,
  };
}

/**
 * Validate a decomposed prompt structure
 */
export function isValidDecomposedPrompt(value: unknown): value is DecomposedPrompt {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.object === 'string' &&
    typeof obj.background === 'string' &&
    typeof obj.mood === 'string' &&
    typeof obj.camera === 'string'
  );
}
