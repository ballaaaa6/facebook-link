import { encodeRgbaPng } from "./office-v2-asset-factory.mjs";

export const WIDTH = 176;
export const HEIGHT = 96;
export const SCALE = 4;
export const DOCK = Object.freeze({ x: 56, y: 56 });
export const BACKGROUNDS = Object.freeze({
  light: [245, 242, 234, 255],
  dark: [24, 28, 36, 255],
});
export const COLORS = Object.freeze({
  transparent: [0, 0, 0, 0],
  outline: [39, 31, 28, 255],
  topLight: [224, 172, 101, 255],
  woodMid: [166, 101, 54, 255],
  woodDark: [118, 69, 43, 255],
  woodGrain: [193, 126, 63, 255],
  southShadow: [72, 48, 42, 255],
  eastMid: [119, 71, 48, 255],
  metal: [46, 57, 62, 255],
  metalLight: [93, 108, 108, 255],
  accent: [62, 143, 142, 255],
  accentDark: [37, 91, 94, 255],
  shadow: [43, 35, 36, 255],
  contactHighlight: [255, 213, 75, 255],
});
export const POINTS = Object.freeze({
  north: { x: 56, y: 24 },
  east: { x: 120, y: 56 },
  south: { x: 88, y: 72 },
  west: { x: 24, y: 40 },
});

export function raster(width = WIDTH, height = HEIGHT) {
  return { width, height, pixels: new Uint8Array(width * height * 4) };
}

export function setPixel(target, x, y, color) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= target.width || y >= target.height) return;
  target.pixels.set(color, (y * target.width + x) * 4);
}

export function stroke(target, start, end, color) {
  let x = start.x;
  let y = start.y;
  const dx = Math.abs(end.x - start.x);
  const sx = start.x < end.x ? 1 : -1;
  const dy = -Math.abs(end.y - start.y);
  const sy = start.y < end.y ? 1 : -1;
  let error = dx + dy;
  while (true) {
    setPixel(target, x, y, color);
    if (x === end.x && y === end.y) break;
    const doubleError = error * 2;
    if (doubleError >= dy) {
      error += dy;
      x += sx;
    }
    if (doubleError <= dx) {
      error += dx;
      y += sy;
    }
  }
}

function fillPolygon(target, points, color) {
  const left = Math.max(0, Math.min(...points.map((point) => point.x)));
  const right = Math.min(target.width - 1, Math.max(...points.map((point) => point.x)));
  const top = Math.max(0, Math.min(...points.map((point) => point.y)));
  const bottom = Math.min(target.height - 1, Math.max(...points.map((point) => point.y)));
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      let positive = false;
      let negative = false;
      for (let index = 0; index < points.length; index += 1) {
        const a = points[index];
        const b = points[(index + 1) % points.length];
        const cross = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
        positive ||= cross > 0;
        negative ||= cross < 0;
        if (positive && negative) break;
      }
      if (!(positive && negative)) setPixel(target, x, y, color);
    }
  }
}

function fillQuad(target, a, b, c, d, color) {
  fillPolygon(target, [a, b, c, d], color);
}

function vertical(target, x, y, height, color) {
  stroke(target, { x, y }, { x, y: y - height }, color);
}

function offset(point, x, y) {
  return { x: point.x + x, y: point.y + y };
}

function colorOr(value, fallback) {
  return Array.isArray(value) && value.length === 4 ? value : fallback;
}

function drawBackFrame(target, mask) {
  const westOpen = Boolean(mask & 8);
  const eastOpen = Boolean(mask & 2);
  const start = { x: westOpen ? 44 : 38, y: westOpen ? 36 : 33 };
  const end = { x: eastOpen ? 100 : 108, y: eastOpen ? 64 : 68 };
  const topStart = offset(start, 0, -19);
  const topEnd = offset(end, 0, -19);

  stroke(target, topStart, topEnd, COLORS.woodDark);
  stroke(target, offset(topStart, 0, 1), offset(topEnd, 0, 1), COLORS.outline);
  stroke(target, start, end, COLORS.outline);
  stroke(target, offset(start, 0, -2), offset(end, 0, -2), COLORS.woodGrain);

  const slatCount = 6;
  for (let index = 0; index < slatCount; index += 1) {
    const ratio = index / (slatCount - 1);
    const x = Math.round(start.x + (end.x - start.x) * ratio);
    const y = Math.round(start.y + (end.y - start.y) * ratio);
    vertical(target, x, y, 17 + (index % 2), COLORS.metal);
    vertical(target, x + 1, y, 16 + (index % 2), COLORS.woodDark);
    setPixel(target, x + 1, y - 8, COLORS.metalLight);
  }

  if (!westOpen) {
    vertical(target, start.x, start.y + 1, 23, COLORS.outline);
    vertical(target, start.x + 2, start.y + 1, 22, COLORS.woodGrain);
  }
  if (!eastOpen) {
    vertical(target, end.x, end.y + 1, 23, COLORS.outline);
    vertical(target, end.x - 2, end.y + 1, 22, COLORS.woodGrain);
  }
}

