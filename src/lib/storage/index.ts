/**
 * Storage Module
 *
 * Provides persistent storage for generated assets:
 * - Captured scene images (full, web, thumb)
 * - Background images (persisted from DALL-E)
 * - 3D meshes (persisted from Meshy CDN)
 *
 * @example
 * ```typescript
 * import { uploadCaptures, persistBackground, persistMesh } from '@/lib/storage';
 *
 * // Upload captured images
 * const urls = await uploadCaptures(captures, jobId);
 *
 * // Persist background before DALL-E URL expires
 * const bgUrl = await persistBackground(dalleUrl, jobId);
 *
 * // Persist mesh from Meshy CDN
 * const meshUrl = await persistMesh(meshyUrl, jobId, 'glb');
 * ```
 */

// Client API
export {
  getStorage,
  setStorage,
  resetStorage,
  uploadCaptures,
  persistBackground,
  persistMesh,
  deleteJobAssets,
  isCloudStorage,
  getStorageProviderName,
} from './client';

// Providers
export { FilesystemStorageProvider, createFilesystemStorage } from './filesystem';

// Types
export type {
  AssetType,
  UploadOptions,
  UploadResult,
  CaptureUploadResult,
  StorageProvider,
  StorageConfig,
} from './types';

// Utilities
export {
  getMimeType,
  getExtension,
  getImageMimeType,
  generateCaptureKey,
  generateBackgroundKey,
  generateMeshKey,
  generateManifestKey,
  generateUniqueFilename,
  parseStorageKey,
  sanitizeFilename,
  detectImageFormat,
} from './utils';
