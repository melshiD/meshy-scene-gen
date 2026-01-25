/**
 * Browser Test Scenarios
 *
 * Type definitions and scenario building utilities for browser automation tests.
 */

import type { TestResult, StepResult } from './utils';

/**
 * Test step types
 */
export type StepAction =
  | { type: 'open'; url: string }
  | { type: 'click'; ref: string }
  | { type: 'type'; ref: string; text: string }
  | { type: 'fill'; ref: string; text: string }
  | { type: 'press'; key: string }
  | { type: 'wait'; ms: number }
  | { type: 'screenshot'; name: string; phase: string }
  | { type: 'assert'; condition: AssertCondition }
  | { type: 'slider-increment'; ref: string; steps?: number }
  | { type: 'slider-decrement'; ref: string; steps?: number }
  | { type: 'scroll'; deltaX: number; deltaY: number }
  | { type: 'drag'; startX: number; startY: number; endX: number; endY: number }
  | { type: 'custom'; name: string; fn: () => Promise<void> };

/**
 * Assert conditions for verification
 */
export type AssertCondition =
  | { type: 'element-exists'; pattern: string }
  | { type: 'element-not-exists'; pattern: string }
  | { type: 'element-selected'; ref: string }
  | { type: 'element-disabled'; ref: string }
  | { type: 'element-enabled'; ref: string }
  | { type: 'text-visible'; text: string }
  | { type: 'snapshot-contains'; pattern: string }
  | { type: 'custom'; name: string; fn: () => Promise<boolean> };

/**
 * Test step with metadata
 */
export interface TestStep {
  name: string;
  action: StepAction;
  optional?: boolean;
  timeout?: number;
}

/**
 * Test categories
 */
export type TestCategory = 'controls' | 'api' | 'visual' | 'error' | 'orbit' | 'ui-state' | 'logging';

/**
 * Test scenario status
 */
export type ScenarioStatus = 'active' | 'skip' | 'todo';

/**
 * Complete test scenario definition
 */
export interface TestScenario {
  name: string;
  description: string;
  category: TestCategory;
  status: ScenarioStatus;
  todoReason?: string;
  setup?: TestStep[];
  steps: TestStep[];
  teardown?: TestStep[];
  tags?: string[];
}

/**
 * Test suite containing multiple scenarios
 */
export interface TestSuite {
  name: string;
  description: string;
  scenarios: TestScenario[];
}

/**
 * Test run configuration
 */
export interface TestRunConfig {
  categories?: TestCategory[];
  tags?: string[];
  includeSkipped?: boolean;
  includeTodo?: boolean;
  screenshotOnError?: boolean;
  screenshotOnSuccess?: boolean;
  verbose?: boolean;
  baseUrl?: string;
}

/**
 * Test run summary
 */
export interface TestRunSummary {
  totalScenarios: number;
  passed: number;
  failed: number;
  skipped: number;
  todo: number;
  duration: number;
  results: TestResult[];
}

/**
 * Builder for creating test scenarios
 */
export class ScenarioBuilder {
  private scenario: Partial<TestScenario> = {};
  private currentSteps: TestStep[] = [];

  static create(name: string): ScenarioBuilder {
    const builder = new ScenarioBuilder();
    builder.scenario.name = name;
    builder.scenario.status = 'active';
    return builder;
  }

  description(desc: string): this {
    this.scenario.description = desc;
    return this;
  }

  category(cat: TestCategory): this {
    this.scenario.category = cat;
    return this;
  }

  skip(reason?: string): this {
    this.scenario.status = 'skip';
    this.scenario.todoReason = reason;
    return this;
  }

  todo(reason: string): this {
    this.scenario.status = 'todo';
    this.scenario.todoReason = reason;
    return this;
  }

  tags(...tags: string[]): this {
    this.scenario.tags = tags;
    return this;
  }

  // Step builders
  open(url: string): this {
    this.currentSteps.push({
      name: `Open ${url}`,
      action: { type: 'open', url },
    });
    return this;
  }

