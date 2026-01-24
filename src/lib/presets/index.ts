import type { ScenePreset, SceneConfig, SceneConfigOverrides } from '@/types';

// Re-export the override type for convenience
export type { SceneConfigOverrides } from '@/types';

/**
 * Default scene presets for common use cases
 */
export const DEFAULT_PRESETS: ScenePreset[] = [
  {
    id: 'product',
    name: 'Product Shot',
    description: 'Clean, centered, studio lighting - ideal for product displays',
    object: {
      position: { x: 0, y: 0, z: 0 },
      scale: 1,
      rotation: { x: 0, y: 0.3, z: 0 },
    },
    camera: {
      position: { x: 0, y: 1, z: 4 },
      fov: 45,
      lookAt: { x: 0, y: 0, z: 0 },
    },
    lighting: {
      preset: 'studio',
      intensity: 1,
    },
  },
  {
    id: 'hero',
    name: 'Hero Image',
    description: 'Dramatic angle, low and looking up - great for impact',
    object: {
      position: { x: 0, y: 0, z: 0 },
      scale: 1.2,
      rotation: { x: 0, y: -0.2, z: 0 },
    },
    camera: {
      position: { x: -2, y: -0.5, z: 3 },
      fov: 50,
      lookAt: { x: 0, y: 0.5, z: 0 },
    },
    lighting: {
      preset: 'dramatic',
      intensity: 1.2,
    },
  },
  {
    id: 'icon',
    name: 'Icon/Logo',
    description: 'Top-down angle, flat lighting - perfect for icons',
    object: {
      position: { x: 0, y: 0, z: 0 },
      scale: 0.8,
      rotation: { x: 0.5, y: 0, z: 0 },
    },
    camera: {
      position: { x: 0, y: 3, z: 0.5 },
      fov: 35,
      lookAt: { x: 0, y: 0, z: 0 },
    },
    lighting: {
      preset: 'soft',
      intensity: 0.9,
    },
  },
  {
    id: 'portrait',
    name: 'Portrait',
    description: 'Face-on view with soft lighting - ideal for characters',
    object: {
      position: { x: 0, y: -0.5, z: 0 },
      scale: 1,
      rotation: { x: 0, y: 0, z: 0 },
    },
    camera: {
      position: { x: 0, y: 0.5, z: 3 },
      fov: 40,
      lookAt: { x: 0, y: 0, z: 0 },
    },
    lighting: {
      preset: 'soft',
      intensity: 1,
    },
  },
  {
    id: 'dramatic',
    name: 'Dramatic Scene',
    description: 'Cinematic angle with strong rim lighting',
    object: {
      position: { x: 0, y: 0, z: 0 },
      scale: 1.1,
      rotation: { x: 0.1, y: -0.4, z: 0 },
    },
    camera: {
      position: { x: 2.5, y: 1.5, z: 3 },
      fov: 55,
      lookAt: { x: 0, y: 0, z: 0 },
    },
    lighting: {
      preset: 'dramatic',
      intensity: 1.5,
    },
  },
];

// In-memory store for custom presets (would be replaced with DB in production)
const customPresets: Map<string, ScenePreset> = new Map();

/**
 * Get a preset by ID (checks custom presets first, then defaults)
 */
export function getPreset(id: string): ScenePreset | undefined {
  return customPresets.get(id) ?? DEFAULT_PRESETS.find((p) => p.id === id);
}

/**
 * Get the default preset (product)
 */
export function getDefaultPreset(): ScenePreset {
  return DEFAULT_PRESETS[0];
}

/**
 * List all available presets (custom + default)
 */
export function listPresets(): ScenePreset[] {
  return [...Array.from(customPresets.values()), ...DEFAULT_PRESETS];
}

/**
 * Save a custom preset
 * @returns The saved preset with generated ID if not provided
 */
export function savePreset(preset: Omit<ScenePreset, 'id'> & { id?: string }): ScenePreset {
  const id = preset.id ?? generatePresetId();
  const fullPreset: ScenePreset = { ...preset, id };
  customPresets.set(id, fullPreset);
  return fullPreset;
}

/**
 * Delete a custom preset
 * @returns true if deleted, false if not found or is a default preset
 */
export function deletePreset(id: string): boolean {
  // Don't allow deleting default presets
  if (DEFAULT_PRESETS.some((p) => p.id === id)) {
    return false;
  }
  return customPresets.delete(id);
}

/**
 * Check if a preset exists
 */
export function presetExists(id: string): boolean {
  return customPresets.has(id) || DEFAULT_PRESETS.some((p) => p.id === id);
}

/**
 * Merge a preset with overrides to create a SceneConfig
 */
export function mergePresetWithOverrides(
  preset: ScenePreset,
  backgroundUrl: string,
  meshUrl: string,
  overrides?: SceneConfigOverrides
): SceneConfig {
  return {
    backgroundUrl,
    meshUrl,
    object: overrides?.object
      ? { ...preset.object, ...overrides.object }
      : preset.object,
    camera: overrides?.camera
      ? { ...preset.camera, ...overrides.camera }
      : preset.camera,
    lighting: overrides?.lighting
      ? { ...preset.lighting, ...overrides.lighting }
      : preset.lighting,
  };
}

/**
 * Build a SceneConfig from preset ID, asset URLs, and optional overrides
 */
export function buildSceneConfig(
  presetId: string | undefined,
  backgroundUrl: string,
  meshUrl: string,
  overrides?: SceneConfigOverrides
): SceneConfig {
  const preset = presetId ? getPreset(presetId) : getDefaultPreset();
  if (!preset) {
    throw new Error(`Preset not found: ${presetId}`);
  }
  return mergePresetWithOverrides(preset, backgroundUrl, meshUrl, overrides);
}

/**
 * Generate a unique preset ID
 */
function generatePresetId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Clear all custom presets (for testing)
 */
export function clearCustomPresets(): void {
  customPresets.clear();
}
