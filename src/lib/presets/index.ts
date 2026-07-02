import type { ScenePreset, SceneConfig, SceneConfigOverrides } from '@/types';
import type { ScenePreset as PrismaScenePreset } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { DEFAULT_PRESETS, getDefaultPreset, mergePresetWithOverrides } from './defaults';

// Re-export the override type for convenience
export type { SceneConfigOverrides } from '@/types';

// Built-ins + pure helpers live in ./defaults (client-safe, no Prisma). This module adds the
// Postgres-backed custom-preset layer and is SERVER-ONLY — client code imports '@/lib/presets/defaults'.
export { DEFAULT_PRESETS, getDefaultPreset, getDefaultPresetById, mergePresetWithOverrides } from './defaults';

/** Map a Postgres row -> ScenePreset (Json columns cast to their typed shapes). */
function toScenePreset(row: PrismaScenePreset): ScenePreset {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    object: row.object as unknown as ScenePreset['object'],
    camera: row.camera as unknown as ScenePreset['camera'],
    lighting: row.lighting as unknown as ScenePreset['lighting'],
  };
}

// Custom presets persist in Postgres (ScenePreset table). The 5 DEFAULT_PRESETS stay code-level
// (defined in ./defaults, imported above).

/**
 * Get a preset by ID (checks custom presets in the DB first, then code defaults)
 */
export async function getPreset(id: string): Promise<ScenePreset | undefined> {
  const custom = await prisma.scenePreset.findUnique({ where: { id } });
  if (custom) return toScenePreset(custom);
  return DEFAULT_PRESETS.find((p) => p.id === id);
}

/**
 * List all available presets (custom, newest first + defaults)
 */
export async function listPresets(): Promise<ScenePreset[]> {
  const custom = await prisma.scenePreset.findMany({ orderBy: { createdAt: 'desc' } });
  return [...custom.map(toScenePreset), ...DEFAULT_PRESETS];
}

/**
 * Save a custom preset (upsert by id)
 * @returns The saved preset with generated ID if not provided
 */
export async function savePreset(
  preset: Omit<ScenePreset, 'id'> & { id?: string }
): Promise<ScenePreset> {
  const id = preset.id ?? generatePresetId();
  const data = {
    name: preset.name,
    description: preset.description,
    object: preset.object as unknown as Prisma.InputJsonValue,
    camera: preset.camera as unknown as Prisma.InputJsonValue,
    lighting: preset.lighting as unknown as Prisma.InputJsonValue,
  };
  const row = await prisma.scenePreset.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
  return toScenePreset(row);
}

/**
 * Delete a custom preset
 * @returns true if deleted, false if not found or is a default preset
 */
export async function deletePreset(id: string): Promise<boolean> {
  // Don't allow deleting default presets
  if (DEFAULT_PRESETS.some((p) => p.id === id)) {
    return false;
  }
  const { count } = await prisma.scenePreset.deleteMany({ where: { id } });
  return count > 0;
}

/**
 * Check if a preset exists (default or custom)
 */
export async function presetExists(id: string): Promise<boolean> {
  if (DEFAULT_PRESETS.some((p) => p.id === id)) return true;
  const count = await prisma.scenePreset.count({ where: { id } });
  return count > 0;
}

/**
 * Build a SceneConfig from preset ID, asset URLs, and optional overrides
 */
export async function buildSceneConfig(
  presetId: string | undefined,
  backgroundUrl: string,
  meshUrl: string,
  overrides?: SceneConfigOverrides
): Promise<SceneConfig> {
  const preset = presetId ? await getPreset(presetId) : getDefaultPreset();
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
export async function clearCustomPresets(): Promise<void> {
  await prisma.scenePreset.deleteMany({});
}
