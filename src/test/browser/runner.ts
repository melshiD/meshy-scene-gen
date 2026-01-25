#!/usr/bin/env ts-node
/**
 * Browser Test Runner
 *
 * Executes test scenarios via agent-browser CLI and generates reports.
 *
 * Usage:
 *   npx ts-node src/test/browser/runner.ts
 *   npx ts-node src/test/browser/runner.ts --category controls
 *   npx ts-node src/test/browser/runner.ts --category visual --verbose
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import {
  screenshot,
  openUrl,
  click,
  type as typeText,
  fill,
  pressKey,
  scroll,
  drag,
  wait,
  getSnapshot,
  sliders,
  log,
  ensureScreenshotDir,
  type TestResult,
  type StepResult,
} from './utils';
import type {
  TestScenario,
  TestStep,
  TestCategory,
  TestRunConfig,
  TestRunSummary,
  StepAction,
  AssertCondition,
} from './scenarios';

// Import all test modules
import { controlsTests } from './tests/controls';
import { orbitTests } from './tests/orbit';
import { uiStateTests } from './tests/ui-state';
import { apiFlowTests } from './tests/api-flow';
import { loggingTests } from './tests/logging';

/**
 * All registered test scenarios
 */
const allScenarios: TestScenario[] = [
  ...controlsTests,
  ...orbitTests,
  ...uiStateTests,
  ...apiFlowTests,
  ...loggingTests,
];

/**
 * Parse command line arguments
 */
