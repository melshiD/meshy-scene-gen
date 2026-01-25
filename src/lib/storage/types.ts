/**
 * Storage Module Types
 *
 * Defines interfaces for the storage provider abstraction.
 * Supports filesystem storage (dev) and cloud storage (production).
 */

/** Asset type categories */
export type AssetType = 'capture' | 'background' | 'mesh';

/** Upload options for storage providers */
export interface UploadOptions {
  /** The key/path for the asset (e.g., "capture/job-123/full-2048x2048.png") */
  key: string;
  /** MIME type of the content */
  contentType: string;
  /** Optional metadata to store with the asset */
  metadata?: Record<string, string>;
}

/** Result of an upload operation */
export interface UploadResult {
  /** The key/path where the asset was stored */
  key: string;
  /** Public URL to access the asset */
  url: string;
  /** Size of the uploaded content in bytes */
  size: number;
}

/** Result of uploaded capture images */
export interface CaptureUploadResult {
  full: string;
  web: string;
  thumb: string;
}

/**
 * Storage provider interface
 *
 * Implementations must handle:
 * - Uploading blobs to storage
 * - Downloading content from URLs
 * - Deleting stored assets
 */
export interface StorageProvider {
  /** Provider name for logging/debugging */
  readonly name: string;

  /**
   * Upload a blob to storage
   * @param blob - The content to upload
   * @param options - Upload options including key and content type
   * @returns Promise resolving to upload result with URL
   */
  upload(blob: Blob, options: UploadOptions): Promise<UploadResult>;

  /**
   * Download content from a URL
   * @param url - The URL to download from
   * @returns Promise resolving to the downloaded blob
   */
  download(url: string): Promise<Blob>;

  /**
   * Delete an asset from storage
   * @param key - The storage key to delete
   * @returns Promise resolving to true if deleted, false if not found
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if an asset exists
   * @param key - The storage key to check
   * @returns Promise resolving to true if exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get the public URL for a storage key
   * @param key - The storage key
   * @returns The public URL for the asset
   */
  getUrl(key: string): string;
}

/** Storage configuration options */
export interface StorageConfig {
  /** Base URL for public asset access */
  publicUrl?: string;
  /** Base path for filesystem storage */
  basePath?: string;
}
