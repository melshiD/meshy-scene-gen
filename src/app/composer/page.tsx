'use client';

import { useState, useCallback, useRef } from 'react';
import {
  ScenePreview,
  PromptInput,
  ObjectControls,
  CameraControls,
  LightingControls,
  PresetSelector,
} from '@/components/composer';
import type { ScenePreviewHandle } from '@/components/composer/ScenePreview';
import { useComposerStore } from '@/stores/composer-store';
import type { GenerationStage } from '@/stores/composer-store';
import {
  startGeneration,
  pollJobUntilComplete,
  getStageFromJobStatus,
  uploadCaptures,
  buildSceneConfigFromState,
  type JobStatusResponse,
  type SingleJobStatusResponse,
} from '@/lib/api/generate';

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
// Stage Labels
// ============================================================================

const STAGE_LABELS: Record<GenerationStage, string> = {
  idle: 'Generate Scene',
  starting: 'Starting...',
  decomposing: 'Decomposing prompt...',
  'generating-mesh': 'Generating 3D mesh...',
  'generating-background': 'Generating background...',
  composing: 'Composing scene...',
  completed: 'Completed',
  failed: 'Failed',
};

// ============================================================================
// Generate Button
// ============================================================================

interface GenerateButtonProps {
  scenePreviewRef: React.RefObject<ScenePreviewHandle>;
}

