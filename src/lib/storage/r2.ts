/**
 * Cloudflare R2 Storage Provider
 *
 * Stores assets in a Cloudflare R2 bucket via the S3-compatible API.
 * Used for production deployments where assets must be served from a
 * durable, publicly-accessible object store rather than the local disk.
 *
 * R2 is S3-compatible, so this uses the AWS SDK v3 (@aws-sdk/client-s3)
 * pointed at the R2 endpoint. In development, use FilesystemStorageProvider.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import type { StorageProvider, UploadOptions, UploadResult, StorageConfig } from './types';

/**
 * Resolved R2 connection settings, read from the environment.
 */
interface R2Settings {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

/**
 * Cloudflare R2 storage provider implementation
 *
 * Saves assets to an R2 bucket over the S3-compatible API and serves them
 * via the bucket's public URL (STORAGE_PUBLIC_URL).
 */
export class R2StorageProvider implements StorageProvider {
  readonly name = 'r2';

  /** Public URL prefix for served assets (no trailing slash). */
  private readonly publicUrl: string | undefined;

  /** Lazily-created S3 client (built on first use). */
  private client: S3Client | null = null;

  /** Cached R2 settings, resolved alongside the client. */
  private settings: R2Settings | null = null;

  constructor(config?: StorageConfig) {
    // Public URL is used synchronously by getUrl(), so resolve it eagerly.
    // Env is the source of truth; config may override.
    const publicUrl = config?.publicUrl ?? process.env.STORAGE_PUBLIC_URL;
    this.publicUrl = publicUrl ? publicUrl.replace(/\/+$/, '') : undefined;
  }

  /**
   * Upload a blob to R2
   */
  async upload(blob: Blob, options: UploadOptions): Promise<UploadResult> {
    const { key, contentType, metadata } = options;
    const { client, settings } = this.getClient();

    // Convert blob to a Buffer for the S3 PutObject body.
    const buffer = Buffer.from(await blob.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: settings.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Metadata: metadata,
      })
    );

    return {
      key,
      url: this.getUrl(key),
      size: buffer.length,
    };
  }

  /**
   * Download content from a URL
   *
   * Fetches over HTTP, which handles both external CDN URLs (DALL·E, Meshy)
   * and our own public R2 URLs.
   */
  async download(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download from ${url}: ${response.status} ${response.statusText}`);
    }
    return response.blob();
  }

  /**
   * Delete an asset from R2
   *
   * R2 has no directories, so there is no empty-directory cleanup to do.
   * Returns false if the object does not exist rather than throwing.
   */
  async delete(key: string): Promise<boolean> {
    const { client, settings } = this.getClient();

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: settings.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      if (this.isNotFound(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Check if an asset exists
   */
  async exists(key: string): Promise<boolean> {
    const { client, settings } = this.getClient();

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: settings.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error) {
      if (this.isNotFound(error)) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get the public URL for a storage key
   *
   * This is the public R2 URL that apps and browsers use to fetch the asset.
   */
  getUrl(key: string): string {
    if (!this.publicUrl) {
      throw new Error(
        'R2 public URL is not configured. Set STORAGE_PUBLIC_URL or pass config.publicUrl.'
      );
    }
    // Normalize separators and strip a leading slash to avoid "//" in the URL.
    const normalizedKey = key.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${this.publicUrl}/${normalizedKey}`;
  }

  /**
   * Lazily build and cache the S3 client for R2.
   *
   * Deferring creation to first use keeps module import side-effect free, so
   * importing this file during `next build` does not throw when env is absent.
   */
  private getClient(): { client: S3Client; settings: R2Settings } {
    if (this.client && this.settings) {
      return { client: this.client, settings: this.settings };
    }

    const settings = this.resolveSettings();
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${settings.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey,
      },
    });

    this.settings = settings;
    this.client = client;
    return { client, settings };
  }

  /**
   * Read and validate the required R2 environment variables.
   *
   * @throws If any required variable is missing.
   */
  private resolveSettings(): R2Settings {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;

    const missing: string[] = [];
    if (!accountId) missing.push('R2_ACCOUNT_ID');
    if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
    if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
    if (!bucket) missing.push('R2_BUCKET_NAME');

    if (missing.length > 0) {
      throw new Error(`Missing required R2 environment variable(s): ${missing.join(', ')}`);
    }

    // Non-null assertions are safe: the missing[] check above guarantees these.
    return {
      accountId: accountId!,
      accessKeyId: accessKeyId!,
      secretAccessKey: secretAccessKey!,
      bucket: bucket!,
    };
  }

  /**
   * Determine whether an S3 error represents a missing object (404 / NoSuchKey).
   */
  private isNotFound(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }
    const err = error as {
      name?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };
    return (
      err.name === 'NoSuchKey' ||
      err.name === 'NotFound' ||
      err.Code === 'NoSuchKey' ||
      err.$metadata?.httpStatusCode === 404
    );
  }
}

/**
 * Create an R2 storage provider with default configuration
 */
export function createR2Storage(config?: StorageConfig): R2StorageProvider {
  return new R2StorageProvider(config);
}
