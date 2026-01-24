import { create } from 'zustand';
import type { Vec3, LightingPreset, ScenePreset } from '@/types';
import { getDefaultPreset, getPreset } from '@/lib/presets';

// ============================================================================
// State Types
// ============================================================================

export type PromptMode = 'single' | 'split';

export interface ObjectState {
  position: Vec3;
  scale: number;
  rotation: Vec3;
}

export interface CameraState {
  position: Vec3;
  fov: number;
  lookAt: Vec3;
}

export interface LightingState {
  preset: LightingPreset;
  intensity: number;
  color: string;
}

export interface PromptState {
  mode: PromptMode;
  single: string;
  object: string;
  background: string;
}

export interface ComposerState {
  // Prompt inputs
  prompt: PromptState;

  // Scene configuration
  object: ObjectState;
  camera: CameraState;
  lighting: LightingState;

  // Preset management
  currentPresetId: string | null;
  isDirty: boolean;

  // UI state
  isGenerating: boolean;
  meshUrl: string | null;
  backgroundUrl: string | null;
}

export interface ComposerActions {
  // Prompt actions
  setPromptMode: (mode: PromptMode) => void;
  setSinglePrompt: (prompt: string) => void;
  setObjectPrompt: (prompt: string) => void;
  setBackgroundPrompt: (prompt: string) => void;

  // Object actions
  setObjectPosition: (position: Vec3) => void;
  setObjectScale: (scale: number) => void;
  setObjectRotation: (rotation: Vec3) => void;

  // Camera actions
  setCameraPosition: (position: Vec3) => void;
  setCameraFov: (fov: number) => void;
  setCameraLookAt: (lookAt: Vec3) => void;

  // Lighting actions
  setLightingPreset: (preset: LightingPreset) => void;
  setLightingIntensity: (intensity: number) => void;
  setLightingColor: (color: string) => void;

  // Preset actions
  loadPreset: (presetId: string) => void;
  applyPreset: (preset: ScenePreset) => void;
  resetToPreset: () => void;

  // Scene actions
  setMeshUrl: (url: string | null) => void;
  setBackgroundUrl: (url: string | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const defaultPreset = getDefaultPreset();

const initialState: ComposerState = {
  prompt: {
    mode: 'single',
    single: '',
    object: '',
    background: '',
  },
  object: {
    position: { ...defaultPreset.object.position },
    scale: defaultPreset.object.scale,
    rotation: { ...defaultPreset.object.rotation },
  },
  camera: {
    position: { ...defaultPreset.camera.position },
    fov: defaultPreset.camera.fov,
    lookAt: { ...defaultPreset.camera.lookAt },
  },
  lighting: {
    preset: defaultPreset.lighting.preset,
    intensity: defaultPreset.lighting.intensity ?? 1,
    color: defaultPreset.lighting.color ?? '#ffffff',
  },
  currentPresetId: defaultPreset.id,
  isDirty: false,
  isGenerating: false,
  meshUrl: null,
  backgroundUrl: null,
};

// ============================================================================
// Store
// ============================================================================

export const useComposerStore = create<ComposerState & ComposerActions>(
  (set, get) => ({
    ...initialState,

    // Prompt actions
    setPromptMode: (mode) =>
      set({ prompt: { ...get().prompt, mode } }),

    setSinglePrompt: (single) =>
      set({ prompt: { ...get().prompt, single } }),

    setObjectPrompt: (object) =>
      set({ prompt: { ...get().prompt, object } }),

    setBackgroundPrompt: (background) =>
      set({ prompt: { ...get().prompt, background } }),

    // Object actions
    setObjectPosition: (position) =>
      set({ object: { ...get().object, position }, isDirty: true }),

    setObjectScale: (scale) =>
      set({ object: { ...get().object, scale }, isDirty: true }),

    setObjectRotation: (rotation) =>
      set({ object: { ...get().object, rotation }, isDirty: true }),

    // Camera actions
    setCameraPosition: (position) =>
      set({ camera: { ...get().camera, position }, isDirty: true }),

    setCameraFov: (fov) =>
      set({ camera: { ...get().camera, fov }, isDirty: true }),

    setCameraLookAt: (lookAt) =>
      set({ camera: { ...get().camera, lookAt }, isDirty: true }),

    // Lighting actions
    setLightingPreset: (preset) =>
      set({ lighting: { ...get().lighting, preset }, isDirty: true }),

    setLightingIntensity: (intensity) =>
      set({ lighting: { ...get().lighting, intensity }, isDirty: true }),

    setLightingColor: (color) =>
      set({ lighting: { ...get().lighting, color }, isDirty: true }),

    // Preset actions
    loadPreset: (presetId) => {
      const preset = getPreset(presetId);
      if (preset) {
        get().applyPreset(preset);
      }
    },

    applyPreset: (preset) =>
      set({
        object: {
          position: { ...preset.object.position },
          scale: preset.object.scale,
          rotation: { ...preset.object.rotation },
        },
        camera: {
          position: { ...preset.camera.position },
          fov: preset.camera.fov,
          lookAt: { ...preset.camera.lookAt },
        },
        lighting: {
          preset: preset.lighting.preset,
          intensity: preset.lighting.intensity ?? 1,
          color: preset.lighting.color ?? '#ffffff',
        },
        currentPresetId: preset.id,
        isDirty: false,
      }),

    resetToPreset: () => {
      const { currentPresetId } = get();
      if (currentPresetId) {
        get().loadPreset(currentPresetId);
      }
    },

    // Scene actions
    setMeshUrl: (meshUrl) => set({ meshUrl }),
    setBackgroundUrl: (backgroundUrl) => set({ backgroundUrl }),
    setIsGenerating: (isGenerating) => set({ isGenerating }),

    // Reset
    reset: () => set(initialState),
  })
);

// ============================================================================
// Selectors
// ============================================================================

export const selectPrompt = (state: ComposerState) => state.prompt;
export const selectObject = (state: ComposerState) => state.object;
export const selectCamera = (state: ComposerState) => state.camera;
export const selectLighting = (state: ComposerState) => state.lighting;
export const selectCurrentPresetId = (state: ComposerState) =>
  state.currentPresetId;
export const selectIsDirty = (state: ComposerState) => state.isDirty;
export const selectIsGenerating = (state: ComposerState) => state.isGenerating;
export const selectMeshUrl = (state: ComposerState) => state.meshUrl;
export const selectBackgroundUrl = (state: ComposerState) =>
  state.backgroundUrl;
