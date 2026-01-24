'use client';

import * as Slider from '@radix-ui/react-slider';
import * as Label from '@radix-ui/react-label';
import { useComposerStore } from '@/stores/composer-store';

// ============================================================================
// Types
// ============================================================================

export interface CameraControlsProps {
  className?: string;
}

// ============================================================================
// Slider Component
// ============================================================================

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: ControlSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label.Root className="text-xs font-medium text-neutral-400">
          {label}
        </Label.Root>
        <span className="text-xs text-neutral-500 tabular-nums">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      >
        <Slider.Track className="bg-neutral-700 relative grow rounded-full h-1">
          <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-md hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </Slider.Root>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function CameraControls({ className = '' }: CameraControlsProps) {
  const camera = useComposerStore((state) => state.camera);
  const setCameraPosition = useComposerStore(
    (state) => state.setCameraPosition
  );
  const setCameraFov = useComposerStore((state) => state.setCameraFov);
  const setCameraLookAt = useComposerStore((state) => state.setCameraLookAt);

  // Calculate spherical coordinates for intuitive controls
  const distance = Math.sqrt(
    camera.position.x ** 2 +
      camera.position.y ** 2 +
      camera.position.z ** 2
  );

  const updateFromSpherical = (
    newDistance: number,
    azimuth: number,
    elevation: number
  ) => {
    // Convert spherical to Cartesian
    const x = newDistance * Math.cos(elevation) * Math.sin(azimuth);
    const y = newDistance * Math.sin(elevation);
    const z = newDistance * Math.cos(elevation) * Math.cos(azimuth);
    setCameraPosition({ x, y, z });
  };

  // Current azimuth and elevation
  const azimuth = Math.atan2(camera.position.x, camera.position.z);
  const elevation = Math.asin(camera.position.y / distance);

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-sm font-semibold text-white">Camera</h3>

      {/* Distance & Angle */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          View
        </h4>
        <ControlSlider
          label="Distance"
          value={distance}
          min={1}
          max={15}
          step={0.1}
          onChange={(d) => updateFromSpherical(d, azimuth, elevation)}
        />
        <ControlSlider
          label="Orbit Angle"
          value={azimuth}
          min={-Math.PI}
          max={Math.PI}
          step={0.05}
          onChange={(a) => updateFromSpherical(distance, a, elevation)}
        />
        <ControlSlider
          label="Height Angle"
          value={elevation}
          min={-Math.PI / 2 + 0.1}
          max={Math.PI / 2 - 0.1}
          step={0.05}
          onChange={(e) => updateFromSpherical(distance, azimuth, e)}
        />
      </div>

      {/* FOV */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          Lens
        </h4>
        <ControlSlider
          label="Field of View"
          value={camera.fov}
          min={15}
          max={90}
          step={1}
          onChange={setCameraFov}
        />
      </div>

      {/* Look At */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          Focus Point
        </h4>
        <ControlSlider
          label="X"
          value={camera.lookAt.x}
          min={-3}
          max={3}
          step={0.1}
          onChange={(x) => setCameraLookAt({ ...camera.lookAt, x })}
        />
        <ControlSlider
          label="Y"
          value={camera.lookAt.y}
          min={-3}
          max={3}
          step={0.1}
          onChange={(y) => setCameraLookAt({ ...camera.lookAt, y })}
        />
        <ControlSlider
          label="Z"
          value={camera.lookAt.z}
          min={-3}
          max={3}
          step={0.1}
          onChange={(z) => setCameraLookAt({ ...camera.lookAt, z })}
        />
      </div>

      {/* Manual Position (collapsed by default in future) */}
      <details className="text-neutral-400">
        <summary className="text-xs font-medium cursor-pointer hover:text-neutral-200">
          Manual Position
        </summary>
        <div className="mt-3 space-y-3">
          <ControlSlider
            label="Position X"
            value={camera.position.x}
            min={-10}
            max={10}
            step={0.1}
            onChange={(x) => setCameraPosition({ ...camera.position, x })}
          />
          <ControlSlider
            label="Position Y"
            value={camera.position.y}
            min={-10}
            max={10}
            step={0.1}
            onChange={(y) => setCameraPosition({ ...camera.position, y })}
          />
          <ControlSlider
            label="Position Z"
            value={camera.position.z}
            min={-10}
            max={10}
            step={0.1}
            onChange={(z) => setCameraPosition({ ...camera.position, z })}
          />
        </div>
      </details>
    </div>
  );
}
