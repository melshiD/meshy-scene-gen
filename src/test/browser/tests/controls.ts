/**
 * Control Tests
 *
 * Tests for UI controls: sliders, inputs, dropdowns.
 * Each test verifies that adjusting a control updates the 3D scene.
 */

import { scenario, ComposerElements as el, type TestScenario } from '../scenarios';

/**
 * Position slider tests (X, Y, Z)
 */
const positionXTest = scenario('Position X Slider')
  .description('Move position X slider and verify scene updates')
  .category('controls')
  .tags('slider', 'position', 'object')
  .open('/composer')
  .screenshot('position-x', 'before')
  .click(el.positionX, 'Focus position X slider')
  .incrementSlider(el.positionX, 10, 'Increase X position')
  .screenshot('position-x', 'after-increase')
  .decrementSlider(el.positionX, 20, 'Decrease X position (overshoot)')
  .screenshot('position-x', 'after-decrease')
  .build();

const positionYTest = scenario('Position Y Slider')
  .description('Move position Y slider and verify scene updates')
  .category('controls')
  .tags('slider', 'position', 'object')
  .open('/composer')
  .screenshot('position-y', 'before')
  .click(el.positionY, 'Focus position Y slider')
  .incrementSlider(el.positionY, 10, 'Increase Y position')
  .screenshot('position-y', 'after-increase')
  .decrementSlider(el.positionY, 20, 'Decrease Y position')
  .screenshot('position-y', 'after-decrease')
  .build();

const positionZTest = scenario('Position Z Slider')
  .description('Move position Z slider and verify scene updates')
  .category('controls')
  .tags('slider', 'position', 'object')
  .open('/composer')
  .screenshot('position-z', 'before')
  .click(el.positionZ, 'Focus position Z slider')
  .incrementSlider(el.positionZ, 10, 'Increase Z position')
  .screenshot('position-z', 'after-increase')
  .decrementSlider(el.positionZ, 20, 'Decrease Z position')
  .screenshot('position-z', 'after-decrease')
  .build();

/**
 * Scale slider test
 */
const scaleTest = scenario('Scale Slider')
  .description('Adjust scale slider and verify object size changes')
  .category('controls')
  .tags('slider', 'scale', 'object')
  .open('/composer')
  .screenshot('scale', 'before')
  .click(el.scale, 'Focus scale slider')
  .incrementSlider(el.scale, 15, 'Increase scale')
  .screenshot('scale', 'after-increase')
  .decrementSlider(el.scale, 30, 'Decrease scale')
  .screenshot('scale', 'after-decrease')
  .build();

/**
 * Rotation slider tests (X/Pitch, Y/Yaw, Z/Roll)
 */
const rotationXTest = scenario('Rotation X (Pitch) Slider')
  .description('Adjust rotation X slider and verify object rotates')
  .category('controls')
  .tags('slider', 'rotation', 'object')
  .open('/composer')
  .screenshot('rotation-x', 'before')
  .click(el.rotationX, 'Focus rotation X slider')
  .incrementSlider(el.rotationX, 20, 'Rotate forward (pitch up)')
  .screenshot('rotation-x', 'after-increase')
  .decrementSlider(el.rotationX, 40, 'Rotate backward (pitch down)')
  .screenshot('rotation-x', 'after-decrease')
  .build();

const rotationYTest = scenario('Rotation Y (Yaw) Slider')
  .description('Adjust rotation Y slider and verify object rotates')
  .category('controls')
  .tags('slider', 'rotation', 'object')
  .open('/composer')
  .screenshot('rotation-y', 'before')
  .click(el.rotationY, 'Focus rotation Y slider')
  .incrementSlider(el.rotationY, 20, 'Rotate right (yaw)')
  .screenshot('rotation-y', 'after-increase')
  .decrementSlider(el.rotationY, 40, 'Rotate left (yaw)')
  .screenshot('rotation-y', 'after-decrease')
  .build();

