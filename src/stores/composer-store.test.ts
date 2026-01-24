import { describe, it, expect, beforeEach } from 'vitest';
import { useComposerStore, MAX_OBJECTS } from './composer-store';

describe('ComposerStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useComposerStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have default prompt state', () => {
      const state = useComposerStore.getState();
      expect(state.prompt.mode).toBe('single');
      expect(state.prompt.single).toBe('');
      expect(state.prompt.object).toBe('');
      expect(state.prompt.background).toBe('');
    });

    it('should have default object state from preset', () => {
      const state = useComposerStore.getState();
      expect(state.object.position).toEqual({ x: 0, y: 0, z: 0 });
      expect(state.object.scale).toBe(1);
    });

    it('should have default camera state from preset', () => {
      const state = useComposerStore.getState();
      expect(state.camera.fov).toBe(45);
      expect(state.camera.position).toEqual({ x: 0, y: 1, z: 4 });
    });

    it('should have default lighting state from preset', () => {
      const state = useComposerStore.getState();
      expect(state.lighting.preset).toBe('studio');
      expect(state.lighting.intensity).toBe(1);
    });

    it('should not be dirty initially', () => {
      const state = useComposerStore.getState();
      expect(state.isDirty).toBe(false);
    });
  });

  describe('prompt actions', () => {
    it('should update prompt mode', () => {
      useComposerStore.getState().setPromptMode('split');
      expect(useComposerStore.getState().prompt.mode).toBe('split');
    });

    it('should update single prompt', () => {
      useComposerStore.getState().setSinglePrompt('crystal dragon');
      expect(useComposerStore.getState().prompt.single).toBe('crystal dragon');
    });

    it('should update object prompt', () => {
      useComposerStore.getState().setObjectPrompt('golden trophy');
      expect(useComposerStore.getState().prompt.object).toBe('golden trophy');
    });

    it('should update background prompt', () => {
      useComposerStore.getState().setBackgroundPrompt('misty mountain');
      expect(useComposerStore.getState().prompt.background).toBe(
        'misty mountain'
      );
    });
  });

  describe('object actions', () => {
    it('should update object position and mark dirty', () => {
      useComposerStore.getState().setObjectPosition({ x: 1, y: 2, z: 3 });
      const state = useComposerStore.getState();
      expect(state.object.position).toEqual({ x: 1, y: 2, z: 3 });
      expect(state.isDirty).toBe(true);
    });

    it('should update object scale and mark dirty', () => {
      useComposerStore.getState().setObjectScale(2.5);
      const state = useComposerStore.getState();
      expect(state.object.scale).toBe(2.5);
      expect(state.isDirty).toBe(true);
    });

    it('should update object rotation and mark dirty', () => {
      useComposerStore.getState().setObjectRotation({ x: 0.5, y: 1, z: 0 });
      const state = useComposerStore.getState();
      expect(state.object.rotation).toEqual({ x: 0.5, y: 1, z: 0 });
      expect(state.isDirty).toBe(true);
    });
  });

  describe('camera actions', () => {
    it('should update camera position and mark dirty', () => {
      useComposerStore.getState().setCameraPosition({ x: 5, y: 3, z: 8 });
      const state = useComposerStore.getState();
      expect(state.camera.position).toEqual({ x: 5, y: 3, z: 8 });
      expect(state.isDirty).toBe(true);
    });

    it('should update camera FOV and mark dirty', () => {
      useComposerStore.getState().setCameraFov(60);
      const state = useComposerStore.getState();
      expect(state.camera.fov).toBe(60);
      expect(state.isDirty).toBe(true);
    });

    it('should update camera lookAt and mark dirty', () => {
      useComposerStore.getState().setCameraLookAt({ x: 0, y: 1, z: 0 });
      const state = useComposerStore.getState();
      expect(state.camera.lookAt).toEqual({ x: 0, y: 1, z: 0 });
      expect(state.isDirty).toBe(true);
    });
  });

  describe('lighting actions', () => {
    it('should update lighting preset and mark dirty', () => {
      useComposerStore.getState().setLightingPreset('dramatic');
      const state = useComposerStore.getState();
      expect(state.lighting.preset).toBe('dramatic');
      expect(state.isDirty).toBe(true);
    });

    it('should update lighting intensity and mark dirty', () => {
      useComposerStore.getState().setLightingIntensity(1.5);
      const state = useComposerStore.getState();
      expect(state.lighting.intensity).toBe(1.5);
      expect(state.isDirty).toBe(true);
    });

    it('should update lighting color and mark dirty', () => {
      useComposerStore.getState().setLightingColor('#ff0000');
      const state = useComposerStore.getState();
      expect(state.lighting.color).toBe('#ff0000');
      expect(state.isDirty).toBe(true);
    });
  });

  describe('preset actions', () => {
    it('should load a preset by ID', () => {
      useComposerStore.getState().loadPreset('hero');
      const state = useComposerStore.getState();
      expect(state.currentPresetId).toBe('hero');
      expect(state.object.scale).toBe(1.2);
      expect(state.lighting.preset).toBe('dramatic');
      expect(state.isDirty).toBe(false);
    });

    it('should reset to current preset', () => {
      // First load a preset
      useComposerStore.getState().loadPreset('product');

      // Make some changes
      useComposerStore.getState().setObjectScale(5);
      useComposerStore.getState().setLightingIntensity(10);

      // Verify dirty
      expect(useComposerStore.getState().isDirty).toBe(true);

      // Reset
      useComposerStore.getState().resetToPreset();

      // Verify reset to original values
      const state = useComposerStore.getState();
      expect(state.object.scale).toBe(1);
      expect(state.lighting.intensity).toBe(1);
      expect(state.isDirty).toBe(false);
    });

    it('should not crash when loading invalid preset', () => {
      useComposerStore.getState().loadPreset('nonexistent');
      // Should not throw, just no-op
      const state = useComposerStore.getState();
      expect(state.currentPresetId).toBe('product'); // Still default
    });
  });

  describe('scene actions', () => {
    it('should update mesh URL', () => {
      useComposerStore.getState().setMeshUrl('https://example.com/mesh.glb');
      expect(useComposerStore.getState().meshUrl).toBe(
        'https://example.com/mesh.glb'
      );
    });

    it('should update background URL', () => {
      useComposerStore.getState().setBackgroundUrl('https://example.com/bg.png');
      expect(useComposerStore.getState().backgroundUrl).toBe(
        'https://example.com/bg.png'
      );
    });

    it('should update isGenerating flag', () => {
      useComposerStore.getState().setIsGenerating(true);
      expect(useComposerStore.getState().isGenerating).toBe(true);

      useComposerStore.getState().setIsGenerating(false);
      expect(useComposerStore.getState().isGenerating).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Make various changes
      useComposerStore.getState().setSinglePrompt('test prompt');
      useComposerStore.getState().setObjectScale(3);
      useComposerStore.getState().setCameraFov(90);
      useComposerStore.getState().setLightingPreset('dramatic');
      useComposerStore.getState().setMeshUrl('https://example.com/mesh.glb');
      useComposerStore.getState().setIsGenerating(true);

      // Reset
      useComposerStore.getState().reset();

      // Verify all reset
      const state = useComposerStore.getState();
      expect(state.prompt.single).toBe('');
      expect(state.object.scale).toBe(1);
      expect(state.camera.fov).toBe(45);
      expect(state.lighting.preset).toBe('studio');
      expect(state.meshUrl).toBe(null);
      expect(state.isGenerating).toBe(false);
      expect(state.isDirty).toBe(false);
    });
  });

  // ==========================================================================
  // Multi-Object Tests
  // ==========================================================================

  describe('multi-object initial state', () => {
    it('should have one default object', () => {
      const state = useComposerStore.getState();
      expect(state.objects.length).toBe(1);
      expect(state.objects[0].name).toBe('Object 1');
    });

    it('should have selected object ID matching first object', () => {
      const state = useComposerStore.getState();
      expect(state.selectedObjectId).toBe(state.objects[0].id);
    });

    it('should sync legacy object state with selected object', () => {
      const state = useComposerStore.getState();
      const selectedObject = state.objects[0];
      expect(state.object.position).toEqual(selectedObject.position);
      expect(state.object.scale).toBe(selectedObject.scale);
      expect(state.object.rotation).toEqual(selectedObject.rotation);
    });
  });

  describe('addObject', () => {
    it('should add a new object with default name', () => {
      useComposerStore.getState().addObject();
      const state = useComposerStore.getState();
      expect(state.objects.length).toBe(2);
      expect(state.objects[1].name).toBe('Object 2');
    });

    it('should add a new object with custom name', () => {
      useComposerStore.getState().addObject('My Custom Object');
      const state = useComposerStore.getState();
      expect(state.objects[1].name).toBe('My Custom Object');
    });

    it('should select the newly added object', () => {
      useComposerStore.getState().addObject();
      const state = useComposerStore.getState();
      expect(state.selectedObjectId).toBe(state.objects[1].id);
    });

    it('should mark state as dirty', () => {
      useComposerStore.getState().addObject();
      expect(useComposerStore.getState().isDirty).toBe(true);
    });

    it('should not add more than MAX_OBJECTS', () => {
      for (let i = 0; i < MAX_OBJECTS + 2; i++) {
        useComposerStore.getState().addObject();
      }
      expect(useComposerStore.getState().objects.length).toBe(MAX_OBJECTS);
    });
  });

  describe('removeObject', () => {
    beforeEach(() => {
      useComposerStore.getState().addObject('Object 2');
      useComposerStore.getState().addObject('Object 3');
    });

    it('should remove the specified object', () => {
      const state = useComposerStore.getState();
      const objectToRemove = state.objects[1];
      useComposerStore.getState().removeObject(objectToRemove.id);

      const newState = useComposerStore.getState();
      expect(newState.objects.length).toBe(2);
      expect(newState.objects.find(o => o.id === objectToRemove.id)).toBeUndefined();
    });

    it('should select first object when selected object is removed', () => {
      const state = useComposerStore.getState();
      const selectedId = state.selectedObjectId;
      useComposerStore.getState().removeObject(selectedId!);

      const newState = useComposerStore.getState();
      expect(newState.selectedObjectId).toBe(newState.objects[0].id);
    });

    it('should not remove the last object', () => {
      useComposerStore.getState().reset();
      const state = useComposerStore.getState();
      useComposerStore.getState().removeObject(state.objects[0].id);
      expect(useComposerStore.getState().objects.length).toBe(1);
    });

    it('should mark state as dirty', () => {
      const state = useComposerStore.getState();
      useComposerStore.getState().removeObject(state.objects[1].id);
      expect(useComposerStore.getState().isDirty).toBe(true);
    });
  });

  describe('duplicateObject', () => {
    it('should create a copy of the specified object', () => {
      const state = useComposerStore.getState();
      const originalObject = state.objects[0];
      useComposerStore.getState().duplicateObject(originalObject.id);

      const newState = useComposerStore.getState();
      expect(newState.objects.length).toBe(2);
      expect(newState.objects[1].name).toBe(`${originalObject.name} (copy)`);
    });

    it('should offset the duplicated object position', () => {
      const state = useComposerStore.getState();
      const originalObject = state.objects[0];
      useComposerStore.getState().duplicateObject(originalObject.id);

      const newState = useComposerStore.getState();
      expect(newState.objects[1].position.x).toBe(originalObject.position.x + 0.5);
    });

    it('should select the duplicated object', () => {
      const state = useComposerStore.getState();
      useComposerStore.getState().duplicateObject(state.objects[0].id);

      const newState = useComposerStore.getState();
      expect(newState.selectedObjectId).toBe(newState.objects[1].id);
    });

    it('should not duplicate when at MAX_OBJECTS', () => {
      for (let i = 0; i < MAX_OBJECTS - 1; i++) {
        useComposerStore.getState().addObject();
      }
      const state = useComposerStore.getState();
      useComposerStore.getState().duplicateObject(state.objects[0].id);
      expect(useComposerStore.getState().objects.length).toBe(MAX_OBJECTS);
    });
  });

  describe('updateObject', () => {
    it('should update specified object properties', () => {
      const state = useComposerStore.getState();
      const objectId = state.objects[0].id;

      useComposerStore.getState().updateObject(objectId, {
        name: 'Updated Name',
        scale: 2.5,
      });

      const updatedObject = useComposerStore.getState().objects[0];
      expect(updatedObject.name).toBe('Updated Name');
      expect(updatedObject.scale).toBe(2.5);
    });

    it('should sync legacy object state when selected object is updated', () => {
      const state = useComposerStore.getState();
      useComposerStore.getState().updateObject(state.selectedObjectId!, {
        scale: 1.5,
      });

      expect(useComposerStore.getState().object.scale).toBe(1.5);
    });

    it('should mark state as dirty', () => {
      const state = useComposerStore.getState();
      useComposerStore.getState().updateObject(state.objects[0].id, { name: 'Test' });
      expect(useComposerStore.getState().isDirty).toBe(true);
    });
  });

  describe('selectObject', () => {
    beforeEach(() => {
      useComposerStore.getState().addObject('Object 2');
    });

    it('should select the specified object', () => {
      const state = useComposerStore.getState();
      const firstObjectId = state.objects[0].id;
      useComposerStore.getState().selectObject(firstObjectId);
      expect(useComposerStore.getState().selectedObjectId).toBe(firstObjectId);
    });

    it('should sync legacy object state with newly selected object', () => {
      const state = useComposerStore.getState();
      // Modify first object
      useComposerStore.getState().updateObject(state.objects[0].id, {
        scale: 2.0,
      });

      // Select second object
      useComposerStore.getState().selectObject(state.objects[1].id);

      // Legacy object state should reflect second object
      expect(useComposerStore.getState().object.scale).toBe(1); // Default scale
    });

    it('should not select non-existent object', () => {
      const state = useComposerStore.getState();
      const originalSelectedId = state.selectedObjectId;
      useComposerStore.getState().selectObject('non-existent-id');
      expect(useComposerStore.getState().selectedObjectId).toBe(originalSelectedId);
    });

    it('should allow selecting null', () => {
      useComposerStore.getState().selectObject(null);
      expect(useComposerStore.getState().selectedObjectId).toBe(null);
    });
  });

  describe('reorderObjects', () => {
    beforeEach(() => {
      useComposerStore.getState().addObject('Object 2');
      useComposerStore.getState().addObject('Object 3');
    });

    it('should move object from one index to another', () => {
      const state = useComposerStore.getState();
      const firstObjectId = state.objects[0].id;

      useComposerStore.getState().reorderObjects(0, 2);

      const newState = useComposerStore.getState();
      expect(newState.objects[2].id).toBe(firstObjectId);
    });

    it('should mark state as dirty', () => {
      useComposerStore.getState().reorderObjects(0, 1);
      expect(useComposerStore.getState().isDirty).toBe(true);
    });

    it('should not reorder with invalid indices', () => {
      const state = useComposerStore.getState();
      const originalOrder = state.objects.map(o => o.id);

      useComposerStore.getState().reorderObjects(-1, 1);
      useComposerStore.getState().reorderObjects(0, 10);

      const newOrder = useComposerStore.getState().objects.map(o => o.id);
      expect(newOrder).toEqual(originalOrder);
    });
  });

  describe('legacy object actions with multi-object', () => {
    it('setObjectPosition should update selected object', () => {
      const state = useComposerStore.getState();
      const selectedId = state.selectedObjectId!;

      useComposerStore.getState().setObjectPosition({ x: 1, y: 2, z: 3 });

      const selectedObject = useComposerStore.getState().objects.find(
        o => o.id === selectedId
      );
      expect(selectedObject?.position).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('setObjectScale should update selected object', () => {
      const state = useComposerStore.getState();
      const selectedId = state.selectedObjectId!;

      useComposerStore.getState().setObjectScale(2.0);

      const selectedObject = useComposerStore.getState().objects.find(
        o => o.id === selectedId
      );
      expect(selectedObject?.scale).toBe(2.0);
    });

    it('setObjectRotation should update selected object', () => {
      const state = useComposerStore.getState();
      const selectedId = state.selectedObjectId!;

      useComposerStore.getState().setObjectRotation({ x: 0.5, y: 1.0, z: 0 });

      const selectedObject = useComposerStore.getState().objects.find(
        o => o.id === selectedId
      );
      expect(selectedObject?.rotation).toEqual({ x: 0.5, y: 1.0, z: 0 });
    });
  });
});