function GenerateButton({ scenePreviewRef }: GenerateButtonProps) {
  const prompt = useComposerStore((state) => state.prompt);
  const currentPresetId = useComposerStore((state) => state.currentPresetId);
  const isGenerating = useComposerStore((state) => state.isGenerating);
  const generation = useComposerStore((state) => state.generation);
  const setIsGenerating = useComposerStore((state) => state.setIsGenerating);
  const setMeshUrl = useComposerStore((state) => state.setMeshUrl);
  const setBackgroundUrl = useComposerStore((state) => state.setBackgroundUrl);
  const setGenerationProgress = useComposerStore(
    (state) => state.setGenerationProgress
  );
  const resetGeneration = useComposerStore((state) => state.resetGeneration);

  // Get scene state for building capture config
  const cameraState = useComposerStore((state) => state.camera);
  const lightingState = useComposerStore((state) => state.lighting);
  const objectState = useComposerStore((state) => state.object);
  const objectsState = useComposerStore((state) => state.objects);

  const hasPrompt =
    prompt.mode === 'single'
      ? prompt.single.trim().length > 0
      : prompt.object.trim().length > 0 || prompt.background.trim().length > 0;

  const handleGenerate = useCallback(async () => {
    if (!hasPrompt || isGenerating) return;

    setIsGenerating(true);
    setGenerationProgress({
      stage: 'starting',
      jobId: null,
      jobType: null,
      progress: 0,
      error: null,
      decomposedObjectPrompt: null,
      decomposedBackgroundPrompt: null,
    });

    try {
      // Build request based on prompt mode
      const request =
        prompt.mode === 'single'
          ? {
              prompt: prompt.single,
              preset: currentPresetId ?? undefined,
            }
          : {
              objectPrompt: prompt.object,
              backgroundPrompt: prompt.background,
              preset: currentPresetId ?? undefined,
            };

      // Start generation job
      const startResponse = await startGeneration(request);

      setGenerationProgress({
        jobId: startResponse.id,
        jobType: startResponse.type,
        stage: 'decomposing',
      });

      // Poll for completion
      const finalStatus = await pollJobUntilComplete(startResponse.id, {
        intervalMs: 2000,
        onProgress: (status: JobStatusResponse) => {
          const stage = getStageFromJobStatus(status);

          // Calculate progress percentage
          let progress = 0;
          if (status.type === 'multi') {
            progress = status.progress;
          } else {
            // Estimate progress for single-object jobs based on stage
            switch (stage) {
              case 'decomposing':
                progress = 10;
                break;
              case 'generating-mesh':
                progress = 30;
                break;
              case 'generating-background':
                progress = 60;
                break;
              case 'composing':
                progress = 90;
                break;
              case 'completed':
                progress = 100;
                break;
              default:
                progress = 0;
            }
          }

          // Extract decomposed prompts if available
          const singleStatus = status as SingleJobStatusResponse;
          setGenerationProgress({
            stage,
            progress,
            decomposedObjectPrompt: singleStatus.objectPrompt ?? null,
            decomposedBackgroundPrompt: singleStatus.backgroundPrompt ?? null,
          });
        },
      });

      // Handle completion or server-side ready (assets available but waiting for capture)
      const isComplete = finalStatus.status === 'completed';
      const isServerSideReady = finalStatus.type === 'single' &&
        (finalStatus as SingleJobStatusResponse).meshUrl &&
        (finalStatus as SingleJobStatusResponse).backgroundUrl;

      if (isComplete || isServerSideReady) {
        // Get the job ID for capture upload
        const jobId = finalStatus.id;

        if (finalStatus.type === 'single') {
          const singleStatus = finalStatus as SingleJobStatusResponse;
          setMeshUrl(singleStatus.meshUrl ?? null);
          if (singleStatus.backgroundUrl) {
            setBackgroundUrl(singleStatus.backgroundUrl);
          }
        } else {
          // For multi-object, get the first object's mesh
          const firstObject = finalStatus.objects[0];
          if (firstObject?.meshUrl) {
            setMeshUrl(firstObject.meshUrl);
          }
          if (finalStatus.background.url) {
            setBackgroundUrl(finalStatus.background.url);
          }
        }

        // Update stage to composing while we capture
        setGenerationProgress({ stage: 'composing', progress: 90 });

        // Wait for scene to render, then capture
        await new Promise((resolve) => setTimeout(resolve, 1500));

        try {
          if (scenePreviewRef.current) {
            console.log('[COMPOSER] Capturing scene...');
            const captures = await scenePreviewRef.current.capture();

            // Build scene config from current state
            const sceneConfig = buildSceneConfigFromState({
              camera: cameraState,
              lighting: lightingState,
              object: objectState,
              objects: objectsState,
            });

            console.log('[COMPOSER] Uploading captures with manifest...');
            const uploadResult = await uploadCaptures(
              jobId,
              {
                full: captures.full.dataUrl,
                web: captures.web.dataUrl,
                thumb: captures.thumb.dataUrl,
              },
              sceneConfig
            );

            console.log('[COMPOSER] Upload complete:', uploadResult);
            if (uploadResult.manifestUrl) {
              console.log('[COMPOSER] Manifest URL:', uploadResult.manifestUrl);
            }
          }
        } catch (captureError) {
          console.error('[COMPOSER] Capture/upload failed:', captureError);
          // Don't fail the whole generation, just log the error
        }

        setGenerationProgress({ stage: 'completed', progress: 100 });
      } else if (finalStatus.status === 'failed') {
        const errorMsg =
          finalStatus.type === 'single'
            ? finalStatus.error
            : finalStatus.objects.find((o) => o.error)?.error ||
              finalStatus.background.error ||
              'Generation failed';
        setGenerationProgress({
          stage: 'failed',
          error: errorMsg ?? 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationProgress({
        stage: 'failed',
        error: error instanceof Error ? error.message : 'Generation failed',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    hasPrompt,
    isGenerating,
    prompt,
    currentPresetId,
    setIsGenerating,
    setGenerationProgress,
    setMeshUrl,
    setBackgroundUrl,
    scenePreviewRef,
    cameraState,
    lightingState,
    objectState,
    objectsState,
  ]);

  const buttonLabel = isGenerating
    ? STAGE_LABELS[generation.stage]
    : 'Generate Scene';

  return (
    <div className="space-y-2">
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
            {buttonLabel}
          </span>
        ) : (
          'Generate Scene'
        )}
      </button>

      {/* Progress bar */}
      {isGenerating && generation.progress > 0 && (
        <div className="w-full bg-neutral-800 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${generation.progress}%` }}
          />
        </div>
      )}

      {/* Error message */}
      {generation.stage === 'failed' && generation.error && (
        <div className="flex items-start gap-2 p-2 bg-red-900/30 border border-red-800 rounded-lg">
          <svg
            className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-red-300 break-words">
              {generation.error}
            </p>
            <button
              onClick={resetGeneration}
              className="text-xs text-red-400 hover:text-red-300 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Decomposed Prompts Display
// ============================================================================

function DecomposedPromptsDisplay() {
  const prompt = useComposerStore((state) => state.prompt);
  const generation = useComposerStore((state) => state.generation);

  // Only show in single mode when we have decomposed prompts
  if (prompt.mode !== 'single') return null;
  if (
    !generation.decomposedObjectPrompt &&
    !generation.decomposedBackgroundPrompt
  )
    return null;

  return (
    <div className="p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
        <svg
          className="w-3.5 h-3.5 text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        AI Decomposition Result
      </div>

      {generation.decomposedObjectPrompt && (
        <div className="space-y-1">
          <div className="text-xs text-neutral-500">Object:</div>
          <div className="text-xs text-neutral-300 bg-neutral-800 p-2 rounded">
            {generation.decomposedObjectPrompt}
          </div>
        </div>
      )}

      {generation.decomposedBackgroundPrompt && (
        <div className="space-y-1">
          <div className="text-xs text-neutral-500">Background:</div>
          <div className="text-xs text-neutral-300 bg-neutral-800 p-2 rounded">
            {generation.decomposedBackgroundPrompt}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Load Sample Button
// ============================================================================

function LoadSampleButton() {
  const setMeshUrl = useComposerStore((state) => state.setMeshUrl);
  const setBackgroundUrl = useComposerStore((state) => state.setBackgroundUrl);

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

  // Saved scenes from previous generations
  const [savedScenes, setSavedScenes] = useState<Array<{
    id: string;
    name: string;
    prompt?: string;
    hasPrompt: boolean;
    meshUrl: string;
    backgroundUrl: string;
    createdAt: string;
  }>>([]);
  const [showSaved, setShowSaved] = useState(false);

  // Scan for saved scenes on mount
  useState(() => {
    fetch('/api/saved-scenes')
      .then((res) => res.ok ? res.json() : { scenes: [] })
      .then((data) => setSavedScenes(data.scenes || []))
      .catch(() => {});
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const loadSample = () => {
    const model = sampleModels[currentIndex];
    setMeshUrl(model.url);
    setCurrentIndex((currentIndex + 1) % sampleModels.length);
  };

  const loadSavedScene = (scene: { meshUrl: string; backgroundUrl: string }) => {
    setMeshUrl(scene.meshUrl);
    setBackgroundUrl(scene.backgroundUrl);
    setShowSaved(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={loadSample}
        className="w-full py-2 px-4 text-xs font-medium bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-300 hover:bg-neutral-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
      >
        Load Sample Model ({sampleModels[currentIndex].name})
      </button>

      {savedScenes.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="w-full py-2 px-4 text-xs font-medium bg-emerald-900/50 border border-emerald-700 rounded-lg text-emerald-300 hover:bg-emerald-800/50 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Load Saved Scene ({savedScenes.length} available)
          </button>

          {showSaved && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
              {savedScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => loadSavedScene(scene)}
                  className="w-full px-3 py-2 text-left hover:bg-neutral-800 border-b border-neutral-800 last:border-b-0"
                >
                  <div className={`text-sm truncate ${scene.hasPrompt ? 'text-neutral-200' : 'text-neutral-400 italic'}`}>
                    {scene.hasPrompt ? scene.name : `Scene from ${new Date(scene.createdAt).toLocaleDateString()}`}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-2">
                    <span>{new Date(scene.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!scene.hasPrompt && <span className="text-neutral-600">(no name saved)</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function ComposerPage() {
  const scenePreviewRef = useRef<ScenePreviewHandle>(null);

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
              <div className="mt-4 space-y-3">
                <GenerateButton scenePreviewRef={scenePreviewRef} />
                <DecomposedPromptsDisplay />
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
          <ScenePreview ref={scenePreviewRef} className="h-full" />
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
