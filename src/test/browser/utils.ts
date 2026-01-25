/**
 * Browser Test Utilities
 *
 * Helper functions for browser automation testing using agent-browser CLI.
 * Provides screenshot capture, wait helpers, and element state utilities.
 */

import { execSync, exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SCREENSHOT_DIR = path.join(process.cwd(), 'public', 'test-screenshots');
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_PORT = process.env.TEST_PORT || '3001';
const BASE_URL = `http://localhost:${DEFAULT_PORT}`;

/**
 * Format timestamp for screenshot filenames
 */
function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * Ensure screenshot directory exists
 */
export function ensureScreenshotDir(): void {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/**
 * Take a screenshot with timestamp
 *
 * @param testName - Name of the test (e.g., 'slider-test')
 * @param phase - Phase of the test (e.g., 'before', 'after', 'step1')
 * @returns Path to the saved screenshot
 *
 * @example
 * screenshot('position-slider', 'before')
 * // -> public/test-screenshots/position-slider-before-2024-01-25-103045.png
 */
export function screenshot(testName: string, phase: string): string {
  ensureScreenshotDir();
  const timestamp = formatTimestamp();
  const filename = `${testName}-${phase}-${timestamp}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  try {
    execSync(`agent-browser screenshot "${filepath}"`, {
      encoding: 'utf-8',
      timeout: DEFAULT_TIMEOUT,
      shell: 'cmd.exe',
    });
    console.log(`  Screenshot saved: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`  Failed to capture screenshot: ${error}`);
    throw error;
  }
}

/**
 * Execute an agent-browser command and return output
 */
export function browserCommand(command: string, timeout = DEFAULT_TIMEOUT): string {
  try {
    const result = execSync(`agent-browser ${command}`, {
      encoding: 'utf-8',
      timeout,
      shell: 'cmd.exe',
    });
    return result.trim();
  } catch (error) {
    const err = error as { message?: string; stderr?: string };
    throw new Error(`Browser command failed: ${err.message || err.stderr || 'Unknown error'}`);
  }
}

/**
 * Open a URL in the browser
 */
