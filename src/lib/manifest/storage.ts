/**
 * Manifest Storage Operations
 *
 * Functions to save and load scene manifests from storage.
 */

import { getStorage } from '@/lib/storage';
import { generateManifestKey } from '@/lib/storage/utils';
import type { SceneManifest } from '@/types/manifest';

/**
 * Save a scene manifest to storage
 *
 * @param manifest - The manifest to save
 * @returns The public URL of the saved manifest
 */
export async function saveManifest(manifest: SceneManifest): Promise<string> {
  const storage = getStorage();
  const key = generateManifestKey(manifest.id);
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json',
  });
  const result = await storage.upload(blob, {
    key,
    contentType: 'application/json',
  });
  return result.url;
}

/**
 * Load a scene manifest from storage
 *
 * @param jobId - The job ID to load the manifest for
 * @returns The manifest if found, null otherwise
 */
export async function loadManifest(jobId: string): Promise<SceneManifest | null> {
  const storage = getStorage();
  const key = generateManifestKey(jobId);

  if (!(await storage.exists(key))) {
    return null;
  }

  const url = storage.getUrl(key);
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json() as Promise<SceneManifest>;
}

/**
 * Check if a manifest exists for a job
 *
 * @param jobId - The job ID to check
 * @returns True if the manifest exists
 */
export async function manifestExists(jobId: string): Promise<boolean> {
  const storage = getStorage();
  return storage.exists(generateManifestKey(jobId));
}
