'use client';

import { useState } from 'react';
import * as Select from '@radix-ui/react-select';
import * as Label from '@radix-ui/react-label';
import { useComposerStore } from '@/stores/composer-store';
import { DEFAULT_PRESETS } from '@/lib/presets/defaults';

// ============================================================================
// Types
// ============================================================================

export interface PresetSelectorProps {
  className?: string;
  onSavePreset?: (name: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function PresetSelector({
  className = '',
  onSavePreset,
}: PresetSelectorProps) {
  // Built-in presets only — same as before the Postgres port (the browser never saw the server's
  // custom-preset store). Surfacing DB-saved customs here = fetch GET /api/presets (future work).
  const presets = DEFAULT_PRESETS;
  const currentPresetId = useComposerStore((state) => state.currentPresetId);
  const isDirty = useComposerStore((state) => state.isDirty);
  const loadPreset = useComposerStore((state) => state.loadPreset);
  const resetToPreset = useComposerStore((state) => state.resetToPreset);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  const currentPreset = presets.find((p) => p.id === currentPresetId);

  const handleSave = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim());
      setPresetName('');
      setShowSaveDialog(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Scene Preset</h3>
        {isDirty && (
          <span className="text-xs text-amber-400">Modified</span>
        )}
      </div>

      {/* Preset Select */}
      <div className="space-y-2">
        <Select.Root
          value={currentPresetId ?? undefined}
          onValueChange={loadPreset}
        >
          <Select.Trigger className="inline-flex items-center justify-between w-full px-3 py-2 text-sm bg-neutral-800 border border-neutral-700 rounded-lg text-white hover:bg-neutral-750 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <Select.Value placeholder="Select a preset" />
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
            <Select.Content className="overflow-hidden bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
              <Select.Viewport className="p-1">
                {presets.map((preset) => (
                  <Select.Item
                    key={preset.id}
                    value={preset.id}
                    className="relative flex flex-col px-3 py-2 text-sm text-white rounded cursor-pointer hover:bg-neutral-700 focus:bg-neutral-700 focus:outline-none data-[highlighted]:bg-neutral-700"
                  >
                    <Select.ItemText>{preset.name}</Select.ItemText>
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

      {/* Current preset info */}
      {currentPreset && (
        <div className="p-3 bg-neutral-800/50 rounded-lg text-xs">
          <div className="font-medium text-white">{currentPreset.name}</div>
          <div className="text-neutral-400 mt-1">
            {currentPreset.description}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="px-2 py-0.5 bg-neutral-700 rounded text-neutral-300">
              {currentPreset.lighting.preset}
            </span>
            <span className="px-2 py-0.5 bg-neutral-700 rounded text-neutral-300">
              FOV {currentPreset.camera.fov}°
            </span>
            <span className="px-2 py-0.5 bg-neutral-700 rounded text-neutral-300">
              Scale {currentPreset.object.scale}x
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={resetToPreset}
          disabled={!isDirty}
          className="flex-1 px-3 py-2 text-sm font-medium bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          Reset
        </button>
        <button
          onClick={() => setShowSaveDialog(true)}
          className="flex-1 px-3 py-2 text-sm font-medium bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Save As...
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-6 w-full max-w-md mx-4">
            <h4 className="text-lg font-semibold text-white mb-4">
              Save Preset
            </h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label.Root
                  htmlFor="preset-name"
                  className="text-sm font-medium text-neutral-300"
                >
                  Preset Name
                </Label.Root>
                <input
                  id="preset-name"
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="My Custom Preset"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setPresetName('');
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-neutral-700 rounded-lg text-white hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!presetName.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
