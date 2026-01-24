/**
 * Meshy API Integration
 *
 * Text-to-3D mesh generation via Meshy.ai
 */

export {
  MeshyClient,
  createMeshyClient,
  createMeshyClientFromEnv,
  isTaskComplete,
  isTaskPending,
  getGlbUrl,
  type MeshyClientConfig,
  type CreateTaskOptions,
  type PollOptions,
  type MeshyError,
} from './client';