function drawUnderStructure(target) {
  const southBottom = { x: 88, y: 79 };
  const westBottom = { x: 24, y: 47 };
  const eastBottom = { x: 120, y: 63 };

  fillQuad(target, POINTS.west, POINTS.south, southBottom, westBottom, COLORS.southShadow);
  fillQuad(target, POINTS.east, POINTS.south, southBottom, eastBottom, COLORS.eastMid);
  stroke(target, POINTS.west, POINTS.south, COLORS.outline);
  stroke(target, POINTS.south, POINTS.east, COLORS.outline);
  stroke(target, westBottom, southBottom, COLORS.outline);
  stroke(target, southBottom, eastBottom, COLORS.outline);

  fillQuad(target, { x: 41, y: 50 }, { x: 47, y: 53 }, { x: 47, y: 76 }, { x: 41, y: 73 }, COLORS.metal);
  fillQuad(target, { x: 92, y: 67 }, { x: 98, y: 64 }, { x: 98, y: 87 }, { x: 92, y: 90 }, COLORS.metal);
  stroke(target, { x: 37, y: 76 }, { x: 48, y: 81 }, COLORS.outline);
  stroke(target, { x: 89, y: 90 }, { x: 100, y: 85 }, COLORS.outline);
  stroke(target, { x: 47, y: 76 }, { x: 59, y: 70 }, COLORS.metalLight);
  stroke(target, { x: 98, y: 87 }, { x: 86, y: 81 }, COLORS.metalLight);
}

function drawDesktop(target) {
  fillPolygon(target, [POINTS.north, POINTS.east, POINTS.south, POINTS.west], COLORS.woodMid);
  fillPolygon(target, [
    { x: 56, y: 27 },
    { x: 114, y: 56 },
    { x: 87, y: 69 },
    { x: 30, y: 40 },
  ], COLORS.topLight);
  stroke(target, POINTS.north, POINTS.east, COLORS.outline);
  stroke(target, POINTS.east, POINTS.south, COLORS.outline);
  stroke(target, POINTS.south, POINTS.west, COLORS.outline);
  stroke(target, POINTS.west, POINTS.north, COLORS.outline);

  stroke(target, { x: 34, y: 40 }, { x: 62, y: 54 }, COLORS.woodGrain);
  stroke(target, { x: 52, y: 36 }, { x: 84, y: 52 }, COLORS.woodGrain);
  stroke(target, { x: 76, y: 48 }, { x: 104, y: 62 }, COLORS.woodGrain);
  stroke(target, { x: 46, y: 60 }, { x: 72, y: 47 }, COLORS.woodMid);
  stroke(target, { x: 68, y: 67 }, { x: 94, y: 54 }, COLORS.woodMid);

  fillQuad(target, { x: 48, y: 49 }, { x: 70, y: 60 }, { x: 62, y: 64 }, { x: 40, y: 53 }, COLORS.accentDark);
  stroke(target, { x: 48, y: 49 }, { x: 70, y: 60 }, COLORS.outline);
  stroke(target, { x: 40, y: 53 }, { x: 62, y: 64 }, COLORS.accent);
}

function drawPrivacyPanel(target, accent) {
  const panelLeft = { x: 62, y: 42 };
  const panelRight = { x: 88, y: 55 };
  fillQuad(target, panelLeft, panelRight, offset(panelRight, 0, 13), offset(panelLeft, 0, 13), accent);
  stroke(target, panelLeft, panelRight, COLORS.outline);
  stroke(target, offset(panelLeft, 0, 13), offset(panelRight, 0, 13), COLORS.accentDark);
  vertical(target, panelLeft.x, panelLeft.y + 12, 9, COLORS.accentDark);
  vertical(target, panelRight.x, panelRight.y + 12, 9, COLORS.accentDark);
  stroke(target, { x: 68, y: 45 }, { x: 68, y: 54 }, COLORS.metalLight);
}

