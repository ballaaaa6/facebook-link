# 🎨 2.5D Pixel Art Furniture & Asset Workflow Guide

This document serves as the official design specification and procedural guide for creating, generating, extracting, defringing, registering, and placing 2.5D pixel-art environment assets in the Office Canvas system.

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

---

## 🛠️ 3. Lineart Preservation & Defringing Pipeline

In pixel art, the **dark/black outer lineart border** gives objects their form and contrast against the floor. Never erode or dilate away dark lineart.

### Python Lineart Preservation Script
```python
import os
from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open("raw_generated_sheet.png").convert("RGBA")
arr = np.array(img, dtype=np.float32)

r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

# 1. Pure Magenta Background Mask
pure_bg = (r > 175) & (b > 175) & (g < 125)

# 2. Protect Dark Lineart (RGB brightness < 90)
dark_outline = (r < 90) & (g < 90) & (b < 90)

# 3. Magenta Fringe Mask (only non-outline pixels)
magenta_fringe = (r > g + 35) & (b > g + 35) & (~dark_outline)

erase_mask = pure_bg | magenta_fringe

res = arr.copy().astype(np.uint8)
res[erase_mask, 3] = 0

# 4. Desaturate Magenta Tint on Outer Borders without changing Alpha
fringe_pixels = (~erase_mask) & ((r > g + 10) | (b > g + 10))
for y, x in zip(*np.where(fringe_pixels)):
    max_fg = int(res[y, x, 1])
    res[y, x, 0] = min(int(res[y, x, 0]), max_fg + 15)
    res[y, x, 2] = min(int(res[y, x, 2]), max_fg + 15)

# 5. Connected Blob Extraction
labeled, num_features = ndimage.label(~erase_mask)
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
