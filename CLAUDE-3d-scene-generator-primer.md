# First Primer: 3D Scene Generator

> A letter to Claude from the project owner

---

## Welcome, Claude

You're building a **prompt-to-3D-scene asset generator** as an **internal API tool**. This is not a product to sell right now - it's a capability I'll use across other projects (t-shirt designs, NFTs, site assets, etc.).

**Keep it simple: API-first, no fancy UI needed.**

```
Prompt → Background Image + 3D Mesh → WebGL Scene → Screenshot → Asset
```

The output is a composed image (2D background + textured 3D object) that I can use however I want.

---

## The Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER PROMPT                             │
│              "A crystal dragon on a misty mountain"             │
├─────────────────────────────────────────────────────────────────┤
│                              │                                  │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                  │
│     ┌─────────────────┐            ┌─────────────────┐          │
│     │  IMAGE GEN API  │            │    MESHY API    │          │
│     │  (Background)   │            │   (3D Object)   │          │
│     └────────┬────────┘            └────────┬────────┘          │
│              │                               │                  │
│              │  "misty mountain             │  "crystal dragon" │
│              │   landscape"                 │  → textured .glb  │
│              │                               │                  │
│              └───────────────┬───────────────┘                  │
│                              ▼                                  │
│                    ┌─────────────────┐                          │
│                    │   WEBGL SCENE   │                          │
│                    │   (Three.js)    │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │ CANVAS CAPTURE  │                          │
│                    │  (Screenshot)   │                          │
│                    └────────┬────────┘                          │
│                             │                                   │
│                             ▼                                   │
│                    ┌─────────────────┐                          │
│                    │  FINAL ASSET    │                          │
│                    │ (PNG/JPG/WebP)  │                          │
│                    └─────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Background generation | DALL-E / Midjourney API / Stable Diffusion |
| 3D object generation | Meshy API (text-to-3D) |
| 3D rendering | Three.js (WebGL) |
| Canvas capture | html2canvas or native canvas.toDataURL() |
| Output | PNG/JPG for web, high-res for NFT |

---

## Meshy API Integration

### ⚠️ RESEARCH TASK: Check for 3D-to-Image API

**Before building the Three.js composition layer, check if Meshy has added their "3D to Image" feature to the API.**

Meshy's web UI (meshy.ai/scene) has a powerful scene composition feature that:
- Lets you place 3D objects in a scene
- Set camera angles, lighting, environment
- Generate images using the 3D layout as a constraint
- Supports GPT mode (expressive) and Flux mode (consistent)

**As of January 2026, this is NOT in the public API** - only these endpoints exist:
- Text to 3D, Image to 3D, Multi Image to 3D
- Remesh, Rigging & Animation, Retexture
- Text to Image, Image to Image

**Research steps during build:**
1. Check https://docs.meshy.ai/en/api/changelog for new endpoints
2. Search for "3D to Image API" or "Scene API" in their docs
3. If still not available, consider contacting Meshy (enterprise inquiry)
4. If available → could replace our entire Three.js composition layer

**If NOT available:** Proceed with Three.js approach (which gives us full control anyway).

---

### What Meshy Does (Current API)

Meshy converts text prompts → textured 3D models (.glb/.gltf)

### API Flow

```typescript
// lib/meshy.ts
const MESHY_API = 'https://api.meshy.ai';

interface MeshyTask {
  id: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  model_url?: string;  // .glb download URL
  thumbnail_url?: string;
}

// 1. Create text-to-3D task
async function createMeshTask(prompt: string): Promise<string> {
  const response = await fetch(`${MESHY_API}/v1/text-to-3d`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      art_style: 'realistic', // or 'cartoon', 'low-poly', etc.
      negative_prompt: 'blurry, low quality',
    }),
  });

  const { id } = await response.json();
  return id;
}

// 2. Poll for completion
async function waitForMesh(taskId: string): Promise<MeshyTask> {
  while (true) {
    const response = await fetch(`${MESHY_API}/v1/text-to-3d/${taskId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MESHY_API_KEY}` },
    });

    const task: MeshyTask = await response.json();

    if (task.status === 'succeeded') return task;
    if (task.status === 'failed') throw new Error('Mesh generation failed');

    await sleep(5000); // Poll every 5 seconds
  }
}

// 3. Download the .glb
async function downloadMesh(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  return response.arrayBuffer();
}
```

