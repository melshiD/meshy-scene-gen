import * as THREE from 'three';
import type { CaptureOptions, ImageFormat } from '@/types';
import { CAPTURE_PRESETS } from '@/types';

/**
 * Captured image result
 */
export interface CaptureResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  format: ImageFormat;
}

/**
 * Multi-resolution capture results
 */
export interface MultiCaptureResult {
  full: CaptureResult;
  web: CaptureResult;
  thumb: CaptureResult;
}

/**
 * Get MIME type for image format
 */
function getMimeType(format: ImageFormat): string {
  const mimeTypes: Record<ImageFormat, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return mimeTypes[format];
}

/**
 * Convert canvas data URL to Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Capture a Three.js scene to an image
 *
 * @param renderer - The WebGL renderer
 * @param scene - The scene to capture
 * @param camera - The camera for the capture
 * @param options - Capture options (dimensions, format, quality)
 * @returns Promise resolving to capture result
 */
export async function captureScene(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: CaptureOptions
): Promise<CaptureResult> {
  const { width, height, format, quality } = options;

  // Store original renderer size
  const originalSize = new THREE.Vector2();
  renderer.getSize(originalSize);
  const originalPixelRatio = renderer.getPixelRatio();

  // Set renderer to capture size
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);

  // Update camera aspect ratio if perspective camera
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  // Render the scene
  renderer.render(scene, camera);

  // Get the canvas data
  const mimeType = getMimeType(format);
  const qualityValue = format === 'png' ? undefined : quality;
  const dataUrl = renderer.domElement.toDataURL(mimeType, qualityValue);

  // Restore original renderer size
  renderer.setSize(originalSize.x, originalSize.y);
  renderer.setPixelRatio(originalPixelRatio);

  // Restore camera aspect ratio
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.aspect = originalSize.x / originalSize.y;
    camera.updateProjectionMatrix();
  }

  // Convert to blob
  const blob = await dataUrlToBlob(dataUrl);

  return {
    dataUrl,
    blob,
    width,
    height,
    format,
  };
}

/**
 * Capture scene at multiple resolutions using standard presets
 *
 * @param renderer - The WebGL renderer
 * @param scene - The scene to capture
 * @param camera - The camera for the capture
 * @returns Promise resolving to captures at full, web, and thumb resolutions
 */
export async function captureMultiResolution(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): Promise<MultiCaptureResult> {
  // Capture at each resolution sequentially to avoid memory issues
  const full = await captureScene(renderer, scene, camera, CAPTURE_PRESETS.nft);
  const web = await captureScene(renderer, scene, camera, CAPTURE_PRESETS.web);
  const thumb = await captureScene(renderer, scene, camera, CAPTURE_PRESETS.thumb);

  return { full, web, thumb };
}

/**
 * Capture scene with a custom resolution
 *
 * @param renderer - The WebGL renderer
 * @param scene - The scene to capture
 * @param camera - The camera for the capture
 * @param width - Capture width in pixels
 * @param height - Capture height in pixels
 * @param format - Image format (defaults to 'png')
 * @param quality - Quality for jpeg/webp (0-1, defaults to 0.9)
 * @returns Promise resolving to capture result
 */
export async function captureAtResolution(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  width: number,
  height: number,
  format: ImageFormat = 'png',
  quality = 0.9
): Promise<CaptureResult> {
  return captureScene(renderer, scene, camera, {
    width,
    height,
    format,
    quality,
  });
}

/**
 * Download a capture result as a file
 *
 * @param capture - The capture result to download
 * @param filename - Filename without extension (extension added based on format)
 */
export function downloadCapture(capture: CaptureResult, filename: string): void {
  const extension = capture.format === 'jpeg' ? 'jpg' : capture.format;
  const fullFilename = `${filename}.${extension}`;

  const link = document.createElement('a');
  link.href = capture.dataUrl;
  link.download = fullFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get available capture presets
 */
export function getCapturePresets(): typeof CAPTURE_PRESETS {
  return CAPTURE_PRESETS;
}
