/**
 * Meshy API Client
 *
 * Text-to-3D mesh generation using the Meshy API.
 *
 * @example
 * ```typescript
 * import { createMeshTask, waitForMesh, getMeshUrl } from '@/lib/meshy';
 *
 * // Create and wait for mesh
 * const task = await createMeshTask({ prompt: 'a wooden treasure chest' });
 * const completedTask = await waitForMesh(task.id, {
 *   onProgress: (t) => console.log(`Progress: ${t.progress}%`),
 * });
 * const glbUrl = getMeshUrl(completedTask, 'glb');
 * ```
 */

export {
  // Core functions
  createMeshTask,
  waitForMesh,
  getMeshUrl,

  // Additional utilities
  getMeshTaskStatus,
  generateMesh,
  generateTexturedMesh,

  // Error handling
  MeshyError,

  // Types
  type CreateMeshTaskOptions,
  type WaitForMeshOptions,
  type GenerateTexturedMeshOptions,
  type MeshFormat,
  type MeshyErrorCode,
} from './client';