### Meshy Note

Meshy runs on my subscription - no per-request costs. Just be mindful of rate limits and queue times.

---

## Prompt Decomposition

Split user prompt into background + object:

```typescript
// lib/prompt-parser.ts
interface DecomposedPrompt {
  object: string;      // What to generate in 3D
  background: string;  // Scene/environment for 2D
  mood: string;        // Lighting, atmosphere
  camera: string;      // Suggested camera angle
}

async function decomposePrompt(userPrompt: string): Promise<DecomposedPrompt> {
  const result = await ai.generate({
    instruction: `Decompose this prompt into components for a 3D scene.

    User prompt: "${userPrompt}"

    Extract:
    1. object: The main subject to render as 3D (noun + descriptors)
    2. background: The environment/scene (without the object)
    3. mood: Lighting and atmosphere (dramatic, soft, ethereal, etc.)
    4. camera: Suggested camera angle (front, low angle, aerial, etc.)

    Return JSON only.`,
  });

  return JSON.parse(result);
}

// Example:
// Input: "A crystal dragon on a misty mountain"
// Output: {
//   object: "crystal dragon, translucent, iridescent scales",
//   background: "misty mountain peaks, fog, dramatic cliffs",
//   mood: "ethereal, soft diffused light, mysterious",
//   camera: "low angle, looking up at subject"
// }
```

---

## Background Generation

```typescript
// lib/background.ts
async function generateBackground(
  prompt: DecomposedPrompt,
  dimensions: { width: number; height: number }
): Promise<string> {
  // Combine background + mood for image gen
  const imagePrompt = `${prompt.background}, ${prompt.mood},
    cinematic lighting, high quality,
    empty center for 3D object placement,
    ${prompt.camera} perspective`;

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: imagePrompt,
    size: `${dimensions.width}x${dimensions.height}`,
    quality: 'hd',
  });

  return response.data[0].url;
}
```

---

## WebGL Scene Composition

```typescript
// lib/scene.ts
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface SceneConfig {
  backgroundUrl: string;
  meshUrl: string;
  cameraPosition: THREE.Vector3;
  lightingPreset: 'dramatic' | 'soft' | 'studio';
  objectScale: number;
  objectRotation: THREE.Euler;
}

async function createScene(config: SceneConfig): Promise<THREE.Scene> {
  const scene = new THREE.Scene();

  // 1. Load background as texture on plane (or skybox)
  const bgTexture = await loadTexture(config.backgroundUrl);
  scene.background = bgTexture;

  // 2. Load 3D mesh from Meshy
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(config.meshUrl);
  const mesh = gltf.scene;

  // 3. Position and scale the object
  mesh.scale.setScalar(config.objectScale);
  mesh.rotation.copy(config.objectRotation);
  mesh.position.set(0, 0, 0); // Center

  scene.add(mesh);

  // 4. Lighting
  addLighting(scene, config.lightingPreset);

  return scene;
}

function addLighting(scene: THREE.Scene, preset: string) {
  switch (preset) {
    case 'dramatic':
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
      keyLight.position.set(5, 10, 5);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x8888ff, 0.5);
      rimLight.position.set(-5, 5, -5);
      scene.add(rimLight);
      break;

    case 'soft':
      const ambient = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambient);

      const fill = new THREE.DirectionalLight(0xffffff, 0.4);
      fill.position.set(-2, 4, 2);
      scene.add(fill);
      break;

    case 'studio':
      // Three-point lighting
      const key = new THREE.DirectionalLight(0xffffff, 1);
      key.position.set(5, 5, 5);

      const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
      fillLight.position.set(-5, 3, 0);

      const back = new THREE.DirectionalLight(0xffffff, 0.3);
      back.position.set(0, 5, -5);

      scene.add(key, fillLight, back);
      break;
  }
}
```

---

## Canvas Capture

```typescript
// lib/capture.ts
interface CaptureOptions {
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0-1 for jpeg/webp
}

async function captureScene(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: CaptureOptions
): Promise<Blob> {
  // Set render size
  renderer.setSize(options.width, options.height);

  // Render the scene
  renderer.render(scene, camera);

  // Capture canvas
  const canvas = renderer.domElement;

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob!),
      `image/${options.format}`,
      options.quality
    );
  });
}

// For NFT-quality output
const NFT_OPTIONS: CaptureOptions = {
  width: 2048,
  height: 2048,
  format: 'png',
  quality: 1,
};

// For web thumbnails
const WEB_OPTIONS: CaptureOptions = {
  width: 800,
  height: 800,
  format: 'webp',
  quality: 0.85,
};
```

