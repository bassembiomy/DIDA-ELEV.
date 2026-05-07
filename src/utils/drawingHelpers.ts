// src/utils/drawingHelpers.ts
// Utility functions for DXF drawing generation.
// All shape-drawing functions produce CLOSED polylines (no open edges).
import { DxfWriter, point3d } from '@tarikjabiri/dxf';

// ── Closed rectangular polyline ──────────────────────────────────────────────
export function drawClosedRect(
  dxf: DxfWriter,
  x: number, y: number,
  w: number, h: number,
  layer: string,
) {
  // 4 lines explicitly closing back to start → closed shape
  dxf.addLine(point3d(x,     y),     point3d(x + w, y),     { layerName: layer });
  dxf.addLine(point3d(x + w, y),     point3d(x + w, y + h), { layerName: layer });
  dxf.addLine(point3d(x + w, y + h), point3d(x,     y + h), { layerName: layer });
  dxf.addLine(point3d(x,     y + h), point3d(x,     y),     { layerName: layer });
}

// ── Hoistway wall rect with thickness (double-line = inner + outer face) ─────
export function drawWallRect(
  dxf: DxfWriter,
  x: number, y: number,
  w: number, h: number,
  thickness: number,
  layer: string,
) {
// Outer face
  drawClosedRect(dxf, x - thickness, y - thickness,
    w + thickness * 2, h + thickness * 2, layer);
  // Inner face (shaft opening)
  drawClosedRect(dxf, x, y, w, h, layer);
  
  // Hatching (concrete) — 45 deg lines
  drawHatchRect(dxf, x - thickness, y - thickness, w + thickness * 2, h + thickness * 2, 80, layer);
  // Clear the inner hole (not really clearing, just avoiding hatching inside)
  // The logic here will be simplified: we'll just hatch the border area in exportDxf.
}

// ── Hatching (Simulated via lines) ──────────────────────────────────────────
export function drawHatchRect(
  dxf: DxfWriter,
  x: number, y: number,
  w: number, h: number,
  spacing: number,
  layer: string,
) {
  // Simple diagonal hatching
  for (let i = -h; i < w; i += spacing) {
    const startX = Math.max(x, x + i);
    const startY = Math.max(y, y + (startX - (x + i)));
    const endX = Math.min(x + w, x + i + h);
    const endY = Math.min(y + h, y + (endX - (x + i)));
    if (startX < endX) {
      dxf.addLine(point3d(startX, startY), point3d(endX, endY), { layerName: layer });
    }
  }
}

// ── Linear dimension entity ───────────────────────────────────────────────────
export function drawDimension(
  dxf: DxfWriter,
  x1: number, y1: number,
  x2: number, y2: number,
  offset: number,   // perpendicular offset for dim line
  textOverride: string,
  layer: string,
  horizontal = true,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (horizontal) {
    // Extension lines
    dxf.addLine(point3d(x1, y1), point3d(x1, y1 + offset), { layerName: layer });
    dxf.addLine(point3d(x2, y2), point3d(x2, y2 + offset), { layerName: layer });
    // Dimension line
    dxf.addLine(point3d(x1, y1 + offset), point3d(x2, y2 + offset), { layerName: layer });
    // Arrow ticks
    dxf.addLine(point3d(x1, y1 + offset - 40), point3d(x1 + 60, y1 + offset), { layerName: layer });
    dxf.addLine(point3d(x2, y2 + offset - 40), point3d(x2 - 60, y2 + offset), { layerName: layer });
    // Text
    const midX = (x1 + x2) / 2;
    dxf.addText(point3d(midX - 100, y1 + offset + 30), 40, textOverride, { layerName: layer });
  } else {
    // Vertical dimension
    dxf.addLine(point3d(x1, y1), point3d(x1 + offset, y1), { layerName: layer });
    dxf.addLine(point3d(x2, y2), point3d(x2 + offset, y2), { layerName: layer });
    dxf.addLine(point3d(x1 + offset, y1), point3d(x2 + offset, y2), { layerName: layer });
    dxf.addLine(point3d(x1 + offset - 40, y1), point3d(x1 + offset, y1 + 60), { layerName: layer });
    dxf.addLine(point3d(x2 + offset - 40, y2), point3d(x2 + offset, y2 - 60), { layerName: layer });
    const midY = (y1 + y2) / 2;
    dxf.addText(point3d(x1 + offset + 40, midY - 20), 40, textOverride, { layerName: layer });
  }
}

// ── Center line (dashed) ──────────────────────────────────────────────────────
export function drawCenterLine(
  dxf: DxfWriter,
  x1: number, y1: number,
  x2: number, y2: number,
  layer: string,
) {
  // Approximate dashed center line using short segments
  const len = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.ceil(len / 200);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  for (let i = 0; i < steps; i++) {
    const t0 = i * 200;
    const t1 = Math.min(t0 + 120, len);
    dxf.addLine(
      point3d(x1 + ux * t0, y1 + uy * t0),
      point3d(x1 + ux * t1, y1 + uy * t1),
      { layerName: layer }
    );
  }
}

