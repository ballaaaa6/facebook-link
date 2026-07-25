# 🎨 2.5D Pixel Art Furniture & Asset Workflow Guide

This document serves as the official design specification and procedural guide for creating, generating, extracting, registering, and placing 2.5D pixel-art environment assets in the Office Canvas system.

---

## 📐 1. Grid & Asset Geometry Standard

All environment assets are aligned to a **32px Integer Tile Grid**.

### Geometry Properties
- **`renderBox`**: Image rendering dimensions in tile units `{ width, height }`.
- **`footprint`**: Collision box on the floor `{ width, depth }`.
  > **Key Rule**: `footprint` represents floor contact area only. Tall objects (e.g. 1x3 server rack or 2x3 tall plant) have a small footprint on the floor (`1x1`), but a tall `renderBox` (`1x3`) so characters can walk behind them without pathing collision.
- **`anchor`**: Positioning alignment:
  - `"bottom-center"`: Used for chairs, plants, standing equipment. Transforms by `translate(-50%, -100%)`.
  - `"center"`: Used for tables, desks, rugs, sectional sofas. Transforms by `translate(-50%, -50%)`.
  - `"wall-top"`: Used for wall TVs, clocks, exit signs, wall extinguishers.

---

## 🎨 2. AI Image Prompting & Style Guide (Concept C - Warm Studio)

When generating new 2.5D pixel art assets via `generate_image`, always adhere to these rules:

### Visual Style Rules
1. **2.5D Perspective with Legs & Shadows**:
   - Tables and chairs must **NOT** look like flat slabs or 2D stickers.
   - Prompts must explicitly request **"visible 4 wooden legs under table, 2.5D top-down perspective, under-table floor shadow, warm oak wood texture"**.
2. **Color Palette**:
   - Primary Wood: Warm Oak (#C89D66 / #B98258).
   - Cushions / Fabrics: Forest Green (#395C44 / #4E7359).
   - Metal / Tech: Dark Graphite (#2D493F / #1E2E28).
3. **Background**:
   - Uniform solid magenta background (`#FF00FF` / RGB `[255, 0, 255]`) for clean alpha keying.

### Example Prompt Template
```
A clean 4x4 asset sheet of 2D top-down 16-bit pixel art office furniture for Concept C warm studio theme on a solid uniform magenta background (#FF00FF). Top-down 2.5D perspective. High quality pixel art with clean edges, warm wooden tones, visible wooden legs under tables, and subtle floor shadows.
Row 1: A round wooden cafe table with 4 visible wooden legs (2x2 tiles), a low rectangular wooden coffee table with 4 legs (3x2 tiles).
Row 2: Green cushioned wooden cafe chair facing up, side, down (1x2 tiles).
Row 3: Wall mounted flatscreen TV (3x2 tiles), low magazine bookshelf (2x2 tiles), standing floor lamp (1x3 tiles).
No cast shadows outside items, generous empty padding between items, crisp outlines, no text or grid lines.
```

---

## 🛠️ 3. Extraction & Processing Pipeline

Do not rely on naive fixed-cell slicing (which cuts objects spanning across cell boundaries). Use **Connected Blob Segmentation (`ndimage.label`)**:

### Python Extraction Script Pattern
```python
import os, json
from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open("raw_generated_sheet.png").convert("RGBA")
arr = np.array(img)

# 1. Mask Chroma-Key Magenta Background
r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
bg_mask = (r > 165) & (b > 165) & (g < 125)
arr[bg_mask, 3] = 0

# 2. Connected Component Segmentation
fg_mask = ~bg_mask
labeled, num_features = ndimage.label(fg_mask)

# 3. Crop Tight Bounding Box per Blob
def save_tight_blob(blob_id, output_path):
    mask = (labeled == blob_id)
    ys, xs = np.where(mask)
    min_x, max_x, min_y, max_y = np.min(xs), np.max(xs), np.min(ys), np.max(ys)
    
    blob_rgba = np.zeros_like(arr)
    blob_rgba[mask] = arr[mask]
    
    cropped = Image.fromarray(blob_rgba).crop((min_x, min_y, max_x + 1, max_y + 1))
    cropped.save(output_path)
```

---

## 📦 4. Surface Slot & Tabletop Snap Rules

To place items (coffee cups, laptops, coffee machines, papers) on top of desks or counters:

1. **Define `slotSet` in `assets/game/manifests/office-assets.json`**:
   ```json
   "coffee-counter": {
     "counter-left": { "x": -1, "y": 0, "surface": "counter-surface" },
     "counter-right": { "x": 1, "y": 0, "surface": "counter-surface" }
   }
   ```
   > **Note**: Surface slot `y` offset is relative to table center. Use `y: 0` so items rest flat on top of the counter surface instead of floating.

2. **Declare Support in Child Asset**:
   ```json
   "machine.coffee": {
     "renderBox": { "width": 1, "height": 2 },
     "layer": "equipment",
     "anchor": "bottom-center",
     "supports": ["counter-surface"]
   }
   ```

3. **Attach in Map Object (`office-c-v2.json`)**:
   ```json
   { "id": "pantry-coffee-machine", "asset": "machine.coffee", "parentId": "coffee-counter", "slot": "counter-right", "layer": "equipment", "anchor": "bottom-center" }
   ```

---

## 📋 5. Registration Checklist

When adding new furniture or decor assets, update these 4 files in sequence:

1. **`assets/game/manifests/office-furniture-c-v2.json`**: Add cell IDs to pass `repo-check.mjs`.
2. **`assets/game/manifests/office-assets.json`**: Register `renderBox`, `footprint`, `layer`, `anchor`, and `supports`.
3. **`apps/web/src/features/office/components/officeAssetRegistry.ts`**: Import PNG file and add to `assetFiles` map.
4. **`assets/game/maps/office-c-v2.json`**: Place map objects and set POI targets.

---

## ⚙️ 6. Pre-Commit Verification Gate

Always validate before committing:
```bash
npm run check
```
This runs repository checks, geometry overlap checks, pathing route safety checks, TypeScript typechecking, Vitest tests, and Vite build.
