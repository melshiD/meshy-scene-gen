/**
 * Scene Manifest Types
 *
 * Defines the structure for scene manifests that capture complete
 * generation metadata, asset references, and scene configuration.
 */

import type {
  Vec3,
  LightingPreset,
  LayoutConfig,
  MeshyArtStyle,
} from '@/types';

// ============================================================================
// Asset Reference Types
// ============================================================================

/**
 * Reference to a persisted asset in storage
 */
export interface AssetReference {
  /** Public URL to access the asset */
  url: string;
  /** Storage key for the asset */
  key: string;
  /** Original URL before persistence (e.g., DALL-E or Meshy CDN URL) */
  originalUrl?: string;
  /** MIME type of the asset */
  contentType: string;
  /** Size in bytes */
  size?: number;
  /** When the asset was persisted to storage */
  persistedAt: string;
}

/**
 * Asset reference for a 3D object mesh
 * Extends base asset reference with object-specific metadata
 */
export interface ObjectAssetReference extends AssetReference {
  /** Unique object identifier */
  objectId: string;
  /** Display name for the object */
  name: string;
  /** Prompt used to generate the mesh */
  prompt: string;
  /** Art style used for mesh generation */
  artStyle?: MeshyArtStyle;
}

// ============================================================================
// Transform Types
// ============================================================================

/**
 * Transform configuration for a 3D object
 */
export interface ObjectTransform {
  position: Vec3;
  scale: number;
  rotation: Vec3;
}

/**
 * Scene object as stored in the manifest
 */
export interface ManifestSceneObject {
  /** Unique object identifier */
  id: string;
  /** Display name */
  name: string;
  /** Prompt used to generate the mesh */
  prompt: string;
  /** Art style used for mesh generation */
  artStyle?: MeshyArtStyle;
  /** Object transform in scene */
  transform: ObjectTransform;
  /** Whether the object is visible in the scene */
  visible: boolean;
}

// ============================================================================
// Scene Manifest
// ============================================================================

/**
 * Complete scene manifest
 *
 * Captures everything needed to understand and reproduce a generated scene:
 * - Original prompts and decomposition
 * - All asset references with storage keys
 * - Scene configuration (camera, lighting, objects)
 * - Generation parameters
 * - Timestamps for the generation process
 */
export interface SceneManifest {
  /** Schema version for forward compatibility */
  schemaVersion: '1.0.0';

  /** Unique job/manifest identifier */
  id: string;

  /** Scene type: single object or multi-object */
  type: 'single' | 'multi';

  /** Prompt information */
  prompts: {
    /** Original combined prompt (if provided) */
    original?: string;
    /** Object generation prompt */
    object?: string;
    /** Background generation prompt */
    background: string;
    /** Extracted mood/atmosphere */
    mood?: string;
    /** Whether the prompt was AI-decomposed */
    decomposed: boolean;
  };

  /** Asset references */
  assets: {
    /** Background image reference */
    background: AssetReference;
    /** Single mesh reference (for type: 'single') */
    mesh?: AssetReference;
    /** Multiple mesh references (for type: 'multi') */
    meshes?: ObjectAssetReference[];
    /** Captured scene images */
    captures: {
      /** Full resolution (2048x2048 PNG) */
      full: AssetReference;
      /** Web resolution (800x800 WebP) */
      web: AssetReference;
      /** Thumbnail (400x400 WebP) */
      thumb: AssetReference;
    };
  };

  /** Scene configuration at capture time */
  sceneConfig: {
    /** Camera settings */
    camera: {
      position: Vec3;
      fov: number;
      lookAt: Vec3;
    };
    /** Lighting settings */
    lighting: {
      preset: LightingPreset;
      intensity?: number;
      color?: string;
    };
    /** Single object transform (for type: 'single') */
    object?: ObjectTransform;
    /** Multiple object transforms (for type: 'multi') */
    objects?: ManifestSceneObject[];
    /** Layout configuration (for type: 'multi') */
    layout?: LayoutConfig;
  };

  /** Generation parameters */
  generation: {
    /** Preset ID used (if any) */
    presetId?: string;
    /** Preset name for reference */
    presetName?: string;
    /** Mesh art style used */
    meshArtStyle?: MeshyArtStyle;
    /** Capture resolution */
    captureSize: {
      width: number;
      height: number;
    };
  };

  /** Generation timestamps (ISO 8601 format) */
  timestamps: {
    /** When the job was created */
    createdAt: string;
    /** When mesh generation started */
    meshStartedAt?: string;
    /** When mesh generation completed */
    meshCompletedAt?: string;
    /** When background generation completed */
    backgroundCompletedAt?: string;
    /** When scene was captured */
    capturedAt: string;
    /** When this manifest was created */
    manifestCreatedAt: string;
  };

  /** Optional metadata */
  metadata?: {
    /** Searchable tags */
    tags?: string[];
    /** Custom key-value data */
    custom?: Record<string, unknown>;
  };
}
