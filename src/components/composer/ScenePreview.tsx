'use client';

import { Suspense, useRef, useEffect, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  useGLTF,
  Center,
  Grid,
} from '@react-three/drei';
import * as THREE from 'three';
import { useComposerStore } from '@/stores/composer-store';
import type { SceneObject as SceneObjectType } from '@/types';
import { captureMultiResolution, type MultiCaptureResult } from '@/lib/scene/capture';

// ============================================================================
// Scene Object Component
// ============================================================================

interface SceneObjectProps {
  object: SceneObjectType;
  isSelected: boolean;
}

// Separate component for loaded GLTF to satisfy hook rules
function LoadedMesh({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  useEffect(() => {
    if (clonedScene) {
      // Center and normalize the loaded model
      const box = new THREE.Box3().setFromObject(clonedScene);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = maxDim > 0 ? 1 / maxDim : 1;
      clonedScene.scale.setScalar(scale);

      const center = box.getCenter(new THREE.Vector3());
      clonedScene.position.sub(center.multiplyScalar(scale));
    }
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}

// Placeholder cube when no mesh loaded
function PlaceholderMesh({ color = '#6366f1' }: { color?: string }) {
  return (
    <Center>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
    </Center>
  );
}

// Selection highlight outline
function SelectionOutline() {
  return (
    <mesh>
      <boxGeometry args={[1.15, 1.15, 1.15]} />
      <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.5} />
    </mesh>
  );
}

function SceneObject({ object, isSelected }: SceneObjectProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Don't render if not visible
  if (!object.visible) return null;

  return (
    <group
      ref={groupRef}
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={object.scale}
    >
      {object.meshUrl ? (
        <LoadedMesh url={object.meshUrl} />
      ) : (
        <PlaceholderMesh color={isSelected ? '#818cf8' : '#6366f1'} />
      )}
      {isSelected && <SelectionOutline />}
    </group>
  );
}

// Legacy single object support (for backward compatibility)
interface LegacySceneObjectProps {
  url: string | null;
}

function LegacySceneObject({ url }: LegacySceneObjectProps) {
  const { object } = useComposerStore();
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group
      ref={groupRef}
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={object.scale}
    >
      {url ? <LoadedMesh url={url} /> : <PlaceholderMesh />}
    </group>
  );
}

// ============================================================================
// Camera Controller
// ============================================================================

function CameraController() {
  const { camera: cameraState } = useComposerStore();
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(
      cameraState.position.x,
      cameraState.position.y,
      cameraState.position.z
    );
    camera.lookAt(
      cameraState.lookAt.x,
      cameraState.lookAt.y,
      cameraState.lookAt.z
    );
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = cameraState.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, cameraState]);

  return null;
}

// ============================================================================
// Lighting Setup
// ============================================================================

function SceneLighting() {
  const { lighting } = useComposerStore();
  const color = new THREE.Color(lighting.color);

  // Different lighting setups based on preset
  const configs = {
    dramatic: {
      keyIntensity: 2.0,
      fillIntensity: 0.3,
      rimIntensity: 1.5,
      ambientIntensity: 0.15,
    },
    soft: {
      keyIntensity: 1.2,
      fillIntensity: 0.8,
      rimIntensity: 0,
      ambientIntensity: 0.5,
    },
    studio: {
      keyIntensity: 1.5,
      fillIntensity: 0.6,
      rimIntensity: 0.8,
      ambientIntensity: 0.3,
    },
  };

  const config = configs[lighting.preset];
  const multiplier = lighting.intensity;

  return (
    <>
      {/* Key Light */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={config.keyIntensity * multiplier}
        color={color}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Fill Light */}
      <directionalLight
        position={[-3, 2, -3]}
        intensity={config.fillIntensity * multiplier}
        color="#e8f0ff"
      />
      {/* Rim Light (dramatic/studio only) */}
      {config.rimIntensity > 0 && (
        <directionalLight
          position={[-2, 3, -5]}
          intensity={config.rimIntensity * multiplier}
          color="#ffd9b3"
        />
      )}
      {/* Ambient */}
      <ambientLight intensity={config.ambientIntensity * multiplier} />
    </>
  );
}

// ============================================================================
// Background Plane
// ============================================================================

