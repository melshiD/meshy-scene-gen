import { create } from 'zustand';
import type { Vec3, LightingPreset, ScenePreset, SceneObject } from '@/types';
import { createSceneObject } from '@/types';
import { getDefaultPreset, getPreset } from '@/lib/presets';

// ============================================================================
// Constants
// ============================================================================

export const MAX_OBJECTS = 5;

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

  // Multi-object scene configuration
  objects: SceneObject[];
  selectedObjectId: string | null;

  // Legacy single object (computed from selected)
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

  // Multi-object actions
  addObject: (name?: string) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  selectObject: (id: string | null) => void;
  reorderObjects: (fromIndex: number, toIndex: number) => void;

  // Legacy object actions (operate on selected object)
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

/** Generate unique ID for objects */
function generateObjectId(): string {
  return `obj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Create initial default object */
function createDefaultObject(name: string = 'Object 1'): SceneObject {
  return createSceneObject({
    id: generateObjectId(),
    name,
    position: { ...defaultPreset.object.position },
    scale: defaultPreset.object.scale,
    rotation: { ...defaultPreset.object.rotation },
  });
}

const defaultObject = createDefaultObject();

const initialState: ComposerState = {
  prompt: {
    mode: 'single',
    single: '',
    object: '',
    background: '',
  },
  // Multi-object state
  objects: [defaultObject],
  selectedObjectId: defaultObject.id,
  // Legacy single object state (computed from selected)
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

/** Helper to get the selected object from state */
function getSelectedObject(state: ComposerState): SceneObject | null {
  if (!state.selectedObjectId) return null;
  return state.objects.find((obj) => obj.id === state.selectedObjectId) ?? null;
}

/** Helper to sync legacy object state from selected object */
function syncLegacyObjectState(objects: SceneObject[], selectedId: string | null): ObjectState {
  const selected = objects.find((obj) => obj.id === selectedId);
  if (!selected) {
    return {
      position: { ...defaultPreset.object.position },
      scale: defaultPreset.object.scale,
      rotation: { ...defaultPreset.object.rotation },
    };
  }
  return {
    position: { ...selected.position },
    scale: selected.scale,
    rotation: { ...selected.rotation },
  };
}

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

    // Multi-object actions
    addObject: (name) => {
      const state = get();
      if (state.objects.length >= MAX_OBJECTS) return;

      const objectNumber = state.objects.length + 1;
      const newObject = createSceneObject({
        id: generateObjectId(),
        name: name ?? `Object ${objectNumber}`,
      });

      const newObjects = [...state.objects, newObject];
      set({
        objects: newObjects,
        selectedObjectId: newObject.id,
        object: syncLegacyObjectState(newObjects, newObject.id),
        isDirty: true,
      });
    },

    removeObject: (id) => {
      const state = get();
      if (state.objects.length <= 1) return; // Keep at least one object

      const newObjects = state.objects.filter((obj) => obj.id !== id);
      const newSelectedId =
        state.selectedObjectId === id
          ? newObjects[0]?.id ?? null
          : state.selectedObjectId;

      set({
        objects: newObjects,
        selectedObjectId: newSelectedId,
        object: syncLegacyObjectState(newObjects, newSelectedId),
        isDirty: true,
      });
    },

    duplicateObject: (id) => {
      const state = get();
      if (state.objects.length >= MAX_OBJECTS) return;

      const objectToDuplicate = state.objects.find((obj) => obj.id === id);
      if (!objectToDuplicate) return;

      const duplicatedObject = createSceneObject({
        ...objectToDuplicate,
        id: generateObjectId(),
        name: `${objectToDuplicate.name} (copy)`,
        // Offset position slightly
        position: {
          x: objectToDuplicate.position.x + 0.5,
          y: objectToDuplicate.position.y,
          z: objectToDuplicate.position.z,
        },
      });

      const index = state.objects.findIndex((obj) => obj.id === id);
      const newObjects = [
        ...state.objects.slice(0, index + 1),
        duplicatedObject,
        ...state.objects.slice(index + 1),
      ];

      set({
        objects: newObjects,
        selectedObjectId: duplicatedObject.id,
        object: syncLegacyObjectState(newObjects, duplicatedObject.id),
        isDirty: true,
      });
    },

    updateObject: (id, updates) => {
      const state = get();
      const newObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      );

      set({
        objects: newObjects,
        object: syncLegacyObjectState(newObjects, state.selectedObjectId),
        isDirty: true,
      });
    },

    selectObject: (id) => {
      const state = get();
      if (id !== null && !state.objects.find((obj) => obj.id === id)) return;

      set({
        selectedObjectId: id,
        object: syncLegacyObjectState(state.objects, id),
      });
    },

    reorderObjects: (fromIndex, toIndex) => {
      const state = get();
      if (
        fromIndex < 0 ||
        fromIndex >= state.objects.length ||
        toIndex < 0 ||
        toIndex >= state.objects.length
      ) {
        return;
      }

      const newObjects = [...state.objects];
      const [removed] = newObjects.splice(fromIndex, 1);
      newObjects.splice(toIndex, 0, removed);

      set({
        objects: newObjects,
        isDirty: true,
      });
    },

    // Legacy object actions (operate on selected object)
    setObjectPosition: (position) => {
      const state = get();
      if (!state.selectedObjectId) return;

      get().updateObject(state.selectedObjectId, { position });
    },

    setObjectScale: (scale) => {
      const state = get();
      if (!state.selectedObjectId) return;

      get().updateObject(state.selectedObjectId, { scale });
    },

    setObjectRotation: (rotation) => {
      const state = get();
      if (!state.selectedObjectId) return;

      get().updateObject(state.selectedObjectId, { rotation });
    },

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

    applyPreset: (preset) => {
      const state = get();
      // Update selected object with preset values
      const newObjects = state.objects.map((obj) =>
        obj.id === state.selectedObjectId
          ? {
              ...obj,
              position: { ...preset.object.position },
              scale: preset.object.scale,
              rotation: { ...preset.object.rotation },
            }
          : obj
      );

      set({
        objects: newObjects,
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
      });
    },

    resetToPreset: () => {
      const { currentPresetId } = get();
      if (currentPresetId) {
        get().loadPreset(currentPresetId);
      }
    },

    // Scene actions
    setMeshUrl: (meshUrl) => {
      const state = get();
      // Also update selected object's meshUrl
      if (state.selectedObjectId) {
        get().updateObject(state.selectedObjectId, { meshUrl });
      }
      set({ meshUrl });
    },

    setBackgroundUrl: (backgroundUrl) => set({ backgroundUrl }),
    setIsGenerating: (isGenerating) => set({ isGenerating }),

    // Reset
    reset: () => {
      const newDefaultObject = createDefaultObject();
      set({
        ...initialState,
        objects: [newDefaultObject],
        selectedObjectId: newDefaultObject.id,
      });
    },
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

// Multi-object selectors
export const selectObjects = (state: ComposerState) => state.objects;
export const selectSelectedObjectId = (state: ComposerState) =>
  state.selectedObjectId;
export const selectSelectedObject = (state: ComposerState): SceneObject | null => {
  if (!state.selectedObjectId) return null;
  return state.objects.find((obj) => obj.id === state.selectedObjectId) ?? null;
};
export const selectObjectCount = (state: ComposerState) => state.objects.length;
export const selectCanAddObject = (state: ComposerState) =>
  state.objects.length < MAX_OBJECTS;
export const selectCanRemoveObject = (state: ComposerState) =>
  state.objects.length > 1;
