'use client';

import * as Slider from '@radix-ui/react-slider';
import * as Label from '@radix-ui/react-label';
import { useComposerStore, selectSelectedObject } from '@/stores/composer-store';

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
  disabled?: boolean;
}

function ControlSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
}: ControlSliderProps) {
  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50' : ''}`}>
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
        onValueChange={([v]) => !disabled && onChange(v)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      >
        <Slider.Track className="bg-neutral-700 relative grow rounded-full h-1">
          <Slider.Range className="absolute bg-indigo-500 rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className={`block w-4 h-4 bg-white rounded-full shadow-md hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${disabled ? 'cursor-not-allowed' : ''}`} />
      </Slider.Root>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function ObjectControls({ className = '' }: ObjectControlsProps) {
  const object = useComposerStore((state) => state.object);
  const selectedObject = useComposerStore(selectSelectedObject);
  const setObjectPosition = useComposerStore(
    (state) => state.setObjectPosition
  );
  const setObjectScale = useComposerStore((state) => state.setObjectScale);
  const setObjectRotation = useComposerStore(
    (state) => state.setObjectRotation
  );
  const updateObject = useComposerStore((state) => state.updateObject);

  // Show message when no object is selected
  if (!selectedObject) {
    return (
      <div className={`space-y-6 ${className}`}>
        <h3 className="text-sm font-semibold text-white">Object Transform</h3>
        <div className="text-center py-8 text-neutral-500 text-sm">
          No object selected. Select an object from the list to edit its transform.
        </div>
      </div>
    );
  }

  // Check if object is locked
  const isLocked = selectedObject.locked;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with selected object name */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Object Transform</h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={selectedObject.name}
            onChange={(e) =>
              updateObject(selectedObject.id, { name: e.target.value })
            }
            disabled={isLocked}
            className="flex-1 px-2 py-1 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isLocked && (
            <span className="text-xs text-amber-500">Locked</span>
          )}
        </div>
      </div>

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
            !isLocked && setObjectPosition({ ...object.position, x })
          }
          disabled={isLocked}
        />
        <ControlSlider
          label="Y"
          value={object.position.y}
          min={-5}
          max={5}
          step={0.1}
          onChange={(y) =>
            !isLocked && setObjectPosition({ ...object.position, y })
          }
          disabled={isLocked}
        />
        <ControlSlider
          label="Z"
          value={object.position.z}
          min={-5}
          max={5}
          step={0.1}
          onChange={(z) =>
            !isLocked && setObjectPosition({ ...object.position, z })
          }
          disabled={isLocked}
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
          onChange={(scale) => !isLocked && setObjectScale(scale)}
          disabled={isLocked}
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
            !isLocked && setObjectRotation({ ...object.rotation, x })
          }
          disabled={isLocked}
        />
        <ControlSlider
          label="Y (Yaw)"
          value={object.rotation.y}
          min={-Math.PI}
          max={Math.PI}
          step={0.05}
          onChange={(y) =>
            !isLocked && setObjectRotation({ ...object.rotation, y })
          }
          disabled={isLocked}
        />
        <ControlSlider
          label="Z (Roll)"
          value={object.rotation.z}
          min={-Math.PI}
          max={Math.PI}
          step={0.05}
          onChange={(z) =>
            !isLocked && setObjectRotation({ ...object.rotation, z })
          }
          disabled={isLocked}
        />
      </div>
    </div>
  );
}
