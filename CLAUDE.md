# Project: 3D Scene Generator

> Internal API tool: Prompt to composed 3D scene images

---

## Project Overview

A **prompt-to-3D-scene asset generator** that creates composed images (2D background + textured 3D object) for use in t-shirt designs, NFTs, site assets, etc.

```
Prompt --> Background Image + 3D Mesh --> WebGL Scene --> Screenshot --> Asset
```

**API-first architecture** - no fancy UI needed except the Scene Composer for preset configuration.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 14+ (App Router) |
| **Language** | TypeScript (strict mode) |
| **3D Rendering** | Three.js + @react-three/fiber + drei |
| **State** | Zustand |
| **UI Components** | Radix UI / shadcn/ui |
| **Background Gen** | OpenAI DALL-E 3 API |
| **3D Model Gen** | Meshy API (text-to-3D) |
| **Storage** | Cloudflare R2 / Vercel Blob |
| **Package Manager** | pnpm |

---

## Quick Reference

```bash
# Install
pnpm install

# Dev server
pnpm dev

# Type check
pnpm typecheck

# Test
pnpm test

# Build
pnpm build
```

---

## Architecture

### Pipeline Flow

```
User Prompt
    |
    v
+-------------------+     +-------------------+
| Prompt Decomposer |     | (Skip if split    |
| (AI-powered)      | OR  |  prompts given)   |
+-------------------+     +-------------------+
    |
    +---> Object prompt ----> Meshy API ----> .glb mesh
    |
    +---> Background prompt --> DALL-E ----> background image
    |
    v
+-------------------+
| Three.js Scene    |
| - Load background |
| - Load mesh       |
| - Apply lighting  |
| - Position camera |
+-------------------+
    |
    v
+-------------------+
| Canvas Capture    |
| - PNG (2048x2048) |
| - WebP (800x800)  |
+-------------------+
    |
    v
+-------------------+
| Storage Upload    |
| - Return URLs     |
+-------------------+
```

### Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/
│   │   │   ├── route.ts          # POST: create job
│   │   │   └── [id]/route.ts     # GET: job status
│   │   └── presets/
│   │       ├── route.ts          # GET/POST presets
│   │       └── [id]/route.ts     # GET preset by ID
│   └── composer/
│       └── page.tsx              # Scene Composer UI
├── components/
│   └── composer/                 # Composer UI components
├── lib/
│   ├── meshy/
│   │   └── client.ts             # Meshy API client
│   ├── image-gen/
│   │   ├── background.ts         # Background generation
│   │   └── prompt-parser.ts      # Prompt decomposition
│   ├── scene/
│   │   ├── create-scene.ts       # Three.js scene setup
│   │   ├── lighting.ts           # Lighting presets
│   │   └── capture.ts            # Canvas capture
│   ├── pipeline/
│   │   └── generate-asset.ts     # Main orchestration
│   ├── presets/
│   │   └── index.ts              # Preset system
│   └── storage/
│       └── upload.ts             # Storage uploads
└── types/
    └── index.ts                  # Shared types
```

---

## API Endpoints

### Core

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Start generation job |
| `/api/generate/:id` | GET | Check job status |
| `/api/presets` | GET | List all presets |
| `/api/presets` | POST | Save new preset |
| `/api/presets/:id` | GET | Get preset config |

### Request Examples

```bash
# Single prompt (auto-decompose)
POST /api/generate
{ "prompt": "crystal dragon on misty mountain", "preset": "hero" }

# Split prompts (skip decomposer)
POST /api/generate
{
  "objectPrompt": "low-poly golden trophy",
  "backgroundPrompt": "solid dark blue gradient",
  "preset": "product"
}
```

---

## Key Types

```typescript
interface GenerateRequest {
  prompt?: string;           // Single prompt (decomposed by AI)
  objectPrompt?: string;     // Direct object prompt
  backgroundPrompt?: string; // Direct background prompt
  preset?: string;           // Preset ID
  overrides?: Partial<SceneConfig>;
}

interface ScenePreset {
  id: string;
  name: string;
  object: { position: Vec3; scale: number; rotation: Vec3 };
  camera: { position: Vec3; fov: number; lookAt: Vec3 };
  lighting: { preset: 'dramatic' | 'soft' | 'studio' };
}