const rotationZTest = scenario('Rotation Z (Roll) Slider')
  .description('Adjust rotation Z slider and verify object rotates')
  .category('controls')
  .tags('slider', 'rotation', 'object')
  .open('/composer')
  .screenshot('rotation-z', 'before')
  .click(el.rotationZ, 'Focus rotation Z slider')
  .incrementSlider(el.rotationZ, 20, 'Roll clockwise')
  .screenshot('rotation-z', 'after-increase')
  .decrementSlider(el.rotationZ, 40, 'Roll counter-clockwise')
  .screenshot('rotation-z', 'after-decrease')
  .build();

/**
 * Camera distance test
 */
const cameraDistanceTest = scenario('Camera Distance Slider')
  .description('Adjust camera distance and verify view changes')
  .category('controls')
  .tags('slider', 'camera')
  .open('/composer')
  .screenshot('camera-distance', 'before')
  .click(el.cameraDistance, 'Focus camera distance slider')
  .incrementSlider(el.cameraDistance, 15, 'Move camera further')
  .screenshot('camera-distance', 'after-increase')
  .decrementSlider(el.cameraDistance, 30, 'Move camera closer')
  .screenshot('camera-distance', 'after-decrease')
  .build();

/**
 * Camera orbit angle test
 */
const cameraOrbitTest = scenario('Camera Orbit Angle Slider')
  .description('Adjust camera orbit angle and verify view rotates')
  .category('controls')
  .tags('slider', 'camera')
  .open('/composer')
  .screenshot('camera-orbit', 'before')
  .click(el.cameraOrbitAngle, 'Focus camera orbit angle slider')
  .incrementSlider(el.cameraOrbitAngle, 20, 'Orbit camera right')
  .screenshot('camera-orbit', 'after-increase')
  .decrementSlider(el.cameraOrbitAngle, 40, 'Orbit camera left')
  .screenshot('camera-orbit', 'after-decrease')
  .build();

/**
 * Camera height angle test
 */
const cameraHeightTest = scenario('Camera Height Angle Slider')
  .description('Adjust camera height angle and verify view changes')
  .category('controls')
  .tags('slider', 'camera')
  .open('/composer')
  .screenshot('camera-height', 'before')
  .click(el.cameraHeightAngle, 'Focus camera height angle slider')
  .incrementSlider(el.cameraHeightAngle, 10, 'Raise camera angle')
  .screenshot('camera-height', 'after-increase')
  .decrementSlider(el.cameraHeightAngle, 20, 'Lower camera angle')
  .screenshot('camera-height', 'after-decrease')
  .build();

/**
 * Camera FOV test
 */
const cameraFovTest = scenario('Camera FOV Slider')
  .description('Adjust camera FOV and verify perspective changes')
  .category('controls')
  .tags('slider', 'camera', 'fov')
  .open('/composer')
  .screenshot('camera-fov', 'before')
  .click(el.cameraFov, 'Focus camera FOV slider')
  .incrementSlider(el.cameraFov, 15, 'Increase FOV (wider view)')
  .screenshot('camera-fov', 'after-increase')
  .decrementSlider(el.cameraFov, 30, 'Decrease FOV (narrower view)')
  .screenshot('camera-fov', 'after-decrease')
  .build();

/**
 * Lighting intensity test
 */
const lightingIntensityTest = scenario('Lighting Intensity Slider')
  .description('Adjust lighting intensity and verify brightness changes')
  .category('controls')
  .tags('slider', 'lighting')
  .open('/composer')
  .screenshot('lighting-intensity', 'before')
  .click(el.lightingIntensity, 'Focus lighting intensity slider')
  .incrementSlider(el.lightingIntensity, 15, 'Increase brightness')
  .screenshot('lighting-intensity', 'after-increase')
  .decrementSlider(el.lightingIntensity, 30, 'Decrease brightness')
  .screenshot('lighting-intensity', 'after-decrease')
  .build();

/**
 * Lighting preset dropdown test
 */
