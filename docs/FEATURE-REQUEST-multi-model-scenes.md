# Feature Request: Multi-Model Scenes & Placement System

> Request for Scene Composer enhancements to support multiple 3D models with intelligent placement

---

## Overview

Extend the Scene Composer to support **multi-model compositions** (3-5 models per scene) with **placement heuristics** for automatic and manual arrangement.

---

## Feature 1: Multi-Model Support

### Requirements

1. **Model Count**: Support 3-5 models per scene (configurable max)
2. **Model Sources** (mix of):
   - Generate new via Meshy API (text-to-3D)
   - Select from existing model library/database
   - Upload custom .glb files
3. **Per-Model Controls**:
   - Individual position, scale, rotation
   - Visibility toggle
   - Lock/unlock for editing
   - Delete/duplicate

### Suggested Implementation

#### Type Changes (`src/types/index.ts`)

```typescript
/** Individual scene object */
export interface SceneObject {
  id: string;
  name: string;
  meshUrl: string | null;
  prompt?: string;  // If generated via Meshy
  position: Vec3;
  scale: number;
  rotation: Vec3;
  visible: boolean;
  locked: boolean;
}

/** Multi-object scene configuration */
export interface MultiObjectSceneConfig {
  objects: SceneObject[];
  maxObjects: number;  // Default 5
  background: {
    url: string | null;
    prompt?: string;
  };
  camera: CameraConfig;
  lighting: LightingConfig;
  layout: LayoutConfig;  // See Feature 2
}
```

#### Store Changes (`src/stores/composer-store.ts`)

- Replace single `object` state with `objects: SceneObject[]`
- Add actions:
  - `addObject(prompt?: string)` - Add new object (optionally with Meshy prompt)
  - `removeObject(id: string)`
  - `duplicateObject(id: string)`
  - `updateObject(id: string, changes: Partial<SceneObject>)`
  - `selectObject(id: string | null)` - For UI selection
  - `reorderObjects(fromIndex, toIndex)` - Drag reorder

#### UI Changes

- **Object List Panel**: Show all objects with thumbnails, drag to reorder
- **Add Object Button**: Opens modal to generate or select
- **Per-Object Inspector**: Controls for selected object
- **Multi-Select**: Shift+click to select multiple, transform together

---

## Feature 2: Placement Heuristics

### Layout Presets

Pre-configured arrangements users can apply:

| Preset | Description | Use Case |
|--------|-------------|----------|
| `centered` | Single object centered | Hero shots |
| `grid` | Even NxM grid | Product catalogs |
| `circular` | Objects in a circle | Showcases |
| `semicircle` | Arc arrangement | Displays |
| `pyramid` | Stacked arrangement | Trophy displays |
| `scattered` | Random with constraints | Natural scenes |
| `line` | Linear arrangement | Timelines |
| `cluster` | Grouped with variance | Collections |

### Auto-Arrange Algorithm

Intelligent placement based on:

1. **Object Sizes**: Normalize and space based on bounding boxes
2. **Visual Balance**: Larger objects toward center/back
3. **Overlap Prevention**: Minimum spacing between objects
4. **Ground Plane**: Align objects to common ground
5. **Focal Point**: Arrange around camera look-at target

```typescript
interface LayoutConfig {
  preset: LayoutPreset;
  spacing: number;      // Base spacing multiplier
  groundPlane: boolean; // Align to Y=0
  centerPoint: Vec3;    // Layout center
  radius: number;       // For circular layouts
  rows?: number;        // For grid
  cols?: number;        // For grid
  randomSeed?: number;  // For scattered
}

type LayoutPreset =
  | 'centered'
  | 'grid'
  | 'circular'
  | 'semicircle'
  | 'pyramid'
  | 'scattered'
  | 'line'
  | 'cluster'
  | 'custom';
```

### Manual Placement Tools

- **Grid Snapping**: Toggle snap-to-grid (configurable grid size)
- **Alignment Guides**: Show guides when objects align
- **Transform Gizmos**: Drag handles for position/rotation/scale
- **Keyboard Nudge**: Arrow keys for precise movement
- **Copy Transform**: Apply one object's transform to others

### Suggested Implementation

Create `src/lib/layout/`:

```
src/lib/layout/
├── index.ts           # Public exports
├── presets.ts         # Layout preset definitions
├── auto-arrange.ts    # Auto-arrangement algorithm
├── constraints.ts     # Spacing/overlap prevention
└── transforms.ts      # Transform utilities
```

---

## Feature 3: Wire Up Actual Generation

### Environment Setup

Create `.env.local`:

```bash
# Required for generation
MESHY_API_KEY=your_meshy_key
OPENAI_API_KEY=your_openai_key

# Optional: Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

### API Integration

1. **Generate Button** → Calls real APIs:
   - Parse prompt (if single mode) via OpenAI
   - Generate background via DALL-E
   - Generate each object via Meshy (parallel)

2. **Progress Tracking**:
   - Show per-object generation status
   - Cancel individual or all generations
   - Retry failed generations

3. **Model Library** (future):
   - Save generated models to DB
   - Browse/search saved models
   - Favorite/tag models

### Suggested API Route

```typescript
// POST /api/generate
{
  "backgroundPrompt": "misty forest clearing",
  "objects": [
    { "prompt": "crystal dragon", "artStyle": "realistic" },
    { "prompt": "treasure chest", "artStyle": "low-poly" }
  ],
  "preset": "scattered",
  "maxObjects": 3
}

// Response (polling endpoint)
{
  "jobId": "abc123",
  "status": "processing",
  "background": { "status": "completed", "url": "..." },
  "objects": [
    { "id": "obj1", "status": "completed", "meshUrl": "..." },
    { "id": "obj2", "status": "in_progress", "progress": 45 }
  ]
}
```

---

## Implementation Priority

### Phase 1: Multi-Model Foundation
1. Update types for multi-object scenes
2. Update store with object array management
3. Update ScenePreview to render multiple objects
4. Add object list UI panel
5. Wire up single object add/remove

### Phase 2: Placement System
1. Implement layout presets (grid, circular, line)
2. Add auto-arrange algorithm
3. Add spacing/ground plane constraints
4. UI for layout selection

### Phase 3: API Integration
1. Create `.env.local` template
2. Wire generate button to Meshy/DALL-E
3. Add progress tracking UI
4. Implement job polling

### Phase 4: Advanced Features
1. Manual placement tools (snapping, guides)
2. Transform gizmos in 3D view
3. Model library/database
4. Advanced layouts (scattered, cluster)

---

## Estimated Work

| Phase | Scope | Files |
|-------|-------|-------|
| Phase 1 | Multi-model foundation | 5-6 files |
| Phase 2 | Placement system | 4-5 files |
| Phase 3 | API integration | 3-4 files |
| Phase 4 | Advanced features | 6-8 files |

---

## Questions for Main Agent

1. Should model library use local storage, SQLite, or external DB?
2. Priority: Placement presets vs API integration first?
3. Should we add WebSocket for real-time generation progress?
4. Include export functionality (save scene as JSON)?

---

*Created: 2026-01-24*
*Status: Awaiting review*
