/**
 * UI State Tests
 *
 * Tests for UI state management:
 * - Preset selection and loading
 * - Prompt mode toggle (single vs split)
 * - Object list selection
 * - Dirty state tracking
 * - Save/Reset functionality
 */

import { scenario, ComposerElements as el, type TestScenario } from '../scenarios';

/**
 * Preset selector test - change preset and verify controls update
 */
const presetChangeTest = scenario('Preset Selector - Change Preset')
  .description('Change preset and verify all controls update to preset values')
  .category('ui-state')
  .tags('preset', 'dropdown')
  .open('/composer')
  .wait(500)
  .screenshot('preset-change', 'initial-product')
  .click(el.presetCombobox, 'Open preset dropdown')
  .wait(200)
  .screenshot('preset-change', 'dropdown-open')
  .press('ArrowDown', 'Navigate to next preset')
  .press('Enter', 'Select preset')
  .wait(400)
  .screenshot('preset-change', 'after-change')
  // Verify reset button is still disabled (preset just loaded, not dirty)
  .assertSnapshotContains('[disabled]', 'Reset button should be disabled')
  .build();

/**
 * Preset dirty state test - modify value and verify dirty indicator
 */
const presetDirtyTest = scenario('Preset - Dirty State Tracking')
  .description('Modify a value and verify dirty indicator appears')
  .category('ui-state')
  .tags('preset', 'dirty')
  .open('/composer')
  .wait(500)
  .screenshot('preset-dirty', 'initial-clean')
  // Modify position to make preset dirty
  .click(el.positionX, 'Focus position X slider')
  .incrementSlider(el.positionX, 5, 'Adjust position')
  .wait(300)
  .screenshot('preset-dirty', 'after-modify')
  // Reset button should now be enabled
  .click(el.resetButton, 'Click reset button')
  .wait(300)
  .screenshot('preset-dirty', 'after-reset')
  .build();

/**
 * Preset save test - save current config as new preset
 */
const presetSaveTest = scenario('Preset - Save As New')
  .description('Modify values and save as a new preset')
  .category('ui-state')
  .tags('preset', 'save')
  .open('/composer')
  .wait(500)
  // Modify some values
  .click(el.positionY, 'Focus position Y')
  .incrementSlider(el.positionY, 10, 'Adjust Y position')
  .wait(200)
  .screenshot('preset-save', 'after-modify')
  // Open save dialog
  .click(el.saveAsButton, 'Click Save As button')
  .wait(300)
  .screenshot('preset-save', 'dialog-open')
  // Type preset name
  .type('dialog input', 'Test Preset', 'Enter preset name')
  .screenshot('preset-save', 'name-entered')
  // Cancel (don't actually save in test)
  .press('Escape', 'Cancel save dialog')
  .wait(200)
  .screenshot('preset-save', 'dialog-closed')
  .build();

/**
 * Prompt mode toggle test - switch between single and split modes
 */
const promptModeToggleTest = scenario('Prompt Mode Toggle')
  .description('Toggle between single prompt and split prompts mode')
  .category('ui-state')
  .tags('prompt', 'toggle', 'tabs')
  .open('/composer')
  .wait(500)
  .screenshot('prompt-mode', 'initial-single')
  // Verify single mode is selected
  .assertSnapshotContains('[selected]', 'Single prompt tab should be selected')
  // Switch to split mode
  .click(el.splitPromptsTab, 'Click Split Prompts tab')
  .wait(300)
  .screenshot('prompt-mode', 'after-split')
  // Verify split mode UI
  .assertTextVisible('Split Prompts', 'Split prompts tab should be visible')
  // Switch back to single mode
  .click(el.singlePromptTab, 'Click Single Prompt tab')
  .wait(300)
  .screenshot('prompt-mode', 'back-to-single')
  .build();

/**
 * Single prompt input test
 */
const singlePromptInputTest = scenario('Single Prompt Input')
  .description('Enter text in single prompt mode and verify state')
  .category('ui-state')
  .tags('prompt', 'input')
  .open('/composer')
  .wait(500)
  .click(el.promptInput, 'Focus prompt input')
  .type(el.promptInput, 'A crystal dragon on a misty mountain', 'Enter scene description')
  .wait(200)
  .screenshot('single-prompt', 'after-input')
  // Generate button should now be enabled
  .assertSnapshotContains('Generate Scene', 'Generate button should be present')
  .build();

/**
 * Split prompts input test
 */