---

## Full Pipeline

```typescript
// lib/pipeline.ts
interface GeneratedAsset {
  id: string;
  prompt: string;
  imageUrl: string;
  thumbnailUrl: string;
  meshUrl: string;
  metadata: {
    dimensions: { width: number; height: number };
    generatedAt: Date;
  };
}

async function generateAsset(userPrompt: string): Promise<GeneratedAsset> {
  const id = generateId();

  // 1. Decompose prompt
  const decomposed = await decomposePrompt(userPrompt);

  // 2. Generate background + 3D mesh in parallel
  const [backgroundUrl, meshTask] = await Promise.all([
    generateBackground(decomposed, { width: 2048, height: 2048 }),
    createMeshTask(decomposed.object),
  ]);

  // 3. Wait for mesh completion
  const mesh = await waitForMesh(meshTask);

  // 4. Create WebGL scene
  const scene = await createScene({
    backgroundUrl,
    meshUrl: mesh.model_url!,
    cameraPosition: new THREE.Vector3(0, 2, 5),
    lightingPreset: decomposed.mood.includes('dramatic') ? 'dramatic' : 'soft',
    objectScale: 1,
    objectRotation: new THREE.Euler(0, 0, 0),
  });

  // 5. Render and capture
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 0, 0);

  const [fullImage, thumbnail] = await Promise.all([
    captureScene(renderer, scene, camera, NFT_OPTIONS),
    captureScene(renderer, scene, camera, WEB_OPTIONS),
  ]);

  // 6. Upload to storage
  const imageUrl = await uploadToStorage(fullImage, `${id}-full.png`);
  const thumbnailUrl = await uploadToStorage(thumbnail, `${id}-thumb.webp`);

  return {
    id,
    prompt: userPrompt,
    imageUrl,
    thumbnailUrl,
    meshUrl: mesh.model_url!,
    metadata: {
      dimensions: { width: 2048, height: 2048 },
      generatedAt: new Date(),
    },
  };
}
```

---

## UI: Scene Composer (Required)

You **need** a visual UI to design staging defaults. Positioning 3D objects, setting camera angles, and configuring lighting is inherently visual work - you can't just guess at coordinates.

