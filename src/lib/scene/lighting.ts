import * as THREE from 'three';
import type { LightingPreset } from '@/types';

/**
 * Lighting configuration for a preset
 */
export interface LightingConfig {
  keyLight: {
    position: THREE.Vector3;
    intensity: number;
    color: THREE.Color;
  };
  fillLight: {
    position: THREE.Vector3;
    intensity: number;
    color: THREE.Color;
  };
  rimLight?: {
    position: THREE.Vector3;
    intensity: number;
    color: THREE.Color;
  };
  ambient: {
    intensity: number;
    color: THREE.Color;
  };
}

/**
 * Lighting preset configurations
 */
const LIGHTING_CONFIGS: Record<LightingPreset, LightingConfig> = {
  dramatic: {
    keyLight: {
      position: new THREE.Vector3(5, 5, 5),
      intensity: 2.0,
      color: new THREE.Color(0xfff4e6),
    },
    fillLight: {
      position: new THREE.Vector3(-3, 2, -3),
      intensity: 0.3,
      color: new THREE.Color(0x6b8cce),
    },
    rimLight: {
      position: new THREE.Vector3(-2, 3, -5),
      intensity: 1.5,
      color: new THREE.Color(0xffd9b3),
    },
    ambient: {
      intensity: 0.15,
      color: new THREE.Color(0x404040),
    },
  },
  soft: {
    keyLight: {
      position: new THREE.Vector3(3, 4, 4),
      intensity: 1.2,
      color: new THREE.Color(0xffffff),
    },
    fillLight: {
      position: new THREE.Vector3(-4, 3, 2),
      intensity: 0.8,
      color: new THREE.Color(0xe8f0ff),
    },
    ambient: {
      intensity: 0.5,
      color: new THREE.Color(0xf0f0f0),
    },
  },
  studio: {
    keyLight: {
      position: new THREE.Vector3(4, 5, 4),
      intensity: 1.5,
      color: new THREE.Color(0xffffff),
    },
    fillLight: {
      position: new THREE.Vector3(-4, 3, 4),
      intensity: 0.6,
      color: new THREE.Color(0xffffff),
    },
    rimLight: {
      position: new THREE.Vector3(0, 4, -5),
      intensity: 0.8,
      color: new THREE.Color(0xffffff),
    },
    ambient: {
      intensity: 0.3,
      color: new THREE.Color(0xffffff),
    },
  },
};

/**
 * Result of adding lighting to a scene
 */
export interface LightingResult {
  keyLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;
  rimLight: THREE.DirectionalLight | null;
  ambientLight: THREE.AmbientLight;
  dispose: () => void;
}

/**
 * Add lighting to a Three.js scene based on preset
 *
 * @param scene - The Three.js scene to add lighting to
 * @param preset - The lighting preset to use
 * @param intensityMultiplier - Optional multiplier for all light intensities
 * @param colorOverride - Optional color override for key light (hex string)
 * @returns Object containing all created lights and a dispose function
 */
export function addLighting(
  scene: THREE.Scene,
  preset: LightingPreset,
  intensityMultiplier = 1,
  colorOverride?: string
): LightingResult {
  const config = LIGHTING_CONFIGS[preset];

  // Key light (main directional light)
  const keyLight = new THREE.DirectionalLight(
    colorOverride ? new THREE.Color(colorOverride) : config.keyLight.color,
    config.keyLight.intensity * intensityMultiplier
  );
  keyLight.position.copy(config.keyLight.position);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  scene.add(keyLight);

  // Fill light (softer secondary light)
  const fillLight = new THREE.DirectionalLight(
    config.fillLight.color,
    config.fillLight.intensity * intensityMultiplier
  );
  fillLight.position.copy(config.fillLight.position);
  scene.add(fillLight);

  // Rim light (optional backlight for edge definition)
  let rimLight: THREE.DirectionalLight | null = null;
  if (config.rimLight) {
    rimLight = new THREE.DirectionalLight(
      config.rimLight.color,
      config.rimLight.intensity * intensityMultiplier
    );
    rimLight.position.copy(config.rimLight.position);
    scene.add(rimLight);
  }

  // Ambient light (overall scene illumination)
  const ambientLight = new THREE.AmbientLight(
    config.ambient.color,
    config.ambient.intensity * intensityMultiplier
  );
  scene.add(ambientLight);

  // Cleanup function
  const dispose = (): void => {
    scene.remove(keyLight);
    scene.remove(fillLight);
    scene.remove(ambientLight);
    if (rimLight) {
      scene.remove(rimLight);
    }
  };

  return {
    keyLight,
    fillLight,
    rimLight,
    ambientLight,
    dispose,
  };
}

/**
 * Get the lighting configuration for a preset
 */
export function getLightingConfig(preset: LightingPreset): LightingConfig {
  return LIGHTING_CONFIGS[preset];
}

/**
 * List all available lighting presets
 */
export function listLightingPresets(): LightingPreset[] {
  return Object.keys(LIGHTING_CONFIGS) as LightingPreset[];
}