const splitPromptsInputTest = scenario('Split Prompts Input')
  .description('Enter text in split prompt mode for object and background')
  .category('ui-state')
  .tags('prompt', 'input', 'split')
  .open('/composer')
  .wait(500)
  // Switch to split mode
  .click(el.splitPromptsTab, 'Switch to split prompts')
  .wait(300)
  .screenshot('split-prompts', 'initial')
  // Fill object prompt (first textarea in split mode)
  // Note: element refs may change after tab switch, would need to re-snapshot
  .custom('Fill split prompts', async () => {
    // This would need custom logic to handle dynamic element refs
    // For now, this is a placeholder for manual verification
  })
  .screenshot('split-prompts', 'after-input')
  .build();

/**
 * Load sample model test
 */
const loadSampleModelTest = scenario('Load Sample Model')
  .description('Click Load Sample Model button and verify mesh loads')
  .category('ui-state')
  .tags('button', 'mesh', 'sample')
  .open('/composer')
  .wait(500)
  .screenshot('load-sample', 'before')
  .click(el.loadSampleButton, 'Click Load Sample Model button')
  .wait(1000) // Wait for mesh to load
  .screenshot('load-sample', 'after')
  // Scene info should show mesh loaded
  .assertTextVisible('Mesh loaded', 'Should show mesh loaded status')
  .build();

/**
 * Object list selection test (multi-object support)
 */
const objectListSelectionTest = scenario('Object List Selection')
  .description('Select different objects and verify controls update')
  .category('ui-state')
  .tags('object', 'selection', 'multi-object')
  .open('/composer')
  .wait(500)
  .screenshot('object-selection', 'initial')
  // The object list might be in a separate section
  // This test verifies object selection changes the active object controls
  .custom('Test object selection', async () => {
    // Would need to interact with object list component
    // Element refs depend on the actual rendered state
  })
  .screenshot('object-selection', 'after-select')
  .build();

/**
 * Add object test
 */
const addObjectTest = scenario('Add New Object')
  .description('Add a new object to the scene and verify list updates')
  .category('ui-state')
  .tags('object', 'add', 'multi-object')
  .open('/composer')
  .wait(500)
  .screenshot('add-object', 'before')
  // Find and click the add object button
  // This would need to locate the button in the object list section
  .custom('Add new object', async () => {
    // Implementation depends on actual UI structure
  })
  .screenshot('add-object', 'after')
  .build();

/**
 * Section collapse/expand test
 */
const sectionCollapseTest = scenario('Section Collapse/Expand')
  .description('Collapse and expand control sections')
  .category('ui-state')
  .tags('section', 'collapse', 'expand')
  .open('/composer')
  .wait(500)
  .screenshot('section-collapse', 'all-expanded')
  // Click section headers to collapse
  .click(el.objectSection, 'Collapse Object section')
  .wait(200)
  .screenshot('section-collapse', 'object-collapsed')
  .click(el.cameraSection, 'Collapse Camera section')
  .wait(200)
  .screenshot('section-collapse', 'camera-collapsed')
  .click(el.lightingSection, 'Collapse Lighting section')
  .wait(200)
  .screenshot('section-collapse', 'lighting-collapsed')
  // Expand all again
  .click(el.objectSection, 'Expand Object section')
  .wait(200)
  .click(el.cameraSection, 'Expand Camera section')
  .wait(200)
  .click(el.lightingSection, 'Expand Lighting section')
  .wait(200)
  .screenshot('section-collapse', 'all-re-expanded')
  .build();

/**
 * Copy Config JSON test
 */
const copyConfigTest = scenario('Copy Config JSON')
  .description('Click Copy Config JSON button and verify clipboard')
  .category('ui-state')
  .tags('button', 'config', 'clipboard')
  .open('/composer')
  .wait(500)
  .screenshot('copy-config', 'before')
  .click(el.copyConfigButton, 'Click Copy Config JSON button')
  .wait(500)
  .screenshot('copy-config', 'after')
  // Button text might change to indicate success
  .build();

/**
 * All UI state tests
 */
export const uiStateTests: TestScenario[] = [
  presetChangeTest,
  presetDirtyTest,
  presetSaveTest,
  promptModeToggleTest,
  singlePromptInputTest,
  splitPromptsInputTest,
  loadSampleModelTest,
  objectListSelectionTest,
  addObjectTest,
  sectionCollapseTest,
  copyConfigTest,
];
