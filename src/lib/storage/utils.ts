/**
 * Storage Utility Functions
 *
 * Helpers for filename generation, MIME type detection, etc.
 */

import type { ImageFormat } from '@/types';
import type { AssetType } from './types';

/** Extension to MIME type mapping */
const EXTENSION_MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  glb: 'model/gltf-binary',
  fbx: 'application/octet-stream',
  gltf: 'model/gltf+json',
  usdz: 'model/vnd.usdz+zip',
  obj: 'text/plain',
};

/** MIME type to extension mapping */
const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'model/gltf-binary': 'glb',
  'model/gltf+json': 'gltf',
  'application/octet-stream': 'bin',
};

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  const ext = extension.toLowerCase().replace(/^\./, '');
  return EXTENSION_MIME_MAP[ext] ?? 'application/octet-stream';
}

/**
 * Get file extension from MIME type
 */
export function getExtension(mimeType: string): string {
  return MIME_EXTENSION_MAP[mimeType] ?? 'bin';
}

/**
 * Get MIME type for image format
 */
export function getImageMimeType(format: ImageFormat): string {
  const mimeTypes: Record<ImageFormat, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return mimeTypes[format];
}

/**
 * Generate a storage key for captured images
 *
 * @param jobId - The job identifier
 * @param size - Size variant (full, web, thumb)
 * @param width - Image width
 * @param height - Image height
 * @param format - Image format
 * @returns Storage key like "capture/abc123/full-2048x2048.png"
 */
export function generateCaptureKey(
  jobId: string,
  size: 'full' | 'web' | 'thumb',
  width: number,
  height: number,
  format: ImageFormat
): string {
  const extension = format === 'jpeg' ? 'jpg' : format;
  return `capture/${jobId}/${size}-${width}x${height}.${extension}`;
}

/**
 * Generate a storage key for background images
 *
 * @param jobId - The job identifier
 * @param format - Image format (defaults to png)
 * @returns Storage key like "background/abc123/background.png"
 */
export function generateBackgroundKey(jobId: string, format: ImageFormat = 'png'): string {
  const extension = format === 'jpeg' ? 'jpg' : format;
  return `background/${jobId}/background.${extension}`;
}

/**
 * Generate a storage key for 3D mesh files
 *
 * @param jobId - The job identifier
 * @param meshFormat - Mesh format (glb, fbx, etc.)
 * @returns Storage key like "mesh/abc123/model.glb"
 */
export function generateMeshKey(jobId: string, meshFormat: string = 'glb'): string {
  return `mesh/${jobId}/model.${meshFormat}`;
}

/**
 * Generate a unique filename with timestamp
 *
 * @param prefix - Filename prefix
 * @param extension - File extension
 * @returns Unique filename like "prefix-1706123456789.ext"
 */
export function generateUniqueFilename(prefix: string, extension: string): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Parse a storage key into its components
 *
 * @param key - Storage key like "capture/abc123/full-2048x2048.png"
 * @returns Parsed components or null if invalid
 */
export function parseStorageKey(key: string): {
  assetType: AssetType;
  jobId: string;
  filename: string;
} | null {
  const parts = key.split('/');
  if (parts.length !== 3) return null;

  const [assetType, jobId, filename] = parts;

  if (!['capture', 'background', 'mesh'].includes(assetType)) {
    return null;
  }

  return {
    assetType: assetType as AssetType,
    jobId,
    filename,
  };
}

/**
 * Sanitize a string for use in filenames
 * Removes or replaces characters that are invalid in file paths
 */
export function sanitizeFilename(input: string): string {
  return input
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 100);
}

/**
 * Detect image format from content type or URL
 */
export function detectImageFormat(contentTypeOrUrl: string): ImageFormat {
  const lower = contentTypeOrUrl.toLowerCase();

  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  if (lower.includes('jpg') || lower.includes('jpeg')) return 'jpeg';

  // Default to PNG
  return 'png';
}