// ── T-rail cross section (plan view detail) ───────────────────────────────────
export function drawTRailSection(
  dxf: DxfWriter,
  cx: number, cy: number,
  scaleFactor: number,  // e.g. 5 = 1:5 scale
  layer: string,
) {
  // T75-B dimensions in mm
  const bw = 37.5 * scaleFactor;
  const hw = 31 * scaleFactor;
  const bt = 16 * scaleFactor;
  const d  = 62 * scaleFactor;

  // Closed T-profile polyline
  const pts: [number, number][] = [
    [cx - bw, cy],
    [cx + bw, cy],
    [cx + bw, cy + bt],
    [cx + hw, cy + bt],
    [cx + hw, cy + d],
    [cx - hw, cy + d],
    [cx - hw, cy + bt],
    [cx - bw, cy + bt],
    [cx - bw, cy],  // close
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    dxf.addLine(
      point3d(pts[i][0],     pts[i][1]),
      point3d(pts[i + 1][0], pts[i + 1][1]),
      { layerName: layer }
    );
  }
}

// ── Title block ───────────────────────────────────────────────────────────────
export function drawTitleBlock(
  dxf: DxfWriter,
  x: number, y: number,
  projectInfo: {
    title: string; capacity: number; stops: number;
    speed: number; travel: number; cwMass: number;
    roping: number; ropeDia: number; ropeCount: number;
  },
  layer: string,
) {
  const W = 8000, H = 2000;
  drawClosedRect(dxf, x, y, W, H, layer);

  // Column dividers
  dxf.addLine(point3d(x + 2000, y), point3d(x + 2000, y + H), { layerName: layer });
  dxf.addLine(point3d(x + 5000, y), point3d(x + 5000, y + H), { layerName: layer });

  // Row dividers
  dxf.addLine(point3d(x,        y + 1300), point3d(x + W, y + 1300), { layerName: layer });
  dxf.addLine(point3d(x,        y + 700),  point3d(x + W, y + 700),  { layerName: layer });

  // Text content
  dxf.addText(point3d(x + 80, y + 1500), 100, projectInfo.title, { layerName: layer });
  dxf.addText(point3d(x + 80, y + 900),  60,  `CAPACITY: ${projectInfo.capacity} kg`, { layerName: layer });
  dxf.addText(point3d(x + 80, y + 300),  60,  `STOPS: ${projectInfo.stops}`, { layerName: layer });
  dxf.addText(point3d(x + 2080, y + 1500), 60, `SPEED: ${projectInfo.speed} m/s`, { layerName: layer });
  dxf.addText(point3d(x + 2080, y + 900),  60, `TRAVEL: ${projectInfo.travel.toFixed(2)} m`, { layerName: layer });
  dxf.addText(point3d(x + 2080, y + 300),  60, `ROPING: ${projectInfo.roping}:1`, { layerName: layer });
  dxf.addText(point3d(x + 5080, y + 1500), 60, `CW MASS: ${projectInfo.cwMass.toFixed(0)} kg`, { layerName: layer });
  dxf.addText(point3d(x + 5080, y + 900),  60, `ROPE: Ø${projectInfo.ropeDia}mm × ${projectInfo.ropeCount}`, { layerName: layer });
  dxf.addText(point3d(x + 5080, y + 300),  60, `STD: EN 81-20 / ISO 4190`, { layerName: layer });
}
// ── Leader Line with Text ────────────────────────────────────────────────────
export function drawLeader(
  dxf: DxfWriter,
  x: number, y: number,
  tx: number, ty: number,
  label: string,
  layer: string,
) {
  dxf.addLine(point3d(x, y), point3d(tx, ty), { layerName: layer });
  // Arrow head (simple)
  const angle = Math.atan2(ty - y, tx - x);
  const al = 60;
  dxf.addLine(point3d(x, y), point3d(x + Math.cos(angle + 0.5) * al, y + Math.sin(angle + 0.5) * al), { layerName: layer });
  dxf.addLine(point3d(x, y), point3d(x + Math.cos(angle - 0.5) * al, y + Math.sin(angle - 0.5) * al), { layerName: layer });
  // Text
  dxf.addText(point3d(tx + 50, ty - 20), 45, label, { layerName: layer });
}

// ── I-Beam (HEB 200) section ─────────────────────────────────────────────────
export function drawIBeamSection(
  dxf: DxfWriter,
  cx: number, cy: number,
  w: number, h: number,
  layer: string,
) {
  const tf = 15; // flange thickness
  const tw = 9;  // web thickness
  // Top flange
  drawClosedRect(dxf, cx - w/2, cy + h/2 - tf, w, tf, layer);
  // Bottom flange
  drawClosedRect(dxf, cx - w/2, cy - h/2, w, tf, layer);
  // Web
  drawClosedRect(dxf, cx - tw/2, cy - h/2 + tf, tw, h - tf*2, layer);
}

// ── Apron (Toe Guard) profile ────────────────────────────────────────────────
export function drawApron(
  dxf: DxfWriter,
  x: number, y: number,
  w: number, h: number,
  layer: string,
) {
  dxf.addLine(point3d(x, y), point3d(x + w, y), { layerName: layer });
  dxf.addLine(point3d(x + w, y), point3d(x + w, y - h), { layerName: layer });
  dxf.addLine(point3d(x + w, y - h), point3d(x + w - 40, y - h - 40), { layerName: layer });
  dxf.addLine(point3d(x + w - 40, y - h - 40), point3d(x + 40, y - h - 40), { layerName: layer });
  dxf.addLine(point3d(x + 40, y - h - 40), point3d(x, y - h), { layerName: layer });
  dxf.addLine(point3d(x, y - h), point3d(x, y), { layerName: layer });
}
