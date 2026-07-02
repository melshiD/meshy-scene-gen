/**
 * ManifestBuilder - Incrementally constructs a SceneManifest
 *
 * Builder pattern for creating scene manifests during the generation pipeline.
 * Tracks timestamps and validates required fields before finalizing.
 */

import type {
  SceneManifest,
  AssetReference,
  ObjectAssetReference,
} from '@/types/manifest';

/**
 * Partial assets structure for building incrementally
 */
interface PartialAssets {
  background?: AssetReference;
  mesh?: AssetReference;
  meshes?: ObjectAssetReference[];
  captures?: {
    full: AssetReference;
    web: AssetReference;
    thumb: AssetReference;
  };
}

/**
 * Builder class for incrementally constructing a SceneManifest
 *
 * Usage:
 * ```typescript
 * const manifest = new ManifestBuilder(jobId, 'single')
 *   .setPrompts({ background: 'sunset sky', decomposed: false })
 *   .setBackgroundAsset(bgAsset)
 *   .setMeshAsset(meshAsset)
 *   .markMeshStarted()
 *   .markMeshCompleted()
 *   .markBackgroundCompleted()
 *   .setSceneConfig(config)
 *   .setGeneration(genParams)
 *   .setCaptures(captures)
 *   .markCaptured()
 *   .build();
 * ```
 */
export class ManifestBuilder {
  private manifest: Partial<Omit<SceneManifest, 'assets'>> & { assets: PartialAssets };

  constructor(jobId: string, type: 'single' | 'multi') {
    this.manifest = {
      schemaVersion: '1.0.0',
      id: jobId,
      type,
      timestamps: {
        createdAt: new Date().toISOString(),
      } as SceneManifest['timestamps'],
      assets: {},
      sceneConfig: {} as SceneManifest['sceneConfig'],
    };
  }

  /**
   * Set prompt information
   */
  setPrompts(prompts: SceneManifest['prompts']): this {
    this.manifest.prompts = prompts;
    return this;
  }

  /**
   * Set generation parameters
   */
  setGeneration(generation: SceneManifest['generation']): this {
    this.manifest.generation = generation;
    return this;
  }

  /**
   * Set the background asset reference
   */
  setBackgroundAsset(asset: AssetReference): this {
    this.manifest.assets = { ...this.manifest.assets, background: asset };
    return this;
  }

  /**
   * Set the mesh asset reference (for single-object scenes)
   */
  setMeshAsset(asset: AssetReference): this {
    this.manifest.assets = { ...this.manifest.assets, mesh: asset };
    return this;
  }

  /**
   * Set multiple mesh asset references (for multi-object scenes)
   */
  setMeshAssets(assets: ObjectAssetReference[]): this {
    this.manifest.assets = { ...this.manifest.assets, meshes: assets };
    return this;
  }

  /**
   * Set captured scene images
   */
  setCaptures(captures: SceneManifest['assets']['captures']): this {
    this.manifest.assets = { ...this.manifest.assets, captures };
    return this;
  }

  /**
   * Set scene configuration (camera, lighting, objects)
   */
  setSceneConfig(config: SceneManifest['sceneConfig']): this {
    this.manifest.sceneConfig = config;
    return this;
  }

  /**
   * Set optional metadata
   */
  setMetadata(metadata: SceneManifest['metadata']): this {
    this.manifest.metadata = metadata;
    return this;
  }

  /**
   * Mark mesh generation as started
   */
  markMeshStarted(): this {
    if (this.manifest.timestamps) {
      this.manifest.timestamps.meshStartedAt = new Date().toISOString();
    }
    return this;
  }

  /**
   * Mark mesh generation as completed
   */
  markMeshCompleted(): this {
    if (this.manifest.timestamps) {
      this.manifest.timestamps.meshCompletedAt = new Date().toISOString();
    }
    return this;
  }

  /**
   * Mark background generation as completed
   */
  markBackgroundCompleted(): this {
    if (this.manifest.timestamps) {
      this.manifest.timestamps.backgroundCompletedAt = new Date().toISOString();
    }
    return this;
  }

  /**
   * Mark scene as captured (finalizes timestamps)
   */
  markCaptured(): this {
    if (this.manifest.timestamps) {
      this.manifest.timestamps.capturedAt = new Date().toISOString();
      this.manifest.timestamps.manifestCreatedAt = new Date().toISOString();
    }
    return this;
  }

  /**
   * Get the partial manifest (useful for intermediate state inspection)
   */
  getPartial(): Partial<SceneManifest> {
    return { ...this.manifest } as Partial<SceneManifest>;
  }

  /**
   * Build and validate the final manifest
   *
   * @throws Error if required fields are missing
   */
  build(): SceneManifest {
    // Validate required fields
    if (!this.manifest.id) throw new Error('Manifest missing id');
    if (!this.manifest.type) throw new Error('Manifest missing type');
    if (!this.manifest.prompts) throw new Error('Manifest missing prompts');
    if (!this.manifest.assets.background) throw new Error('Manifest missing background asset');
    if (!this.manifest.assets.captures) throw new Error('Manifest missing captures');
    if (!this.manifest.sceneConfig) throw new Error('Manifest missing sceneConfig');
    if (!this.manifest.timestamps?.capturedAt) throw new Error('Manifest not marked as captured');

    // At this point we've validated all required fields exist
    return {
      ...this.manifest,
      assets: {
        background: this.manifest.assets.background,
        captures: this.manifest.assets.captures,
        mesh: this.manifest.assets.mesh,
        meshes: this.manifest.assets.meshes,
      },
    } as SceneManifest;
  }
}