### What the Composer Does

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Scene Composer                                            [Save Preset] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PROMPT MODE: (•) Single  ( ) Split                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Single: [crystal dragon on misty mountain___________________]     │  │
│  │   - OR -                                                          │  │
│  │ Object: [crystal dragon_____________________________________]     │  │
│  │ Background: [misty mountain peaks, fog, dramatic lighting___]     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │                                     │  │ OBJECT CONTROLS          │  │
│  │                                     │  │ ─────────────────        │  │
│  │     [Live 3D Preview Canvas]        │  │ Position X: [____]       │  │
│  │                                     │  │ Position Y: [____]       │  │
│  │   (drag to rotate, scroll to zoom)  │  │ Position Z: [____]       │  │
│  │                                     │  │ Scale:      [____]       │  │
│  │                                     │  │ Rotation Y: [____]       │  │
│  └─────────────────────────────────────┘  │                          │  │
│                                           │ CAMERA                   │  │
│  Presets: [product] [hero] [icon] [+]     │ ─────────────────        │  │
│                                           │ Distance:   [____]       │  │
│  Load sample: [Dragon ▼] [Load]           │ Angle:      [____]       │  │
│                                           │ Height:     [____]       │  │
│                                           │                          │  │
│                                           │ LIGHTING                 │  │
│                                           │ ─────────────────        │  │
│                                           │ Preset: [dramatic ▼]     │  │
│                                           │ Intensity:  [========]   │  │
│                                           │ Color:      [#ffffff]    │  │
│                                           └──────────────────────────┘  │
│                                                                         │
│  [Generate Scene]                                    Status: Ready      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Prompt Modes

| Mode | When to Use | What Happens |
|------|-------------|--------------|
| **Single** | Quick generation, let AI decide split | Prompt → AI decomposer → object + background |
| **Split** | You know exactly what you want | Skip decomposer, use your prompts directly |

**Single mode example:**
```
"A crystal dragon on a misty mountain"
  → AI splits into:
    - Object: "crystal dragon, translucent, iridescent scales"
    - Background: "misty mountain peaks, fog, dramatic cliffs"
```

**Split mode example:**
```
Object: "low-poly golden trophy, game asset style"
Background: "solid dark blue gradient, studio lighting"
  → Used directly, no AI interpretation
```

### Why Split Mode Matters

Sometimes the AI decomposer:
- Adds unwanted style words you didn't ask for
- Misinterprets which part is object vs background
- Over-describes when you want simple/minimal

Split mode gives you full control when you need it.

---

### Why the Composer Is Essential

| Problem | Without Composer | With Composer |
|---------|------------------|---------------|
| Object floating wrong | Guess Z offset, regenerate, repeat | Drag to position, see result instantly |
| Bad camera angle | Trial and error via API | Orbit camera in real-time |
| Lighting doesn't match mood | Hardcode values, hope for best | Tweak sliders, see preview |
| Reusing good setups | Copy-paste config manually | Save as preset, use via API |

---

### Preset System

Presets are saved configurations that the API can reference:

```typescript
// lib/presets.ts
interface ScenePreset {
  id: string;
  name: string;
  description: string;
  object: {
    position: { x: number; y: number; z: number };
    scale: number;
    rotation: { x: number; y: number; z: number };
  };
  camera: {
    position: { x: number; y: number; z: number };
    fov: number;
    lookAt: { x: number; y: number; z: number };
  };
  lighting: {
    preset: 'dramatic' | 'soft' | 'studio' | 'custom';
    customLights?: LightConfig[];
  };
}

// Example presets
const PRESETS: ScenePreset[] = [
  {
    id: 'product',
    name: 'Product Shot',
    description: 'Clean, centered, studio lighting',
    object: { position: { x: 0, y: 0, z: 0 }, scale: 1, rotation: { x: 0, y: 0.3, z: 0 } },
    camera: { position: { x: 0, y: 1, z: 4 }, fov: 45, lookAt: { x: 0, y: 0, z: 0 } },
    lighting: { preset: 'studio' },
  },
  {
    id: 'hero',
    name: 'Hero Image',
    description: 'Dramatic angle, low and looking up',
    object: { position: { x: 0, y: 0, z: 0 }, scale: 1.2, rotation: { x: 0, y: -0.2, z: 0 } },
    camera: { position: { x: -2, y: -0.5, z: 3 }, fov: 50, lookAt: { x: 0, y: 0.5, z: 0 } },
    lighting: { preset: 'dramatic' },
  },
  {
    id: 'icon',
    name: 'Icon/Logo',
    description: 'Top-down, flat, even lighting',
    object: { position: { x: 0, y: 0, z: 0 }, scale: 0.8, rotation: { x: 0.5, y: 0, z: 0 } },
    camera: { position: { x: 0, y: 3, z: 0.5 }, fov: 35, lookAt: { x: 0, y: 0, z: 0 } },
    lighting: { preset: 'soft' },
  },
];
```

### API Usage with Presets

```bash
# Single prompt mode (auto-decompose)
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "crystal dragon on misty mountain",
    "preset": "hero"
  }'

# Split prompt mode (skip decomposer)
curl -X POST http://localhost:3000/api/generate \
  -d '{
    "objectPrompt": "low-poly golden trophy",
    "backgroundPrompt": "solid dark blue gradient",
    "preset": "product"
  }'

# With custom overrides
curl -X POST http://localhost:3000/api/generate \
  -d '{
    "prompt": "golden chalice",
    "preset": "product",
    "overrides": {
      "camera": { "position": { "y": 0.5 } },
      "lighting": { "preset": "dramatic" }
    }
  }'
```

### Composer Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js (same as API) |
| 3D Controls | Three.js + OrbitControls |
| UI Components | Radix UI or shadcn/ui |
| State | Zustand (scene state) |
| Preset Storage | JSON file or DB |

---

## API Endpoints (Core)

```typescript
// The only endpoints you really need:
POST /api/generate          // prompt → asset URL
GET  /api/generate/:id      // check status, get result

// Optional extras:
POST /api/generate/batch    // multiple prompts at once
GET  /api/assets            // list what you've generated
```

### Usage Example

```bash
# Generate an asset
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "crystal dragon on misty mountain"}'

# Response:
{
  "id": "gen_abc123",
  "status": "processing"
}

# Poll for result
curl http://localhost:3000/api/generate/gen_abc123

# Response when done:
{
  "id": "gen_abc123",
  "status": "completed",
  "assets": {
    "full": "https://storage.../gen_abc123-2048.png",
    "web": "https://storage.../gen_abc123-800.webp",
    "thumb": "https://storage.../gen_abc123-400.webp"
  },
  "mesh": "https://storage.../gen_abc123.glb"
}
```

---

## Cost Notes

- **Meshy**: Subscription-based (no per-request cost)
- **Image Gen**: Per-request (DALL-E ~$0.04-0.08/image, varies by provider)
- **Storage**: Minimal (pennies per GB)

No need for complex cost tracking - Meshy is the expensive part and it's already covered by subscription. Just count generations if you want to track usage.

---

## Output Formats

| Use Case | Format | Dimensions | Notes |
|----------|--------|------------|-------|
| NFT | PNG | 2048x2048+ | Lossless, high detail |
| Website hero | WebP | 1200x800 | Compressed, fast load |
| Thumbnail | WebP | 400x400 | Gallery preview |
| Social share | JPG | 1200x630 | OG image dimensions |

---

## Parallel Agent Strategy

Two phases: core services in parallel, then integration + UI.

### Phase 1: Core Build (3 Parallel Agents)

**⚠️ HUMAN ACTION: Open 3 terminals**

```powershell
# From project root
git worktree add ..\scene-threejs -b feature/threejs
git worktree add ..\scene-meshy -b feature/meshy-api
git worktree add ..\scene-imagegen -b feature/image-gen
```

| Terminal | Worktree | Agent Mission |
|----------|----------|---------------|
| 1 | `scene-threejs` | Three.js scene + canvas capture |
| 2 | `scene-meshy` | Meshy API integration |
| 3 | `scene-imagegen` | Image gen + prompt parsing |

**Agent 1 prompt:**
```
"You are the Three.js Agent. Build:
1. Scene setup with lighting presets (dramatic, soft, studio)
2. GLTFLoader for .glb meshes from Meshy
3. Background texture loading
4. Canvas capture → PNG/WebP at multiple resolutions
5. Export: createScene(), renderToImage()

Work in: src/lib/scene/"
```

**Agent 2 prompt:**
```
"You are the Meshy API Agent. Build:
1. Meshy API client (create task, poll status, get model URL)
2. Error handling and retries
3. Note: Meshy is subscription-based, no per-request cost tracking needed
4. Export: createMeshTask(), waitForMesh(), getMeshUrl()

Work in: src/lib/meshy/"
```

**Agent 3 prompt:**
```
"You are the Image Generation Agent. Build:
1. Prompt decomposition (split user prompt into object + background)
   - This is OPTIONAL - user can provide split prompts to skip this step
2. Background generation via DALL-E or Stability
3. Export: decomposePrompt(), generateBackground()

Work in: src/lib/image-gen/"
```

**Merge point:** When all 3 complete, merge to main.

---

### Phase 2: Pipeline + API + UI (2 Parallel Agents)

**⚠️ HUMAN ACTION: Open 2 terminals**

```powershell
git worktree add ..\scene-pipeline -b feature/pipeline
git worktree add ..\scene-composer -b feature/composer-ui
```

| Terminal | Worktree | Agent Mission |
|----------|----------|---------------|
| 1 | `scene-pipeline` | Core pipeline + API routes |
| 2 | `scene-composer` | Scene Composer UI |

**Pipeline Agent prompt:**
```
"You are the Pipeline Agent. Build:
1. Main generateAsset() function that:
   - Accepts EITHER single prompt (auto-decompose) OR split prompts (object + background)
   - Runs image gen + mesh gen in parallel
   - Composes Three.js scene using preset config
   - Captures to PNG/WebP at multiple sizes
   - Uploads to storage
   - Returns asset URLs

2. Preset system (load/save scene configurations)

3. API routes:
   - POST /api/generate → job ID (accepts prompt OR objectPrompt+backgroundPrompt)
   - GET /api/generate/:id → status + asset URLs
   - GET /api/presets → list presets
   - POST /api/presets → save new preset
   - GET /api/presets/:id → get preset config

Work in: src/lib/pipeline/ and src/app/api/
Integrate all modules from Phase 1."
```

**Scene Composer Agent prompt:**
```
"You are the Scene Composer UI Agent. Build:

1. Live 3D preview using Three.js + OrbitControls
   - Load sample meshes for testing
   - Real-time camera/lighting/position updates

2. Prompt input with TWO MODES:
   - Single mode: one text field, auto-decomposed
   - Split mode: separate object + background fields (skips decomposer)
   - Radio buttons to toggle between modes

3. Control panels:
   - Object: position (x,y,z), scale, rotation
   - Camera: distance, angle, height, FOV
   - Lighting: preset dropdown + intensity slider + color picker

4. Preset management:
   - Load existing presets
   - Save current config as new preset
   - Quick-select buttons for common presets (product, hero, icon)

5. Generate button → calls API with current config

Tech: Next.js page, Radix/shadcn components, Zustand for state
Work in: src/app/composer/ and src/components/composer/"
```

**Merge point:** Merge both, and you have a working API + visual composer.

---

### Summary

```
Phase 1 (Core Services)          Phase 2 (Integration + UI)
───────────────────────          ─────────────────────────
      3 agents                         2 agents

┌──────────┐
│ Three.js │─────┐
└──────────┘     │               ┌──────────────┐
┌──────────┐     │               │ Pipeline +   │
│  Meshy   │─────┼──────────────►│ API Routes   │────┐
└──────────┘     │               └──────────────┘    │
┌──────────┐     │               ┌──────────────┐    │     ┌─────────────┐
│ ImageGen │─────┘               │   Composer   │────┼────►│ Working App │
└──────────┘                     │      UI      │    │     └─────────────┘
                                 └──────────────┘    │
                                                     │
                                 (run in parallel)───┘

Total: 5 agent-sessions across 2 phases
Human effort: Open terminals, merge branches, test
```

**End result:** Working API + visual Scene Composer for designing staging presets.

---

## Your Toolkit

```powershell
$toolkit = "C:\Users\davem\Desktop\claude\supercharged-workflows"
& "$toolkit\setup.ps1" -TargetDir . -type node
```

### Relevant Skills

| Skill | Use |
|-------|-----|
| `caching-analyzer` | Cache repeated prompts/meshes for reuse |

### Pre-Build Research Checklist

Before coding, the agent should verify:

- [ ] **Meshy 3D-to-Image API** - Check if scene composition is now available via API
  - If YES → Major simplification, may not need Three.js layer
  - If NO → Proceed with Three.js approach
  - Docs: https://docs.meshy.ai/en/api/changelog

- [ ] **Meshy rate limits** - Confirm subscription tier limits for batch generation

---

## Setup Requirements

### API Keys Needed
- [ ] OpenAI API key (DALL-E) or alternative image gen
- [ ] Meshy API key
- [ ] Storage (S3/Cloudflare R2/Vercel Blob)

### Dependencies
```json
{
  "dependencies": {
    "three": "^0.160.0",
    "@react-three/fiber": "^8.0.0",
    "@react-three/drei": "^9.0.0",
    "openai": "^4.0.0",
    "zustand": "^4.0.0",
    "@radix-ui/react-slider": "^1.0.0",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-radio-group": "^1.0.0"
  }
}
```

---

## Configuration

```yaml
# config.yml

# Image generation
image_api: "openai"  # or "stability", "midjourney"
image_model: "dall-e-3"
default_size: "2048x2048"

# 3D generation
meshy_style: "realistic"  # realistic, cartoon, low-poly

# Output
storage_provider: "cloudflare-r2"  # or s3, vercel-blob
default_format: "png"

# Pricing (if selling as service)
price_per_generation: 0.50  # USD
```

---

## Let's Begin

Once you've read this and set up API keys, I'll start with:

```
"I've read the 3D Scene Generator Primer.

Starting Phase 1 (parallel):
1. Three.js scene infrastructure + lighting presets + canvas capture
2. Meshy API integration (task creation, polling, model download)
3. Image gen + prompt decomposition (with optional skip for split prompts)

After merge, Phase 2 (parallel):
4. Pipeline orchestration + API routes + preset system
5. Scene Composer UI (live preview, controls, single/split prompt modes)

Two phases, 5 agent-sessions total. Let's start coding."
```

---

*This primer was generated using the Supercharged Workflows toolkit.*
