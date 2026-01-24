/**
 * Three.js Scene Management Module
 *
 * Provides utilities for creating, lighting, and capturing 3D scenes.
 */

// Scene creation
export {
  createScene,
  createMinimalScene,
  type SceneResult,
  type CreateSceneOptions,
} from './create-scene';

// Lighting
export {
  addLighting,
  getLightingConfig,
  listLightingPresets,
  type LightingConfig,
  type LightingResult,
} from './lighting';

// Capture
export {
  captureScene,
  captureMultiResolution,
  captureAtResolution,
  downloadCapture,
  getCapturePresets,
  type CaptureResult,
  type MultiCaptureResult,
} from './capture';

// GLTF/GLB loader
export {
  loadGLTF,
  loadAndPrepareMesh,
  disposeLoaders,
  type LoadedMesh,
} from './loader';