export function openUrl(urlPath: string): void {
  const fullUrl = urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}`;
  browserCommand(`open "${fullUrl}"`);
  console.log(`  Opened: ${fullUrl}`);
}

/**
 * Get current page snapshot (element tree)
 */
export function getSnapshot(): string {
  return browserCommand('snapshot -i');
}

/**
 * Click an element by reference
 */
export function click(ref: string): void {
  browserCommand(`click ${ref}`);
}

/**
 * Type text into an element
 */
export function type(ref: string, text: string): void {
  browserCommand(`type ${ref} "${text}"`);
}

/**
 * Fill an input field (clears first)
 */
export function fill(ref: string, text: string): void {
  browserCommand(`fill ${ref} "${text}"`);
}

/**
 * Press a key
 */
export function pressKey(key: string): void {
  browserCommand(`press ${key}`);
}

/**
 * Drag from one position to another (for sliders)
 */
export function drag(
  startX: number,
  startY: number,
  endX: number,
  endY: number
): void {
  browserCommand(`drag ${startX} ${startY} ${endX} ${endY}`);
}

/**
 * Scroll by delta
 */
export function scroll(deltaX: number, deltaY: number): void {
  browserCommand(`scroll ${deltaX} ${deltaY}`);
}

/**
 * Wait for a specified time (ms)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for an element to appear in snapshot
 */
export async function waitForElement(
  pattern: string,
  timeout = DEFAULT_TIMEOUT
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const snapshot = getSnapshot();
    if (snapshot.includes(pattern)) {
      return true;
    }
    await wait(500);
  }
  return false;
}

/**
 * Parse snapshot to extract element info
 */
export interface ElementInfo {
  type: string;
  text?: string;
  ref: string;
  selected?: boolean;
  disabled?: boolean;
  nth?: number;
}

export function parseSnapshot(snapshot: string): ElementInfo[] {
  const elements: ElementInfo[] = [];
  const lines = snapshot.split('\n');

  for (const line of lines) {
    const match = line.match(
      /- (\w+)\s*(?:"([^"]*)")?\s*\[ref=(\w+)\](?:\s*\[selected\])?(?:\s*\[disabled\])?(?:\s*\[nth=(\d+)\])?/
    );
    if (match) {
      elements.push({
        type: match[1],
        text: match[2],
        ref: match[3],
        selected: line.includes('[selected]'),
        disabled: line.includes('[disabled]'),
        nth: match[4] ? parseInt(match[4]) : undefined,
      });
    }
  }
  return elements;
}

/**
 * Find element by text content
 */
export function findElementByText(
  snapshot: string,
  text: string
): ElementInfo | undefined {
  const elements = parseSnapshot(snapshot);
  return elements.find(el => el.text === text);
}

/**
 * Find element by type and optional nth index
 */
export function findElementByType(
  snapshot: string,
  type: string,
  nth?: number
): ElementInfo | undefined {
  const elements = parseSnapshot(snapshot);
  if (nth !== undefined) {
    return elements.find(el => el.type === type && el.nth === nth);
  }
  return elements.find(el => el.type === type);
}

/**
 * Get all sliders from snapshot
 */
export function getSliders(snapshot: string): ElementInfo[] {
  return parseSnapshot(snapshot).filter(el => el.type === 'slider');
}

/**
 * Get all buttons from snapshot
 */
export function getButtons(snapshot: string): ElementInfo[] {
  return parseSnapshot(snapshot).filter(el => el.type === 'button');
}

/**
 * Result of a test step
 */
export interface StepResult {
  success: boolean;
  message: string;
  screenshot?: string;
  error?: string;
}

/**
 * Result of a complete test
 */
export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  steps: StepResult[];
  duration: number;
  screenshots: string[];
}

/**
 * Log utilities for test output
 */
export const log = {
  test: (name: string) => console.log(`\n  TEST: ${name}`),
  step: (message: string) => console.log(`    - ${message}`),
  pass: (message: string) => console.log(`    \x1b[32m  ${message}\x1b[0m`),
  fail: (message: string) => console.log(`    \x1b[31m  ${message}\x1b[0m`),
  skip: (message: string) => console.log(`    \x1b[33m  SKIP: ${message}\x1b[0m`),
  info: (message: string) => console.log(`    \x1b[36m  ${message}\x1b[0m`),
};

/**
 * Slider manipulation helpers
 */
export const sliders = {
  /**
   * Move a slider by clicking at a percentage position
   * Note: This is an approximation - actual slider behavior may vary
   */
  async setByPercentage(ref: string, percentage: number): Promise<void> {
    // For Radix sliders, we need to use keyboard controls
    click(ref);
    await wait(100);

    // Use arrow keys to adjust value
    // This is a simplified approach - real implementation would need
    // to calculate exact key presses based on slider range
    const direction = percentage > 50 ? 'ArrowRight' : 'ArrowLeft';
    const steps = Math.abs(percentage - 50) / 10;

    for (let i = 0; i < steps; i++) {
      pressKey(direction);
      await wait(50);
    }
  },

  /**
   * Increment slider value
   */
  async increment(ref: string, steps = 1): Promise<void> {
    click(ref);
    await wait(100);
    for (let i = 0; i < steps; i++) {
      pressKey('ArrowRight');
      await wait(50);
    }
  },

  /**
   * Decrement slider value
   */
  async decrement(ref: string, steps = 1): Promise<void> {
    click(ref);
    await wait(100);
    for (let i = 0; i < steps; i++) {
      pressKey('ArrowLeft');
      await wait(50);
    }
  },
};

/**
 * Get the base URL for tests
 */
export function getBaseUrl(): string {
  return BASE_URL;
}

/**
 * Clean up old screenshots (keep last N per test)
 */
export function cleanupScreenshots(keepLast = 5): void {
  if (!fs.existsSync(SCREENSHOT_DIR)) return;

  const files = fs.readdirSync(SCREENSHOT_DIR);
  const screenshotFiles = files.filter(f => f.endsWith('.png'));

  // Group by test name
  const byTest: Record<string, string[]> = {};
  for (const file of screenshotFiles) {
    const testName = file.split('-').slice(0, -3).join('-'); // Remove phase and timestamp
    if (!byTest[testName]) byTest[testName] = [];
    byTest[testName].push(file);
  }

  // Keep only the last N for each test
  for (const testName in byTest) {
    const testFiles = byTest[testName].sort().reverse();
    const toDelete = testFiles.slice(keepLast);
    for (const file of toDelete) {
      fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
    }
  }
}
