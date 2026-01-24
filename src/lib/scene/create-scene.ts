import * as THREE from 'three';
import type { SceneConfig, Vec3 } from '@/types';
import { addLighting, type LightingResult } from './lighting';
import { loadAndPrepareMesh, type LoadedMesh } from './loader';

/**
 * Scene creation result
 */
export interface SceneResult {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  lighting: LightingResult;
  mesh: LoadedMesh | null;
  backgroundTexture: THREE.Texture | null;
  dispose: () => void;
  updateCamera: (position: Vec3, lookAt: Vec3, fov?: number) => void;
  setBackground: (url: string) => Promise<void>;
  loadMesh: (url: string, position?: Vec3, scale?: number, rotation?: Vec3) => Promise<LoadedMesh>;
}

/**
 * Scene creation options
 */
export interface CreateSceneOptions {
  /** Canvas element to render to (creates one if not provided) */
  canvas?: HTMLCanvasElement;
  /** Initial width (defaults to 800) */
  width?: number;
  /** Initial height (defaults to 800) */
  height?: number;
  /** Enable antialiasing (defaults to true) */
  antialias?: boolean;
  /** Background color if no texture (defaults to black) */
  backgroundColor?: string;
  /** Enable transparent background (defaults to false) */
  alpha?: boolean;
  /** Enable shadows (defaults to true) */
  shadows?: boolean;
}

/**
 * Load a texture from URL
 */
async function loadTexture(url: string): Promise<THREE.Texture> {
  const loader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      },
      undefined,
      (error) => {
        reject(new Error(`Failed to load texture: ${error}`));
      }
    );
  });
}

/**
 * Create a Three.js scene with full configuration
 *
 * @param config - Scene configuration from preset or custom
 * @param options - Additional scene options
 * @returns Promise resolving to scene result with all components
 */
export async function createScene(
  config: SceneConfig,
  options: CreateSceneOptions = {}
): Promise<SceneResult> {
  const {
    canvas,
    width = 800,
    height = 800,
    antialias = true,
    backgroundColor = '#000000',
    alpha = false,
    shadows = true,
  } = options;

  // Create scene
  const scene = new THREE.Scene();

  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha,
    preserveDrawingBuffer: true, // Required for canvas capture
  });
  renderer.setSize(width, height);
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  renderer.setPixelRatio(Math.min(pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  // Set background color (may be overwritten by texture)
  scene.background = new THREE.Color(backgroundColor);

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    config.camera.fov,
    width / height,
    0.1,
    1000
  );
  camera.position.set(
    config.camera.position.x,
    config.camera.position.y,
    config.camera.position.z
  );
  camera.lookAt(
    config.camera.lookAt.x,
    config.camera.lookAt.y,
    config.camera.lookAt.z
  );

  // Add lighting
  const lighting = addLighting(
    scene,
    config.lighting.preset,
    config.lighting.intensity,
    config.lighting.color
  );

  // Load background texture if provided
  let backgroundTexture: THREE.Texture | null = null;
  if (config.backgroundUrl) {
    try {
      backgroundTexture = await loadTexture(config.backgroundUrl);
      scene.background = backgroundTexture;
    } catch (error) {
      console.warn('Failed to load background texture:', error);
    }
  }

  // Load mesh if provided
  let mesh: LoadedMesh | null = null;
  if (config.meshUrl) {
    try {
      mesh = await loadAndPrepareMesh(config.meshUrl, {
        position: config.object.position,
        scale: config.object.scale,
        rotation: config.object.rotation,
      });
      scene.add(mesh.scene);
    } catch (error) {
      console.warn('Failed to load mesh:', error);
    }
  }

  // Helper functions
  const updateCamera = (position: Vec3, lookAt: Vec3, fov?: number): void => {
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    if (fov !== undefined) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  };

  const setBackground = async (url: string): Promise<void> => {
    if (backgroundTexture) {
      backgroundTexture.dispose();
    }
    backgroundTexture = await loadTexture(url);
    scene.background = backgroundTexture;
  };

  const loadMeshFn = async (
    url: string,
    position: Vec3 = { x: 0, y: 0, z: 0 },
    scale = 1,
    rotation: Vec3 = { x: 0, y: 0, z: 0 }
  ): Promise<LoadedMesh> => {
    // Remove existing mesh if any
    if (mesh) {
      scene.remove(mesh.scene);
      mesh.dispose();
    }

    mesh = await loadAndPrepareMesh(url, {
      position,
      scale,
      rotation,
    });
    scene.add(mesh.scene);
    return mesh;
  };

  // Cleanup function
  const dispose = (): void => {
    lighting.dispose();
    if (mesh) {
      scene.remove(mesh.scene);
      mesh.dispose();
    }
    if (backgroundTexture) {
      backgroundTexture.dispose();
    }
    renderer.dispose();
  };

  return {
    scene,
    camera,
    renderer,
    lighting,
    mesh,
    backgroundTexture,
    dispose,
    updateCamera,
    setBackground,
    loadMesh: loadMeshFn,
  };
}

/**
 * Create a minimal scene for quick setup
 *
 * @param options - Scene options
 * @returns Scene result with default lighting
 */
export function createMinimalScene(
  options: CreateSceneOptions = {}
): Omit<SceneResult, 'mesh' | 'backgroundTexture' | 'setBackground' | 'loadMesh'> & {
  setBackground: (url: string) => Promise<THREE.Texture>;
  addMesh: (group: THREE.Group) => void;
} {
  const {
    canvas,
    width = 800,
    height = 800,
    antialias = true,
    backgroundColor = '#000000',
    alpha = false,
    shadows = true,
  } = options;

  const scene = new THREE.Scene();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha,
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height);
  const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  renderer.setPixelRatio(Math.min(pixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  if (shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  scene.background = new THREE.Color(backgroundColor);

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1, 4);
  camera.lookAt(0, 0, 0);

  const lighting = addLighting(scene, 'studio');

  const updateCamera = (position: Vec3, lookAt: Vec3, fov?: number): void => {
    camera.position.set(position.x, position.y, position.z);
    camera.lookAt(lookAt.x, lookAt.y, lookAt.z);
    if (fov !== undefined) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  };

  const setBackground = async (url: string): Promise<THREE.Texture> => {
    const texture = await loadTexture(url);
    scene.background = texture;
    return texture;
  };

  const addMesh = (group: THREE.Group): void => {
    scene.add(group);
  };

  const dispose = (): void => {
    lighting.dispose();
    renderer.dispose();
  };

  return {
    scene,
    camera,
    renderer,
    lighting,
    dispose,
    updateCamera,
    setBackground,
    addMesh,
  };
}