function drawWestStorage(target) {
  const topA = { x: 24, y: 44 };
  const topB = { x: 40, y: 52 };
  const topC = { x: 32, y: 56 };
  const topD = { x: 16, y: 48 };
  fillQuad(target, topA, topB, topC, topD, COLORS.woodMid);
  fillQuad(target, topD, topC, { x: 32, y: 72 }, { x: 16, y: 64 }, COLORS.southShadow);
  fillQuad(target, topC, topB, { x: 40, y: 68 }, { x: 32, y: 72 }, COLORS.eastMid);
  stroke(target, topD, topC, COLORS.outline);
  stroke(target, topC, { x: 32, y: 72 }, COLORS.outline);
  stroke(target, topB, { x: 40, y: 68 }, COLORS.outline);
  stroke(target, { x: 20, y: 54 }, { x: 31, y: 59 }, COLORS.woodGrain);
  stroke(target, { x: 20, y: 59 }, { x: 31, y: 64 }, COLORS.woodGrain);
  setPixel(target, 25, 58, COLORS.metalLight);
  setPixel(target, 25, 63, COLORS.metalLight);
}

function drawEastStorage(target) {
  const topA = { x: 84, y: 66 };
  const topB = { x: 100, y: 58 };
  const topC = { x: 108, y: 63 };
  const topD = { x: 92, y: 71 };
  fillQuad(target, topA, topB, topC, topD, COLORS.woodMid);
  fillQuad(target, topA, topD, { x: 92, y: 87 }, { x: 84, y: 82 }, COLORS.southShadow);
  fillQuad(target, topD, topC, { x: 108, y: 79 }, { x: 92, y: 87 }, COLORS.eastMid);
  stroke(target, topA, topD, COLORS.outline);
  stroke(target, topD, { x: 92, y: 87 }, COLORS.outline);
  stroke(target, topC, { x: 108, y: 79 }, COLORS.outline);
  stroke(target, { x: 86, y: 74 }, { x: 91, y: 77 }, COLORS.woodGrain);
  stroke(target, { x: 86, y: 79 }, { x: 91, y: 82 }, COLORS.woodGrain);
  stroke(target, { x: 96, y: 75 }, { x: 104, y: 71 }, COLORS.woodGrain);
  stroke(target, { x: 96, y: 81 }, { x: 104, y: 77 }, COLORS.woodGrain);
  setPixel(target, 89, 76, COLORS.metalLight);
  setPixel(target, 89, 81, COLORS.metalLight);
}

function drawPlanter(target, accent) {
  fillQuad(target, { x: 92, y: 56 }, { x: 100, y: 60 }, { x: 96, y: 62 }, { x: 88, y: 58 }, COLORS.woodDark);
  fillQuad(target, { x: 88, y: 58 }, { x: 96, y: 62 }, { x: 96, y: 68 }, { x: 88, y: 64 }, accent);
  fillQuad(target, { x: 96, y: 62 }, { x: 100, y: 60 }, { x: 100, y: 66 }, { x: 96, y: 68 }, COLORS.accentDark);
  stroke(target, { x: 88, y: 58 }, { x: 96, y: 62 }, COLORS.outline);
  stroke(target, { x: 96, y: 62 }, { x: 100, y: 60 }, COLORS.outline);
  stroke(target, { x: 94, y: 59 }, { x: 91, y: 43 }, COLORS.metal);
  stroke(target, { x: 94, y: 59 }, { x: 101, y: 46 }, COLORS.metal);
  stroke(target, { x: 94, y: 58 }, { x: 86, y: 48 }, COLORS.metal);
  fillQuad(target, { x: 91, y: 44 }, { x: 94, y: 43 }, { x: 89, y: 39 }, { x: 87, y: 42 }, accent);
  fillQuad(target, { x: 99, y: 47 }, { x: 102, y: 46 }, { x: 106, y: 42 }, { x: 102, y: 43 }, accent);
  fillQuad(target, { x: 86, y: 49 }, { x: 89, y: 50 }, { x: 84, y: 46 }, { x: 81, y: 47 }, accent);
}

