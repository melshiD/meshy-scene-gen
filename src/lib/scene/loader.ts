import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * Loaded mesh result with metadata
 */
export interface LoadedMesh {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  dispose: () => void;
}

// Singleton loaders for reuse
let gltfLoader: GLTFLoader | null = null;
let dracoLoader: DRACOLoader | null = null;

/**
 * Initialize and get the GLTF loader with DRACO support
 */
function getLoader(): GLTFLoader {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();

    // Setup DRACO decoder for compressed meshes
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'
    );
    dracoLoader.preload();
    gltfLoader.setDRACOLoader(dracoLoader);
  }

  return gltfLoader;
}

/**
 * Load a GLB/GLTF mesh from URL
 *
 * @param url - URL to the .glb or .gltf file
 * @param onProgress - Optional progress callback (0-1)
 * @returns Promise resolving to loaded mesh data
 */
export async function loadGLTF(
  url: string,
  onProgress?: (progress: number) => void
): Promise<LoadedMesh> {
  const loader = getLoader();

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf: GLTF) => {
        const { scene, animations } = gltf;

        // Calculate bounding box for centering/scaling
        const boundingBox = new THREE.Box3().setFromObject(scene);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());

        // Enable shadows on all meshes
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Dispose function for cleanup
        const dispose = (): void => {
          scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material?.dispose();
              }
            }
          });
        };

        resolve({
          scene,
          animations,
          boundingBox,
          center,
          size,
          dispose,
        });
      },
      (event) => {
        if (onProgress && event.lengthComputable) {
          onProgress(event.loaded / event.total);
        }
      },
      (error) => {
        reject(new Error(`Failed to load GLTF: ${error}`));
      }
    );
  });
}

/**
 * Load and prepare a mesh for scene placement
 *
 * @param url - URL to the .glb file
 * @param options - Placement options
 * @returns Promise resolving to positioned mesh group
 */
export async function loadAndPrepareMesh(
  url: string,
  options: {
    position?: { x: number; y: number; z: number };
    scale?: number;
    rotation?: { x: number; y: number; z: number };
    centerOnOrigin?: boolean;
    normalizeScale?: boolean;
  } = {}
): Promise<LoadedMesh> {
  const {
    position = { x: 0, y: 0, z: 0 },
    scale = 1,
    rotation = { x: 0, y: 0, z: 0 },
    centerOnOrigin = true,
    normalizeScale = true,
  } = options;

  const mesh = await loadGLTF(url);

  // Center the mesh on origin if requested
  if (centerOnOrigin) {
    mesh.scene.position.sub(mesh.center);
  }

  // Normalize scale to fit within a unit bounding box if requested
  if (normalizeScale) {
    const maxDimension = Math.max(mesh.size.x, mesh.size.y, mesh.size.z);
    if (maxDimension > 0) {
      const normalizedScale = 1 / maxDimension;
      mesh.scene.scale.multiplyScalar(normalizedScale);
    }
  }

  // Apply user transforms
  mesh.scene.scale.multiplyScalar(scale);
  mesh.scene.position.add(new THREE.Vector3(position.x, position.y, position.z));
  mesh.scene.rotation.set(rotation.x, rotation.y, rotation.z);

  return mesh;
}

/**
 * Dispose of loader resources (call on app shutdown)
 */
export function disposeLoaders(): void {
  if (dracoLoader) {
    dracoLoader.dispose();
    dracoLoader = null;
  }
  gltfLoader = null;
}
