/**
 * Orbit Controls Tests
 *
 * Tests for Three.js OrbitControls:
 * - Mouse drag to rotate camera
 * - Scroll to zoom
 * - Right-drag (shift+drag) to pan
 */

import { scenario, type TestScenario } from '../scenarios';

/**
 * Mouse drag to rotate camera test
 *
 * Note: OrbitControls are on the 3D canvas, not the sidebar controls.
 * We need to interact with the canvas area for these tests.
 */
const orbitRotateTest = scenario('Orbit Controls - Rotate')
  .description('Drag on 3D canvas to rotate camera view')
  .category('orbit')
  .tags('orbit', 'mouse', 'rotate')
  .open('/composer')
  .wait(500)
  .screenshot('orbit-rotate', 'before')
  // Drag on canvas area (center of screen, assuming ~1920x1080)
  // Canvas is in the center panel between left sidebar (320px) and right panel
  .drag(800, 400, 1000, 500, 'Drag to rotate camera')
  .wait(300)
  .screenshot('orbit-rotate', 'after-rotate-1')
  .drag(900, 450, 700, 350, 'Drag in opposite direction')
  .wait(300)
  .screenshot('orbit-rotate', 'after-rotate-2')
  .build();

/**
 * Scroll to zoom camera test
 */
const orbitZoomTest = scenario('Orbit Controls - Zoom')
  .description('Scroll on 3D canvas to zoom camera in/out')
  .category('orbit')
  .tags('orbit', 'mouse', 'zoom')
  .open('/composer')
  .wait(500)
  .screenshot('orbit-zoom', 'before')
  // Scroll down (zoom out) on canvas area
  .scroll(0, 500, 'Scroll to zoom out')
  .wait(300)
  .screenshot('orbit-zoom', 'after-zoom-out')
  // Scroll up (zoom in) on canvas area
  .scroll(0, -800, 'Scroll to zoom in')
  .wait(300)
  .screenshot('orbit-zoom', 'after-zoom-in')
  .build();

/**
 * Right-drag (shift+drag) to pan camera test
 *
 * Note: This typically requires shift key held while dragging
 * for OrbitControls pan functionality.
 */
const orbitPanTest = scenario('Orbit Controls - Pan')
  .description('Shift+drag on 3D canvas to pan camera')
  .category('orbit')
  .tags('orbit', 'mouse', 'pan')
  .open('/composer')
  .wait(500)
  .screenshot('orbit-pan', 'before')
  // Hold shift and drag (simulated by starting with shift press)
  .press('Shift', 'Hold shift for pan mode')
  .drag(800, 400, 900, 400, 'Shift+drag to pan right')
  .wait(300)
  .screenshot('orbit-pan', 'after-pan-right')
  .drag(850, 400, 750, 500, 'Shift+drag to pan left and down')
  .wait(300)
  .screenshot('orbit-pan', 'after-pan-left-down')
  .build();

/**
 * Combined orbit interaction test
 *
 * Tests a sequence of orbit controls to verify they work together.
 */
const orbitCombinedTest = scenario('Orbit Controls - Combined')
  .description('Test combination of rotate, zoom, and pan')
  .category('orbit')
  .tags('orbit', 'mouse', 'combined')
  .open('/composer')
  .wait(500)
  .screenshot('orbit-combined', 'initial')
  // Rotate
  .drag(800, 400, 950, 450, 'Rotate view')
  .wait(200)
  .screenshot('orbit-combined', 'after-rotate')
  // Zoom in
  .scroll(0, -400, 'Zoom in')
  .wait(200)
  .screenshot('orbit-combined', 'after-zoom-in')
  // Pan
  .press('Shift')
  .drag(850, 400, 750, 350, 'Pan view')
  .wait(200)
  .screenshot('orbit-combined', 'after-pan')
  // Zoom out
  .scroll(0, 300, 'Zoom out')
  .wait(200)
  .screenshot('orbit-combined', 'final')
  .build();

/**
 * Double-click to reset view test (if supported)
 */
const orbitResetTest = scenario('Orbit Controls - Double Click Reset')
  .description('Double-click on 3D canvas to reset camera view')
  .category('orbit')
  .tags('orbit', 'mouse', 'reset')
  .skip('OrbitControls may not support double-click reset by default')
  .open('/composer')
  .screenshot('orbit-reset', 'before')
  .build();

/**
 * All orbit tests
 */
export const orbitTests: TestScenario[] = [
  orbitRotateTest,
  orbitZoomTest,
  orbitPanTest,
  orbitCombinedTest,
  orbitResetTest,
];