const lightingPresetTest = scenario('Lighting Preset Dropdown')
  .description('Change lighting preset and verify lighting updates')
  .category('controls')
  .tags('dropdown', 'lighting', 'preset')
  .open('/composer')
  .screenshot('lighting-preset', 'initial-dramatic')
  .click(el.lightingPresetCombobox, 'Open lighting preset dropdown')
  .wait(200)
  .screenshot('lighting-preset', 'dropdown-open')
  .press('ArrowDown', 'Navigate to next preset')
  .press('Enter', 'Select preset')
  .wait(300)
  .screenshot('lighting-preset', 'after-change')
  .build();

/**
 * Light color quick button tests
 */
const lightColorButtonsTest = scenario('Light Color Quick Buttons')
  .description('Click color quick buttons and verify light color changes')
  .category('controls')
  .tags('button', 'lighting', 'color')
  .open('/composer')
  .screenshot('light-color', 'initial-white')
  .click(el.colorWarm, 'Select warm color')
  .wait(200)
  .screenshot('light-color', 'warm')
  .click(el.colorCool, 'Select cool color')
  .wait(200)
  .screenshot('light-color', 'cool')
  .click(el.colorOrange, 'Select orange color')
  .wait(200)
  .screenshot('light-color', 'orange')
  .click(el.colorBlue, 'Select blue color')
  .wait(200)
  .screenshot('light-color', 'blue')
  .click(el.colorWhite, 'Reset to white')
  .wait(200)
  .screenshot('light-color', 'reset-white')
  .build();

/**
 * Object name input test
 */
const objectNameTest = scenario('Object Name Input')
  .description('Edit object name and verify it updates')
  .category('controls')
  .tags('input', 'object', 'name')
  .open('/composer')
  .screenshot('object-name', 'before')
  .click(el.objectNameInput, 'Focus object name input')
  .fill(el.objectNameInput, 'Test Cube', 'Change object name')
  .press('Tab', 'Unfocus input')
  .screenshot('object-name', 'after')
  .assertSnapshotContains('Test Cube', 'Verify name updated')
  .build();

/**
 * Color hex input test
 */
const colorHexInputTest = scenario('Color Hex Input')
  .description('Enter hex color and verify light color changes')
  .category('controls')
  .tags('input', 'lighting', 'color')
  .open('/composer')
  .screenshot('color-hex', 'before')
  .click(el.colorHexInput, 'Focus color hex input')
  .fill(el.colorHexInput, '#ff0000', 'Enter red hex color')
  .press('Tab', 'Apply color')
  .wait(200)
  .screenshot('color-hex', 'red')
  .click(el.colorHexInput, 'Focus again')
  .fill(el.colorHexInput, '#00ff00', 'Enter green hex color')
  .press('Tab', 'Apply color')
  .wait(200)
  .screenshot('color-hex', 'green')
  .build();

/**
 * Look-at target sliders test
 */
const lookAtTest = scenario('Look-At Target Sliders')
  .description('Adjust look-at target and verify camera focus changes')
  .category('controls')
  .tags('slider', 'camera', 'lookAt')
  .open('/composer')
  .screenshot('look-at', 'before')
  .click(el.lookAtY, 'Focus look-at Y slider')
  .incrementSlider(el.lookAtY, 10, 'Look higher')
  .screenshot('look-at', 'look-up')
  .decrementSlider(el.lookAtY, 20, 'Look lower')
  .screenshot('look-at', 'look-down')
  .build();

/**
 * All control tests
 */
export const controlsTests: TestScenario[] = [
  // Position sliders
  positionXTest,
  positionYTest,
  positionZTest,

  // Scale slider
  scaleTest,

  // Rotation sliders
  rotationXTest,
  rotationYTest,
  rotationZTest,

  // Camera sliders
  cameraDistanceTest,
  cameraOrbitTest,
  cameraHeightTest,
  cameraFovTest,

  // Lighting controls
  lightingIntensityTest,
  lightingPresetTest,
  lightColorButtonsTest,

  // Input fields
  objectNameTest,
  colorHexInputTest,

  // Camera look-at
  lookAtTest,
];