function parseArgs(): TestRunConfig {
  const args = process.argv.slice(2);
  const config: TestRunConfig = {
    screenshotOnError: true,
    screenshotOnSuccess: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--category':
      case '-c':
        config.categories = config.categories || [];
        config.categories.push(args[++i] as TestCategory);
        break;
      case '--tag':
      case '-t':
        config.tags = config.tags || [];
        config.tags.push(args[++i]);
        break;
      case '--include-skipped':
        config.includeSkipped = true;
        break;
      case '--include-todo':
        config.includeTodo = true;
        break;
      case '--screenshot-success':
        config.screenshotOnSuccess = true;
        break;
      case '--no-screenshot-error':
        config.screenshotOnError = false;
        break;
      case '--verbose':
      case '-v':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

function printHelp(): void {
  console.log(`
Browser Test Runner

Usage:
  npx ts-node src/test/browser/runner.ts [options]

Options:
  -c, --category <name>     Run only tests in this category (can repeat)
  -t, --tag <name>          Run only tests with this tag (can repeat)
  --include-skipped         Include skipped tests
  --include-todo            Include TODO tests
  --screenshot-success      Take screenshot on test success
  --no-screenshot-error     Don't take screenshot on error
  -v, --verbose             Verbose output
  -h, --help                Show this help

Categories:
  controls    - UI control tests (sliders, inputs)
  orbit       - OrbitControls interaction tests
  ui-state    - UI state and preset tests
  api         - API flow tests
  visual      - Visual regression tests
  error       - Error handling tests

Examples:
  npx ts-node src/test/browser/runner.ts
  npx ts-node src/test/browser/runner.ts --category controls
  npx ts-node src/test/browser/runner.ts -c controls -c orbit --verbose
`);
}

/**
 * Filter scenarios based on config
 */
function filterScenarios(
  scenarios: TestScenario[],
  config: TestRunConfig
): TestScenario[] {
  return scenarios.filter(scenario => {
    // Filter by status
    if (scenario.status === 'skip' && !config.includeSkipped) return false;
    if (scenario.status === 'todo' && !config.includeTodo) return false;

    // Filter by category
    if (config.categories && config.categories.length > 0) {
      if (!config.categories.includes(scenario.category)) return false;
    }

    // Filter by tags
    if (config.tags && config.tags.length > 0) {
      if (!scenario.tags || !scenario.tags.some(t => config.tags!.includes(t))) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Execute a single assertion
 */
async function executeAssertion(condition: AssertCondition): Promise<boolean> {
  const snapshot = getSnapshot();

  switch (condition.type) {
    case 'element-exists':
      return snapshot.includes(condition.pattern);

    case 'element-not-exists':
      return !snapshot.includes(condition.pattern);

    case 'element-selected':
      return snapshot.includes(`[ref=${condition.ref}]`) &&
        snapshot.includes('[selected]');

    case 'element-disabled':
      return snapshot.includes(`[ref=${condition.ref}]`) &&
        snapshot.includes('[disabled]');

    case 'element-enabled':
      return snapshot.includes(`[ref=${condition.ref}]`) &&
        !snapshot.includes('[disabled]');

    case 'text-visible':
      return snapshot.includes(`"${condition.text}"`);

    case 'snapshot-contains':
      return snapshot.includes(condition.pattern);

    case 'custom':
      return await condition.fn();

    default:
      return false;
  }
}

/**
 * Execute a single step action
 */
async function executeAction(action: StepAction): Promise<void> {
  switch (action.type) {
    case 'open':
      openUrl(action.url);
      await wait(1000); // Wait for page to load
      break;

    case 'click':
      click(action.ref);
      await wait(100);
      break;

    case 'type':
      typeText(action.ref, action.text);
      await wait(100);
      break;

    case 'fill':
      fill(action.ref, action.text);
      await wait(100);
      break;

    case 'press':
      pressKey(action.key);
      await wait(50);
      break;

    case 'wait':
      await wait(action.ms);
      break;

    case 'screenshot':
      screenshot(action.name, action.phase);
      break;

    case 'slider-increment':
      await sliders.increment(action.ref, action.steps);
      break;

    case 'slider-decrement':
      await sliders.decrement(action.ref, action.steps);
      break;

    case 'scroll':
      scroll(action.deltaX, action.deltaY);
      await wait(100);
      break;

    case 'drag':
      drag(action.startX, action.startY, action.endX, action.endY);
      await wait(100);
      break;

    case 'assert':
      const passed = await executeAssertion(action.condition);
      if (!passed) {
        throw new Error(`Assertion failed: ${JSON.stringify(action.condition)}`);
      }
      break;

    case 'custom':
      await action.fn();
      break;
  }
}

/**
 * Execute a single test step
 */
async function executeStep(step: TestStep, verbose: boolean): Promise<StepResult> {
  const startTime = Date.now();

  try {
    if (verbose) {
      log.step(step.name);
    }

    await executeAction(step.action);

    return {
      success: true,
      message: step.name,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: step.name,
      error: errorMessage,
    };
  }
}

/**
 * Execute a single test scenario
 */
async function executeScenario(
  scenario: TestScenario,
  config: TestRunConfig
): Promise<TestResult> {
  const startTime = Date.now();
  const stepResults: StepResult[] = [];
  const screenshots: string[] = [];
  let passed = true;

  log.test(scenario.name);

  if (scenario.status === 'skip') {
    log.skip(scenario.todoReason || 'Marked as skipped');
    return {
      name: scenario.name,
      category: scenario.category,
      passed: false,
      steps: [],
      duration: 0,
      screenshots: [],
    };
  }

  if (scenario.status === 'todo') {
    log.skip(`TODO: ${scenario.todoReason}`);
    return {
      name: scenario.name,
      category: scenario.category,
      passed: false,
      steps: [],
      duration: 0,
      screenshots: [],
    };
  }

  try {
    // Execute setup steps
    if (scenario.setup) {
      for (const step of scenario.setup) {
        const result = await executeStep(step, config.verbose || false);
        stepResults.push(result);
        if (!result.success && !step.optional) {
          passed = false;
          break;
        }
      }
    }

    // Execute main steps
    if (passed) {
      for (const step of scenario.steps) {
        const result = await executeStep(step, config.verbose || false);
        stepResults.push(result);

        // Capture screenshot path if this was a screenshot step
        if (step.action.type === 'screenshot' && result.success) {
          screenshots.push(result.message);
        }

        if (!result.success && !step.optional) {
          passed = false;

          // Take error screenshot
          if (config.screenshotOnError) {
            try {
              const errorScreenshot = screenshot(
                scenario.name.toLowerCase().replace(/\s+/g, '-'),
                'error'
              );
              screenshots.push(errorScreenshot);
            } catch {
              // Ignore screenshot errors
            }
          }
          break;
        }
      }
    }

    // Execute teardown steps (always run)
    if (scenario.teardown) {
      for (const step of scenario.teardown) {
        await executeStep(step, config.verbose || false);
      }
    }
  } catch (error) {
    passed = false;
    stepResults.push({
      success: false,
      message: 'Unexpected error',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const duration = Date.now() - startTime;

  if (passed) {
    log.pass(`PASSED (${duration}ms)`);

    // Take success screenshot if configured
    if (config.screenshotOnSuccess) {
      try {
        const successScreenshot = screenshot(
          scenario.name.toLowerCase().replace(/\s+/g, '-'),
          'success'
        );
        screenshots.push(successScreenshot);
      } catch {
        // Ignore screenshot errors
      }
    }
  } else {
    const failedStep = stepResults.find(r => !r.success);
    log.fail(`FAILED: ${failedStep?.error || 'Unknown error'}`);
  }

  return {
    name: scenario.name,
    category: scenario.category,
    passed,
    steps: stepResults,
    duration,
    screenshots,
  };
}

/**
 * Generate test report
 */
function generateReport(summary: TestRunSummary): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(60));
  lines.push('  BROWSER TEST REPORT');
  lines.push('═'.repeat(60));
  lines.push('');
  lines.push(`  Total:    ${summary.totalScenarios}`);
  lines.push(`  \x1b[32mPassed:   ${summary.passed}\x1b[0m`);
  lines.push(`  \x1b[31mFailed:   ${summary.failed}\x1b[0m`);
  lines.push(`  \x1b[33mSkipped:  ${summary.skipped}\x1b[0m`);
  lines.push(`  \x1b[33mTODO:     ${summary.todo}\x1b[0m`);
  lines.push(`  Duration: ${summary.duration}ms`);
  lines.push('');

  // Group by category
  const byCategory: Record<string, TestResult[]> = {};
  for (const result of summary.results) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  }

  for (const category in byCategory) {
    lines.push(`  [${category.toUpperCase()}]`);
    for (const result of byCategory[category]) {
      const status = result.passed ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
      lines.push(`    ${status} ${result.name}`);
    }
    lines.push('');
  }

  lines.push('═'.repeat(60));

  return lines.join('\n');
}

/**
 * Save report to file
 */
function saveReport(summary: TestRunSummary): void {
  const reportDir = path.join(process.cwd(), 'public', 'test-screenshots');
  ensureScreenshotDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `report-${timestamp}.json`);

  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: summary.totalScenarios,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      todo: summary.todo,
      duration: summary.duration,
    },
    results: summary.results.map(r => ({
      name: r.name,
      category: r.category,
      passed: r.passed,
      duration: r.duration,
      screenshots: r.screenshots,
      steps: r.steps.map(s => ({
        name: s.message,
        success: s.success,
        error: s.error,
      })),
    })),
  };

  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`\n  Report saved: ${reportPath}`);
}

/**
 * Check if agent-browser is available and connected
 */
function checkBrowserConnection(): boolean {
  try {
    const result = execSync('agent-browser snapshot -i', {
      encoding: 'utf-8',
      timeout: 5000,
      shell: 'cmd.exe',
    });
    return result.includes('[ref=');
  } catch {
    return false;
  }
}

/**
 * Main runner function
 */
async function run(): Promise<void> {
  const config = parseArgs();
  const startTime = Date.now();

  console.log('\n  Browser Test Runner');
  console.log('  ' + '─'.repeat(40));

  // Check if agent-browser is working
  console.log('\n  Checking browser connection...');
  if (!checkBrowserConnection()) {
    console.log(`
  \x1b[33m⚠ Browser connection not available\x1b[0m

  The agent-browser CLI requires Claude Code's terminal environment.

  To run these tests:
  1. Open the project in Claude Code
  2. Start the dev server: pnpm dev (on port 3001)
  3. Open the composer: agent-browser open http://localhost:3001/composer
  4. Ask Claude to "run the browser tests"

  Alternatively, copy the test commands and run them manually in Claude Code.
    `);
    process.exit(1);
  }
  console.log('  \x1b[32m✓\x1b[0m Browser connected\n');

  // Filter scenarios
  const scenarios = filterScenarios(allScenarios, config);

  if (scenarios.length === 0) {
    console.log('\n  No tests match the specified filters.');
    process.exit(0);
  }

  console.log(`\n  Running ${scenarios.length} test scenario(s)...`);

  // Count by status
  const activeCount = scenarios.filter(s => s.status === 'active').length;
  const skipCount = scenarios.filter(s => s.status === 'skip').length;
  const todoCount = scenarios.filter(s => s.status === 'todo').length;

  if (skipCount > 0 || todoCount > 0) {
    console.log(`  (${activeCount} active, ${skipCount} skipped, ${todoCount} TODO)`);
  }

  // Execute scenarios
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    const result = await executeScenario(scenario, config);
    results.push(result);

    if (scenario.status === 'active') {
      if (result.passed) passed++;
      else failed++;
    }
  }

  // Generate summary
  const summary: TestRunSummary = {
    totalScenarios: scenarios.length,
    passed,
    failed,
    skipped: skipCount,
    todo: todoCount,
    duration: Date.now() - startTime,
    results,
  };

  // Print report
  console.log(generateReport(summary));

  // Save report
  saveReport(summary);

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run if executed directly
run().catch(error => {
  console.error('Runner error:', error);
  process.exit(1);
});

export { run, executeScenario, filterScenarios };