interface BackgroundPlaneProps {
  url: string | null;
}

function BackgroundPlane({ url }: BackgroundPlaneProps) {
  const texture = url ? new THREE.TextureLoader().load(url) : null;

  if (!texture) {
    return null;
  }

  return (
    <mesh position={[0, 0, -5]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

// ============================================================================
// Loading Fallback
// ============================================================================

function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
}

// ============================================================================
// Multi-Object Renderer
// ============================================================================

function MultiObjectRenderer() {
  const objects = useComposerStore((state) => state.objects);
  const selectedObjectId = useComposerStore((state) => state.selectedObjectId);

  return (
    <>
      {objects.map((obj) => (
        <SceneObject
          key={obj.id}
          object={obj}
          isSelected={obj.id === selectedObjectId}
        />
      ))}
    </>
  );
}

// ============================================================================
// Capture Handler (inside Canvas)
// ============================================================================

interface CaptureHandlerProps {
  onCaptureReady: (captureFn: () => Promise<MultiCaptureResult>) => void;
}

function CaptureHandler({ onCaptureReady }: CaptureHandlerProps) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const captureFn = async () => {
      return captureMultiResolution(gl, scene, camera);
    };
    onCaptureReady(captureFn);
  }, [gl, scene, camera, onCaptureReady]);

  return null;
}

// ============================================================================
// Main Scene Preview Component
// ============================================================================

export interface ScenePreviewHandle {
  capture: () => Promise<MultiCaptureResult>;
}

export interface ScenePreviewProps {
  className?: string;
  /** Use legacy single-object mode (for backward compatibility) */
  legacyMode?: boolean;
}

export const ScenePreview = forwardRef<ScenePreviewHandle, ScenePreviewProps>(
  function ScenePreview({ className = '', legacyMode = false }, ref) {
    const meshUrl = useComposerStore((state) => state.meshUrl);
    const backgroundUrl = useComposerStore((state) => state.backgroundUrl);
    const camera = useComposerStore((state) => state.camera);
    const objects = useComposerStore((state) => state.objects);
    const selectedObjectId = useComposerStore((state) => state.selectedObjectId);

    const captureRef = useRef<(() => Promise<MultiCaptureResult>) | null>(null);

    const handleCaptureReady = useCallback((captureFn: () => Promise<MultiCaptureResult>) => {
      captureRef.current = captureFn;
    }, []);

    useImperativeHandle(ref, () => ({
      capture: async () => {
        if (!captureRef.current) {
          throw new Error('Capture not ready - scene not initialized');
        }
        return captureRef.current();
      },
    }), []);

    return (
      <div className={`relative w-full h-full min-h-[400px] bg-neutral-900 rounded-lg overflow-hidden ${className}`}>
        <Canvas
          shadows
          camera={{
            position: [camera.position.x, camera.position.y, camera.position.z],
            fov: camera.fov,
            near: 0.1,
            far: 1000,
          }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <CaptureHandler onCaptureReady={handleCaptureReady} />
          <CameraController />
          <SceneLighting />

          <Suspense fallback={<LoadingFallback />}>
            {legacyMode ? (
              <LegacySceneObject url={meshUrl} />
            ) : (
              <MultiObjectRenderer />
            )}
            <BackgroundPlane url={backgroundUrl} />
          </Suspense>

          {/* Helper grid */}
          <Grid
            args={[10, 10]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#333"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#555"
            fadeDistance={15}
            fadeStrength={1}
            followCamera={false}
            infiniteGrid
          />

          {/* Environment for reflections */}
          <Environment preset="city" />

          {/* Controls */}
          <OrbitControls
            makeDefault
            enablePan
            enableZoom
            enableRotate
            minDistance={1}
            maxDistance={20}
          />
        </Canvas>

        {/* Overlay info */}
        <div className="absolute bottom-2 left-2 text-xs text-neutral-500">
          {objects.length > 1 && (
            <span className="mr-2 text-indigo-400">
              {objects.length} objects
              {selectedObjectId && ` | Selected: ${objects.find(o => o.id === selectedObjectId)?.name}`}
            </span>
          )}
          Drag to orbit | Scroll to zoom | Shift+drag to pan
        </div>
      </div>
    );
  }
);
