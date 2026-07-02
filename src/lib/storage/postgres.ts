/**
 * Postgres Storage Provider
 *
 * Stores binary assets (meshes, images, manifests) as BYTEA rows in the core-Postgres tenant db
 * (Asset table) and serves them through GET /api/assets/[...key]. Chosen over object storage
 * (2026-07-01): one state store, one backup story, stateless container — and the StorageProvider
 * interface keeps an object-storage swap possible later.
 */

import { prisma } from '@/lib/db';
import type { StorageProvider, UploadOptions, UploadResult, StorageConfig } from './types';

/** URL prefix under which stored assets are served (relative — same-origin app route). */
const DEFAULT_PUBLIC_PREFIX = '/api/assets';

/**
 * Storage provider backed by the app's Postgres database
 */
export class PostgresStorageProvider implements StorageProvider {
  readonly name = 'postgres';
  private publicPrefix: string;

  constructor(config?: StorageConfig) {
    this.publicPrefix = (config?.publicUrl ?? DEFAULT_PUBLIC_PREFIX).replace(/\/+$/, '');
  }

  /**
   * Upload a blob as an Asset row (upsert — re-persisting a key overwrites it)
   */
  async upload(blob: Blob, options: UploadOptions): Promise<UploadResult> {
    const data = Buffer.from(await blob.arrayBuffer());
    const record = {
      contentType: options.contentType,
      data,
      size: data.length,
      metadata: options.metadata ?? undefined,
    };
    await prisma.asset.upsert({
      where: { key: options.key },
      create: { key: options.key, ...record },
      update: record,
    });

    console.log(`[STORAGE:PG] Uploaded ${options.key} (${data.length} bytes)`);
    return {
      key: options.key,
      url: this.getUrl(options.key),
      size: data.length,
    };
  }

  /**
   * Download content from a URL.
   *
   * Our own asset URLs are RELATIVE (/api/assets/...) — a server-side fetch of a relative URL has
   * no base and would throw, so those read straight from the database. External URLs
   * (DALL·E / Meshy CDN) fetch over HTTP as usual.
   */
  async download(url: string): Promise<Blob> {
    if (url.startsWith(`${this.publicPrefix}/`)) {
      const key = url.slice(this.publicPrefix.length + 1);
      const asset = await prisma.asset.findUnique({ where: { key } });
      if (!asset) {
        throw new Error(`Asset not found in database: ${key}`);
      }
      return new Blob([new Uint8Array(asset.data)], { type: asset.contentType });
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: HTTP ${response.status} ${response.statusText}`);
    }
    return response.blob();
  }

  /**
   * Delete an asset row
   * @returns true if deleted, false if not found
   */
  async delete(key: string): Promise<boolean> {
    const { count } = await prisma.asset.deleteMany({ where: { key } });
    if (count > 0) console.log(`[STORAGE:PG] Deleted ${key}`);
    return count > 0;
  }

  /**
   * Check if an asset exists
   */
  async exists(key: string): Promise<boolean> {
    const count = await prisma.asset.count({ where: { key } });
    return count > 0;
  }

  /**
   * Get the public URL for a storage key (relative app route — no host config needed)
   */
  getUrl(key: string): string {
    return `${this.publicPrefix}/${key.replace(/^\/+/, '')}`;
  }
}

/**
 * Create a Postgres storage provider
 */
export function createPostgresStorage(config?: StorageConfig): PostgresStorageProvider {
  return new PostgresStorageProvider(config);
}