interface GeneratedAsset {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  assets?: {
    full: string;   // 2048x2048 PNG
    web: string;    // 800x800 WebP
    thumb: string;  // 400x400 WebP
  };
  meshUrl?: string;
}
```

---

## Environment Variables

```bash
# Required
MESHY_API_KEY=           # Meshy API key
OPENAI_API_KEY=          # OpenAI API key (for DALL-E + prompt parsing)

# Storage (pick one)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Optional
STORAGE_PUBLIC_URL=      # Public URL prefix for assets
```

---

## External APIs

### Meshy API

- **Docs**: https://docs.meshy.ai
- **Endpoint**: `https://api.meshy.ai/v1/text-to-3d`
- **Flow**: Create task --> Poll status --> Download .glb
- **Note**: Subscription-based, no per-request cost tracking needed

### OpenAI DALL-E 3

- **Docs**: https://platform.openai.com/docs/guides/images
- **Model**: `dall-e-3`
- **Cost**: ~$0.04-0.08 per image

---

## Build Phases

### Phase 1: Core Services (3 Parallel Agents)

| Agent | Focus | Directory |
|-------|-------|-----------|
| Three.js | Scene + lighting + capture | `src/lib/scene/` |
| Meshy | API client + polling | `src/lib/meshy/` |
| ImageGen | Background + prompt parser | `src/lib/image-gen/` |

### Phase 2: Integration + UI (2 Parallel Agents)

| Agent | Focus | Directory |
|-------|-------|-----------|
| Pipeline | Orchestration + API routes | `src/lib/pipeline/`, `src/app/api/` |
| Composer | Scene Composer UI | `src/app/composer/`, `src/components/composer/` |

---

## Scene Composer UI

Visual tool for designing staging presets. Required because positioning 3D objects and setting camera angles is inherently visual work.

**Features:**
- Live 3D preview with OrbitControls
- Single vs Split prompt mode toggle
- Object controls (position, scale, rotation)
- Camera controls (distance, angle, height, FOV)
- Lighting presets + intensity/color
- Save/load presets

---

## Testing Guidelines

- Unit tests for utility functions
- Integration tests for API routes
- Visual regression for Scene Composer (optional)
- Manual testing for 3D rendering quality

---

## Agent Instructions

### Before Coding

1. Read this file + `CLAUDE-3d-scene-generator-primer.md` for full context
2. Check existing code patterns in the directory you're working in
3. Run `pnpm typecheck` to understand current state

### After Coding

1. `pnpm typecheck` - Zero errors
2. `pnpm test` - All tests pass
3. `pnpm lint:fix` - Auto-fix formatting

### Key Reminders

- **Meshy has NO 3D-to-Image API** - Use Three.js for composition
- **Meshy is subscription-based** - No cost tracking needed
- **Two prompt modes**: Single (AI decompose) or Split (direct)
- **Presets are essential** - API references presets by ID

---

## Architecture Gotchas

- **Three.js is client-only** - Never import `@/lib/scene/*` in API routes or server code. Causes "document is not defined" error.
- **DALL-E URLs expire** - Background URLs from OpenAI expire after ~1 hour. Always persist via `persistBackground()` before returning to client.
- **Meshy CDN URLs** - Similarly, persist meshes via `persistMesh()` for long-term storage.

---

## Session Continuity

- **NSL Pattern** - End sessions with `NEXT_SESSION_LOG_YYYY-MM-DD_HHMM_DESCRIPTION.md` documenting decisions, gotchas, and next priorities.
- **Get current date** - Run `date "+%Y-%m-%d_%H%M"` before creating NSL to ensure accurate timestamps.

---

## Testing Notes

- **agent-browser** - Installed globally for browser automation. Use `agent-browser snapshot -i` for element refs.
- **React input issue** - `agent-browser fill/type` may not trigger React state updates. Manual testing works as workaround.
- **Browser tests** - Run with `pnpm test:browser`. Tests in `src/test/browser/`.

---

*Last updated: 2026-01-25*
