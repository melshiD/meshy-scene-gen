import type { ScenePreset, SceneConfig, SceneConfigOverrides } from '@/types';

/**
 * Client-safe preset module — the built-in presets + pure helpers, with NO database import.
 *
 * '@/lib/presets' (index.ts) touches Prisma for custom presets and must stay server-only.
 * Client components / stores import from HERE. In the browser, custom presets are fetched via
 * GET /api/presets, never resolved from this module.
 */

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

/**
 * Get the default preset (product)
 */
export function getDefaultPreset(): ScenePreset {
  return DEFAULT_PRESETS[0];
}

/**
 * Find a built-in preset by ID (defaults only — custom presets live server-side)
 */
export function getDefaultPresetById(id: string): ScenePreset | undefined {
  return DEFAULT_PRESETS.find((p) => p.id === id);
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