  click(ref: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Click ${ref}`,
      action: { type: 'click', ref },
    });
    return this;
  }

  type(ref: string, text: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Type "${text}"`,
      action: { type: 'type', ref, text },
    });
    return this;
  }

  fill(ref: string, text: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Fill with "${text}"`,
      action: { type: 'fill', ref, text },
    });
    return this;
  }

  press(key: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Press ${key}`,
      action: { type: 'press', key },
    });
    return this;
  }

  wait(ms: number): this {
    this.currentSteps.push({
      name: `Wait ${ms}ms`,
      action: { type: 'wait', ms },
    });
    return this;
  }

  screenshot(testName: string, phase: string): this {
    this.currentSteps.push({
      name: `Screenshot: ${testName}-${phase}`,
      action: { type: 'screenshot', name: testName, phase },
    });
    return this;
  }

  incrementSlider(ref: string, steps = 1, name?: string): this {
    this.currentSteps.push({
      name: name || `Increment slider ${ref} by ${steps}`,
      action: { type: 'slider-increment', ref, steps },
    });
    return this;
  }

  decrementSlider(ref: string, steps = 1, name?: string): this {
    this.currentSteps.push({
      name: name || `Decrement slider ${ref} by ${steps}`,
      action: { type: 'slider-decrement', ref, steps },
    });
    return this;
  }

  scroll(deltaX: number, deltaY: number, name?: string): this {
    this.currentSteps.push({
      name: name || `Scroll (${deltaX}, ${deltaY})`,
      action: { type: 'scroll', deltaX, deltaY },
    });
    return this;
  }

  drag(startX: number, startY: number, endX: number, endY: number, name?: string): this {
    this.currentSteps.push({
      name: name || `Drag from (${startX},${startY}) to (${endX},${endY})`,
      action: { type: 'drag', startX, startY, endX, endY },
    });
    return this;
  }

  assertElementExists(pattern: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Assert element exists: ${pattern}`,
      action: {
        type: 'assert',
        condition: { type: 'element-exists', pattern },
      },
    });
    return this;
  }

  assertElementNotExists(pattern: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Assert element not exists: ${pattern}`,
      action: {
        type: 'assert',
        condition: { type: 'element-not-exists', pattern },
      },
    });
    return this;
  }

  assertTextVisible(text: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Assert text visible: ${text}`,
      action: {
        type: 'assert',
        condition: { type: 'text-visible', text },
      },
    });
    return this;
  }

  assertSnapshotContains(pattern: string, name?: string): this {
    this.currentSteps.push({
      name: name || `Assert snapshot contains: ${pattern}`,
      action: {
        type: 'assert',
        condition: { type: 'snapshot-contains', pattern },
      },
    });
    return this;
  }

  custom(name: string, fn: () => Promise<void>): this {
    this.currentSteps.push({
      name,
      action: { type: 'custom', name, fn },
    });
    return this;
  }

  build(): TestScenario {
    if (!this.scenario.name) {
      throw new Error('Scenario name is required');
    }
    if (!this.scenario.category) {
      throw new Error('Scenario category is required');
    }

    return {
      name: this.scenario.name,
      description: this.scenario.description || '',
      category: this.scenario.category,
      status: this.scenario.status || 'active',
      todoReason: this.scenario.todoReason,
      steps: this.currentSteps,
      tags: this.scenario.tags,
    };
  }
}

/**
 * Create a new scenario builder
 */
export function scenario(name: string): ScenarioBuilder {
  return ScenarioBuilder.create(name);
}

/**
 * Element reference map for the composer page
 *
 * IMPORTANT: Element refs are dynamic and depend on which sections are expanded/collapsed.
 * This mapping assumes ALL sections are expanded. If sections are collapsed, refs will differ.
 *
 * Updated: 2024-01-25 based on actual page structure with all sections expanded.
 */
export const ComposerElements = {
  // Navigation
  backLink: 'e1',

  // Prompt Section
  promptSection: 'e2',
  singlePromptTab: 'e3',
  splitPromptsTab: 'e4',
  promptInput: 'e5',
  generateButton: 'e6',
  loadSampleButton: 'e7',

  // Preset Section
  presetSection: 'e8',
  presetCombobox: 'e9',
  resetButton: 'e10',
  saveAsButton: 'e11',

  // Object Section (when expanded)
  objectSection: 'e12',
  objectNameInput: 'e13',
  positionX: 'e14',
  positionY: 'e15',
  positionZ: 'e16',
  scale: 'e17',
  rotationX: 'e18',
  rotationY: 'e19',
  rotationZ: 'e20',

  // Camera Section (when expanded)
  cameraSection: 'e21',
  cameraDistance: 'e22',
  cameraOrbitAngle: 'e23',
  cameraHeightAngle: 'e24',
  cameraFov: 'e25',
  lookAtX: 'e26',
  lookAtY: 'e27',
  lookAtZ: 'e28',

  // Lighting Section (when expanded)
  lightingSection: 'e29',
  lightingPresetCombobox: 'e30',
  lightingIntensity: 'e31',
  colorPickerInput: 'e32',
  colorHexInput: 'e33',
  colorWhite: 'e34',
  colorWarm: 'e35',
  colorCool: 'e36',
  colorOrange: 'e37',
  colorBlue: 'e38',

  // Other
  copyConfigButton: 'e39',
} as const;

export type ComposerElementKey = keyof typeof ComposerElements;
