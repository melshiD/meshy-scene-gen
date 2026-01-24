'use client';

import * as Slider from '@radix-ui/react-slider';
import * as Label from '@radix-ui/react-label';
import { useComposerStore } from '@/stores/composer-store';

// ============================================================================
// Types
// ============================================================================

export interface ObjectControlsProps {
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

export function ObjectControls({ className = '' }: ObjectControlsProps) {
  const object = useComposerStore((state) => state.object);
  const setObjectPosition = useComposerStore(
    (state) => state.setObjectPosition
  );
  const setObjectScale = useComposerStore((state) => state.setObjectScale);
  const setObjectRotation = useComposerStore(
    (state) => state.setObjectRotation
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-sm font-semibold text-white">Object Transform</h3>

      {/* Position */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          Position
        </h4>
        <ControlSlider
          label="X"
          value={object.position.x}
          min={-5}
          max={5}
          step={0.1}
          onChange={(x) =>
            setObjectPosition({ ...object.position, x })
          }
        />
        <ControlSlider
          label="Y"
          value={object.position.y}
          min={-5}
          max={5}
          step={0.1}
          onChange={(y) =>
            setObjectPosition({ ...object.position, y })
          }
        />
        <ControlSlider
          label="Z"
          value={object.position.z}
          min={-5}
          max={5}
          step={0.1}
          onChange={(z) =>
            setObjectPosition({ ...object.position, z })
          }
        />
      </div>

      {/* Scale */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          Scale
        </h4>
        <ControlSlider
          label="Uniform Scale"
          value={object.scale}
          min={0.1}
          max={3}
          step={0.1}
          onChange={setObjectScale}
        />
      </div>

      {/* Rotation */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          Rotation (radians)
        </h4>
        <ControlSlider
          label="X (Pitch)"
          value={object.rotation.x}
          min={-Math.PI}
          max={Math.PI}
          step={0.05}
          onChange={(x) =>
            setObjectRotation({ ...object.rotation, x })
          }
        />
        <ControlSlider
          label="Y (Yaw)"
          value={object.rotation.y}
          min={-Math.PI}
          max={Math.PI}
          step={0.05}
          onChange={(y) =>
            setObjectRotation({ ...object.rotation, y })
          }
        />
        <ControlSlider
          label="Z (Roll)"
          value={object.rotation.z}
          min={-Math.PI}
          max={Math.PI}
          step={0.05}
          onChange={(z) =>
            setObjectRotation({ ...object.rotation, z })
          }
        />
      </div>
    </div>
  );
}
