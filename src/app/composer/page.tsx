'use client';

import { useState } from 'react';
import {
  ScenePreview,
  PromptInput,
  ObjectControls,
  CameraControls,
  LightingControls,
  PresetSelector,
} from '@/components/composer';
import { useComposerStore } from '@/stores/composer-store';

// ============================================================================
// Control Panel Section
// ============================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-800 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-200 hover:bg-neutral-800/50"
      >
        {title}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ============================================================================
// Generate Button
// ============================================================================

function GenerateButton() {
  const prompt = useComposerStore((state) => state.prompt);
  const isGenerating = useComposerStore((state) => state.isGenerating);
  const setIsGenerating = useComposerStore((state) => state.setIsGenerating);
  const setMeshUrl = useComposerStore((state) => state.setMeshUrl);
  const setBackgroundUrl = useComposerStore((state) => state.setBackgroundUrl);

  const hasPrompt =
    prompt.mode === 'single'
      ? prompt.single.trim().length > 0
      : prompt.object.trim().length > 0 || prompt.background.trim().length > 0;

  const handleGenerate = async () => {
    if (!hasPrompt || isGenerating) return;

    setIsGenerating(true);

    // Placeholder: In production, this would call the /api/generate endpoint
    // For now, simulate a delay and load a sample mesh
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Sample public GLB URL for testing
      // Using a simple cube from the Three.js examples
      setMeshUrl(
        'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb'
      );

      // Sample background (gradient image placeholder)
      setBackgroundUrl(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={!hasPrompt || isGenerating}
      className="w-full py-3 px-4 text-sm font-semibold bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
    >
      {isGenerating ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating...
        </span>
      ) : (
        'Generate Scene'
      )}
    </button>
  );
}

// ============================================================================
// Load Sample Button
// ============================================================================

function LoadSampleButton() {
  const setMeshUrl = useComposerStore((state) => state.setMeshUrl);

  const sampleModels = [
    {
      name: 'Box',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb',
    },
    {
      name: 'Duck',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
    },
    {
      name: 'Avocado',
      url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Avocado/glTF-Binary/Avocado.glb',
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const loadSample = () => {
    const model = sampleModels[currentIndex];
    setMeshUrl(model.url);
    setCurrentIndex((currentIndex + 1) % sampleModels.length);
  };

  return (
    <button
      onClick={loadSample}
      className="w-full py-2 px-4 text-xs font-medium bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
    >
      Load Sample Model ({sampleModels[currentIndex].name})
    </button>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ComposerPage() {
  const handleSavePreset = (name: string) => {
    // TODO: Implement API call to save preset
    console.log('Save preset:', name);
    alert(`Preset "${name}" would be saved via API`);
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Scene Composer</h1>
            <p className="text-sm text-neutral-400">
              Design and preview 3D scene staging presets
            </p>
          </div>
          <a
            href="/"
            className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Controls */}
        <aside className="w-80 border-r border-neutral-800 overflow-y-auto">
          <div className="divide-y divide-neutral-800">
            <Section title="Prompt">
              <PromptInput />
              <div className="mt-4 space-y-2">
                <GenerateButton />
                <LoadSampleButton />
              </div>
            </Section>

            <Section title="Preset">
              <PresetSelector onSavePreset={handleSavePreset} />
            </Section>

            <Section title="Object">
              <ObjectControls />
            </Section>

            <Section title="Camera">
              <CameraControls />
            </Section>

            <Section title="Lighting">
              <LightingControls />
            </Section>
          </div>
        </aside>

        {/* Main Content - 3D Preview */}
        <main className="flex-1 p-4">
          <ScenePreview className="h-full" />
        </main>

        {/* Right Panel - Info (optional, could be expanded) */}
        <aside className="w-64 border-l border-neutral-800 p-4 hidden xl:block">
          <h3 className="text-sm font-semibold text-white mb-4">Scene Info</h3>
          <SceneInfoPanel />
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// Scene Info Panel
// ============================================================================

function SceneInfoPanel() {
  const object = useComposerStore((state) => state.object);
  const camera = useComposerStore((state) => state.camera);
  const lighting = useComposerStore((state) => state.lighting);
  const meshUrl = useComposerStore((state) => state.meshUrl);

  const formatVec3 = (v: { x: number; y: number; z: number }) =>
    `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;

  return (
    <div className="space-y-4 text-xs">
      <div>
        <div className="font-medium text-neutral-300 mb-1">Mesh</div>
        <div className="text-neutral-500 break-all">
          {meshUrl ? meshUrl.split('/').pop() : 'No mesh loaded'}
        </div>
      </div>

      <div>
        <div className="font-medium text-neutral-300 mb-1">Object</div>
        <div className="text-neutral-500 space-y-0.5">
          <div>Position: {formatVec3(object.position)}</div>
          <div>Scale: {object.scale.toFixed(2)}</div>
          <div>Rotation: {formatVec3(object.rotation)}</div>
        </div>
      </div>

      <div>
        <div className="font-medium text-neutral-300 mb-1">Camera</div>
        <div className="text-neutral-500 space-y-0.5">
          <div>Position: {formatVec3(camera.position)}</div>
          <div>Look At: {formatVec3(camera.lookAt)}</div>
          <div>FOV: {camera.fov}°</div>
        </div>
      </div>

      <div>
        <div className="font-medium text-neutral-300 mb-1">Lighting</div>
        <div className="text-neutral-500 space-y-0.5">
          <div>Preset: {lighting.preset}</div>
          <div>Intensity: {lighting.intensity.toFixed(2)}</div>
          <div className="flex items-center gap-2">
            Color:
            <span
              className="inline-block w-3 h-3 rounded border border-neutral-600"
              style={{ backgroundColor: lighting.color }}
            />
            {lighting.color}
          </div>
        </div>
      </div>

      {/* Export config button */}
      <button
        onClick={() => {
          const config = {
            object,
            camera,
            lighting,
          };
          navigator.clipboard.writeText(JSON.stringify(config, null, 2));
          alert('Config copied to clipboard!');
        }}
        className="w-full py-2 px-3 text-xs font-medium bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:bg-neutral-700 hover:text-white"
      >
        Copy Config JSON
      </button>
    </div>
  );
}
