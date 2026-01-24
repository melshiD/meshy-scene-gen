import { describe, it, expect, beforeEach } from 'vitest';
import { useComposerStore } from './composer-store';

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
});
