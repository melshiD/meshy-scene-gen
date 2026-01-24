'use client';

import * as Select from '@radix-ui/react-select';
import * as Slider from '@radix-ui/react-slider';
import * as Label from '@radix-ui/react-label';
import { useComposerStore } from '@/stores/composer-store';
import type { LightingPreset } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface LightingControlsProps {
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

const LIGHTING_PRESETS: { value: LightingPreset; label: string; description: string }[] = [
  { value: 'dramatic', label: 'Dramatic', description: 'High contrast with rim lighting' },
  { value: 'soft', label: 'Soft', description: 'Even, diffused illumination' },
  { value: 'studio', label: 'Studio', description: 'Professional 3-point setup' },
];

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

export function LightingControls({ className = '' }: LightingControlsProps) {
  const lighting = useComposerStore((state) => state.lighting);
  const setLightingPreset = useComposerStore(
    (state) => state.setLightingPreset
  );
  const setLightingIntensity = useComposerStore(
    (state) => state.setLightingIntensity
  );
  const setLightingColor = useComposerStore(
    (state) => state.setLightingColor
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-sm font-semibold text-white">Lighting</h3>

      {/* Preset Select */}
      <div className="space-y-2">
        <Label.Root className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          Preset
        </Label.Root>
        <Select.Root
          value={lighting.preset}
          onValueChange={(value) => setLightingPreset(value as LightingPreset)}
        >
          <Select.Trigger className="inline-flex items-center justify-between w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-750 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Select.Value />
            <Select.Icon className="ml-2">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="overflow-hidden bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl">
              <Select.Viewport className="p-1">
                {LIGHTING_PRESETS.map((preset) => (
                  <Select.Item
                    key={preset.value}
                    value={preset.value}
                    className="relative flex flex-col px-3 py-2 text-sm text-white rounded cursor-pointer hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none data-[highlighted]:bg-neutral-700"
                  >
                    <Select.ItemText>{preset.label}</Select.ItemText>
                    <span className="text-xs text-neutral-400">
                      {preset.description}
                    </span>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Intensity */}
      <div className="space-y-3">
        <ControlSlider
          label="Intensity"
          value={lighting.intensity}
          min={0.1}
          max={3}
          step={0.1}
          onChange={setLightingIntensity}
        />
      </div>

      {/* Color */}
      <div className="space-y-2">
        <Label.Root className="text-xs font-medium text-neutral-300 uppercase tracking-wider">
          Key Light Color
        </Label.Root>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={lighting.color}
            onChange={(e) => setLightingColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-neutral-700 bg-transparent"
          />
          <input
            type="text"
            value={lighting.color}
            onChange={(e) => setLightingColor(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="#ffffff"
          />
        </div>
      </div>

      {/* Quick presets */}
      <div className="space-y-2">
        <Label.Root className="text-xs font-medium text-neutral-400">
          Quick Colors
        </Label.Root>
        <div className="flex gap-2">
          {['#ffffff', '#fff4e6', '#e6f4ff', '#ffb366', '#66b3ff'].map(
            (color) => (
              <button
                key={color}
                onClick={() => setLightingColor(color)}
                className="w-8 h-8 rounded border border-neutral-700 hover:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
