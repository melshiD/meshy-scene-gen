/**
 * Storage Client
 *
 * High-level API for uploading and persisting assets.
 * Abstracts the storage provider and provides convenience functions.
 */

import type { MultiCaptureResult } from '@/lib/scene';
import { proxiedFetch } from '@/lib/net/egress';
import type { StorageProvider, CaptureUploadResult, StorageConfig } from './types';
import { FilesystemStorageProvider } from './filesystem';
import { R2StorageProvider } from './r2';
import { PostgresStorageProvider } from './postgres';
import {
  generateCaptureKey,
  generateBackgroundKey,
  generateMeshKey,
  getImageMimeType,
  getMimeType,
  detectImageFormat,
} from './utils';

/** Singleton storage provider instance */
let storageProvider: StorageProvider | null = null;

/**
 * Get the configured storage provider
 *
 * Returns filesystem provider by default.
 * In production with R2 env vars, would return R2 provider.
 */
export function getStorage(): StorageProvider {
  if (!storageProvider) {
    // Check for R2 configuration (future implementation)
    const hasR2Config =
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME;

    if (hasR2Config) {
      // Object storage, only if explicitly configured (all four R2 vars). Not the Lodestar default.
      storageProvider = new R2StorageProvider({
        publicUrl: process.env.STORAGE_PUBLIC_URL,
      });
      return storageProvider;
    }

    if (process.env.DATABASE_URL) {
      // Production on lodestar-core-1: assets live in the core-Postgres tenant db (Asset table),
      // served via /api/assets/[...key]. One state store; container stays stateless.
      storageProvider = new PostgresStorageProvider();
      return storageProvider;
    }

    // Default (local dev, no DB): filesystem storage under public/generated.
    const config: StorageConfig = {
      publicUrl: process.env.STORAGE_PUBLIC_URL ?? '/generated',
      basePath: 'public/generated',
    };
    storageProvider = new FilesystemStorageProvider(config);
  }

  return storageProvider;
}

/**
 * Set a custom storage provider (for testing or custom implementations)
 */
export function setStorage(provider: StorageProvider): void {
  storageProvider = provider;
}

/**
 * Reset storage provider to default (mainly for testing)
 */
export function resetStorage(): void {
  storageProvider = null;
}

/**
 * Upload captured scene images to storage
 *
 * Takes the multi-resolution captures and uploads all three sizes.
 *
 * @param captures - The capture results from captureMultiResolution()
 * @param jobId - The job identifier for organizing storage
 * @returns URLs for full, web, and thumb images
 */
export async function uploadCaptures(
  captures: MultiCaptureResult,
  jobId: string
): Promise<CaptureUploadResult> {
  const storage = getStorage();

  // Upload all three sizes in parallel
  const [fullResult, webResult, thumbResult] = await Promise.all([
    storage.upload(captures.full.blob, {
      key: generateCaptureKey(jobId, 'full', captures.full.width, captures.full.height, captures.full.format),
      contentType: getImageMimeType(captures.full.format),
      metadata: {
        width: String(captures.full.width),
        height: String(captures.full.height),
        format: captures.full.format,
      },
    }),
    storage.upload(captures.web.blob, {
      key: generateCaptureKey(jobId, 'web', captures.web.width, captures.web.height, captures.web.format),
      contentType: getImageMimeType(captures.web.format),
      metadata: {
        width: String(captures.web.width),
        height: String(captures.web.height),
        format: captures.web.format,
      },
    }),
    storage.upload(captures.thumb.blob, {
      key: generateCaptureKey(jobId, 'thumb', captures.thumb.width, captures.thumb.height, captures.thumb.format),
      contentType: getImageMimeType(captures.thumb.format),
      metadata: {
        width: String(captures.thumb.width),
        height: String(captures.thumb.height),
        format: captures.thumb.format,
      },
    }),
  ]);

  return {
    full: fullResult.url,
    web: webResult.url,
    thumb: thumbResult.url,
  };
}

/**
 * Persist a background image from a temporary URL
 *
 * Downloads the image from the temporary URL (e.g., DALL-E CDN)
 * and uploads it to persistent storage.
 *
 * @param temporaryUrl - The temporary URL to download from
 * @param jobId - The job identifier for organizing storage
 * @returns Persistent URL for the background image
 */