export function renderFrame(frame) {
  const target = raster();
  const accent = colorOr(frame.privacyAccent, COLORS.accent);
  const westOpen = Boolean(frame.mask & 8);
  const eastOpen = Boolean(frame.mask & 2);
  drawBackFrame(target, frame.mask);
  drawUnderStructure(target);
  drawDesktop(target);
  drawPrivacyPanel(target, accent);
  if (!westOpen) drawWestStorage(target);
  if (!eastOpen) {
    drawEastStorage(target);
    drawPlanter(target, accent);
  }
  return target.pixels;
}

export function scaleRgba(input, widthPx, heightPx, scale) {
  const output = raster(widthPx * scale, heightPx * scale);
  for (let y = 0; y < heightPx; y += 1) {
    for (let x = 0; x < widthPx; x += 1) {
      const sourceOffset = (y * widthPx + x) * 4;
      const color = input.slice(sourceOffset, sourceOffset + 4);
      for (let yy = 0; yy < scale; yy += 1) {
        for (let xx = 0; xx < scale; xx += 1) {
          output.pixels.set(color, ((y * scale + yy) * output.width + x * scale + xx) * 4);
        }
      }
    }
  }
  return output;
}

export function solidCanvas(width, height, color) {
  const output = raster(width, height);
  for (let offsetIndex = 0; offsetIndex < output.pixels.length; offsetIndex += 4) output.pixels.set(color, offsetIndex);
  return output;
}

export function layer(target, source, offsetX = 0, offsetY = 0) {
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const targetX = x + offsetX;
      const targetY = y + offsetY;
      if (targetX < 0 || targetY < 0 || targetX >= target.width || targetY >= target.height) continue;
      const sourceOffset = (y * source.width + x) * 4;
      if (source.pixels[sourceOffset + 3] === 0) continue;
      target.pixels.set(source.pixels.slice(sourceOffset, sourceOffset + 4), (targetY * target.width + targetX) * 4);
    }
  }
}

export function backgroundPreview(pixels, background) {
  const output = solidCanvas(WIDTH, HEIGHT, background);
  layer(output, { width: WIDTH, height: HEIGHT, pixels });
  return output;
}

export function encodeRaster(value) {
  return encodeRgbaPng({ widthPx: value.width, heightPx: value.height, rgba: value.pixels });
}

function dashed(target, points, color) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    for (let step = 0; step <= steps; step += 1) {
      if (step % 4 < 2) {
        const ratio = steps === 0 ? 0 : step / steps;
        setPixel(target, Math.round(start.x + (end.x - start.x) * ratio), Math.round(start.y + (end.y - start.y) * ratio), color);
      }
    }
  }
}

export function workstationDockDiagnostic(framePixels) {
  const output = solidCanvas(WIDTH, HEIGHT, BACKGROUNDS.light);
  layer(output, { width: WIDTH, height: HEIGHT, pixels: framePixels });
  const region = [
    { x: 36, y: 57 },
    { x: 56, y: 67 },
    { x: 76, y: 57 },
    { x: 56, y: 47 },
    { x: 36, y: 57 },
  ];
  dashed(output, region, COLORS.contactHighlight);
  stroke(output, { x: DOCK.x, y: DOCK.y + 8 }, DOCK, COLORS.contactHighlight);
  stroke(output, { x: DOCK.x, y: DOCK.y + 8 }, { x: DOCK.x - 3, y: DOCK.y + 4 }, COLORS.contactHighlight);
  stroke(output, { x: DOCK.x, y: DOCK.y + 8 }, { x: DOCK.x + 3, y: DOCK.y + 4 }, COLORS.contactHighlight);
  setPixel(output, DOCK.x, DOCK.y, COLORS.contactHighlight);
  setPixel(output, DOCK.x - 1, DOCK.y, COLORS.contactHighlight);
  setPixel(output, DOCK.x + 1, DOCK.y, COLORS.contactHighlight);
  setPixel(output, DOCK.x, DOCK.y - 1, COLORS.contactHighlight);
  setPixel(output, DOCK.x, DOCK.y + 1, COLORS.contactHighlight);
  stroke(output, { x: 36, y: 57 }, { x: 76, y: 57 }, COLORS.contactHighlight);
  return output;
}
