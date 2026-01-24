// ============================================================================
// Core Types for 3D Scene Generator
// ============================================================================

/** 3D vector for positions, rotations, etc. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// Prompt Types
// ============================================================================

/** Decomposed prompt from AI parsing */
export interface DecomposedPrompt {
  object: string;
  background: string;
  mood: string;
  camera: string;
}

// ============================================================================
// Scene Configuration
// ============================================================================

/** Lighting preset names */
export type LightingPreset = 'dramatic' | 'soft' | 'studio';

/** Scene preset configuration */
export interface ScenePreset {
  id: string;
  name: string;
  description: string;
  object: {
    position: Vec3;
    scale: number;
    rotation: Vec3;
  };
  camera: {
    position: Vec3;
    fov: number;
    lookAt: Vec3;
  };
  lighting: {
    preset: LightingPreset;
    intensity?: number;
    color?: string;
  };
}

/** Scene configuration (preset + overrides) */
export interface SceneConfig {
  backgroundUrl: string;
  meshUrl: string;
  object: {
    position: Vec3;
    scale: number;
    rotation: Vec3;
  };
  camera: {
    position: Vec3;
    fov: number;
    lookAt: Vec3;
  };
  lighting: {
    preset: LightingPreset;
    intensity?: number;
    color?: string;
  };
}

// ============================================================================
// API Types
// ============================================================================

/** Deep partial type for scene config overrides */
export interface SceneConfigOverrides {
  object?: Partial<{ position: Vec3; scale: number; rotation: Vec3 }>;
  camera?: Partial<{ position: Vec3; fov: number; lookAt: Vec3 }>;
  lighting?: Partial<{ preset: LightingPreset; intensity?: number; color?: string }>;
}

/** Request to generate an asset */
export interface GenerateRequest {
  /** Single prompt - will be decomposed by AI */
  prompt?: string;
  /** Direct object prompt (skips AI decomposition) */
  objectPrompt?: string;
  /** Direct background prompt (skips AI decomposition) */
  backgroundPrompt?: string;
  /** Preset ID to use for scene configuration */
  preset?: string;
  /** Override specific preset values */
  overrides?: SceneConfigOverrides;
}

/** Job status */
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

/** Generated asset result */
export interface GeneratedAsset {
  id: string;
  status: JobStatus;
  prompt: string;
  objectPrompt?: string;
  backgroundPrompt?: string;
  presetId?: string;
  assets?: {
    full: string;   // 2048x2048 PNG
    web: string;    // 800x800 WebP
    thumb: string;  // 400x400 WebP
  };
  meshUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ============================================================================
// Meshy API Types
// ============================================================================

/** Meshy task status */
export type MeshyTaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'EXPIRED';

/** Meshy text-to-3D task */
export interface MeshyTask {
  id: string;
  status: MeshyTaskStatus;
  model_urls?: {
    glb: string;
    fbx: string;
    usdz: string;
    obj: string;
  };
  thumbnail_url?: string;
  progress?: number;
  task_error?: {
    message: string;
  };
  created_at: number;
  finished_at?: number;
}

/** Meshy art style options */
export type MeshyArtStyle =
  | 'realistic'
  | 'cartoon'
  | 'low-poly'
  | 'sculpture'
  | 'pbr';

/** Request to create Meshy task */
export interface MeshyCreateTaskRequest {
  mode: 'preview' | 'refine';
  prompt: string;
  art_style: MeshyArtStyle;
  negative_prompt?: string;
}

// ============================================================================
// Capture Types
// ============================================================================

/** Image format for capture */
export type ImageFormat = 'png' | 'jpeg' | 'webp';

/** Capture configuration */
export interface CaptureOptions {
  width: number;
  height: number;
  format: ImageFormat;
  quality: number; // 0-1 for jpeg/webp
}

/** Standard capture presets */
export const CAPTURE_PRESETS = {
  nft: {
    width: 2048,
    height: 2048,
    format: 'png' as ImageFormat,
    quality: 1,
  },
  web: {
    width: 800,
    height: 800,
    format: 'webp' as ImageFormat,
    quality: 0.85,
  },
  thumb: {
    width: 400,
    height: 400,
    format: 'webp' as ImageFormat,
    quality: 0.8,
  },
  social: {
    width: 1200,
    height: 630,
    format: 'jpeg' as ImageFormat,
    quality: 0.9,
  },
} as const;