export async function persistBackground(temporaryUrl: string, jobId: string): Promise<string> {
  const storage = getStorage();

  // Download from temporary URL
  const blob = await downloadWithRetry(temporaryUrl, 3);

  // Detect format from URL or content type
  const format = detectImageFormat(temporaryUrl);

  // Upload to persistent storage. GPT-image results arrive as multi-MB data: URLs — record a
  // marker instead of the payload so metadata (and anything that embeds it) stays small.
  const result = await storage.upload(blob, {
    key: generateBackgroundKey(jobId, format),
    contentType: getImageMimeType(format),
    metadata: {
      originalUrl: temporaryUrl.startsWith('data:') ? 'inline:b64_json' : temporaryUrl,
      persistedAt: new Date().toISOString(),
    },
  });

  return result.url;
}

export interface PersistMeshOptions {
  format?: 'glb' | 'fbx' | 'usdz' | 'obj';
  /** The prompt used to generate this mesh (for display/search) */
  prompt?: string;
}

/**
 * Persist a 3D mesh from the Meshy CDN
 *
 * Downloads the mesh file and uploads it to persistent storage.
 * This ensures the mesh remains available even if Meshy CDN expires.
 *
 * @param meshyUrl - The Meshy CDN URL for the mesh
 * @param jobId - The job identifier for organizing storage
 * @param options - Optional format and prompt for metadata
 * @returns Persistent URL for the mesh file
 */
export async function persistMesh(
  meshyUrl: string,
  jobId: string,
  options?: PersistMeshOptions | 'glb' | 'fbx' | 'usdz' | 'obj'
): Promise<string> {
  const storage = getStorage();

  // Handle both old signature (format string) and new signature (options object)
  const opts: PersistMeshOptions = typeof options === 'string'
    ? { format: options }
    : options ?? {};
  const { format = 'glb', prompt } = opts;

  // Download from Meshy CDN
  const blob = await downloadWithRetry(meshyUrl, 3);

  // Upload to persistent storage
  const result = await storage.upload(blob, {
    key: generateMeshKey(jobId, format),
    contentType: getMimeType(format),
    metadata: {
      originalUrl: meshyUrl,
      persistedAt: new Date().toISOString(),
      format,
      ...(prompt && { prompt }),
    },
  });

  return result.url;
}

/**
 * Delete all assets for a job
 *
 * Removes captures, background, and mesh files for the given job.
 *
 * @param jobId - The job identifier
 * @returns Object with counts of deleted files per category
 */
export async function deleteJobAssets(jobId: string): Promise<{
  captures: number;
  backgrounds: number;
  meshes: number;
}> {
  const storage = getStorage();

  const captureKeys = ['full', 'web', 'thumb'].map((size) =>
    generateCaptureKey(
      jobId,
      size as 'full' | 'web' | 'thumb',
      size === 'full' ? 2048 : size === 'web' ? 800 : 400,
      size === 'full' ? 2048 : size === 'web' ? 800 : 400,
      size === 'full' ? 'png' : 'webp'
    )
  );

  const backgroundKey = generateBackgroundKey(jobId);
  const meshKey = generateMeshKey(jobId);

  const results = await Promise.all([
    ...captureKeys.map((key) => storage.delete(key)),
    storage.delete(backgroundKey),
    storage.delete(meshKey),
  ]);

  const capturesDeleted = results.slice(0, 3).filter(Boolean).length;
  const backgroundDeleted = results[3] ? 1 : 0;
  const meshDeleted = results[4] ? 1 : 0;

  return {
    captures: capturesDeleted,
    backgrounds: backgroundDeleted,
    meshes: meshDeleted,
  };
}

/**
 * Download from URL with retry logic
 */
async function downloadWithRetry(url: string, maxRetries: number): Promise<Blob> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // External downloads (assets.meshy.ai mesh CDN) route through the Squid egress
      // proxy in prod; inline `data:` payloads (persisted backgrounds) stay direct —
      // they never touch the network, so they must NOT go through the proxy.
      const isExternal = url.startsWith('http://') || url.startsWith('https://');
      const response = isExternal ? await proxiedFetch(url) : await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed to download after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Check if storage is using cloud provider
 */
export function isCloudStorage(): boolean {
  const storage = getStorage();
  return storage.name !== 'filesystem';
}

/**
 * Get storage provider name for debugging
 */
export function getStorageProviderName(): string {
  return getStorage().name;
}
