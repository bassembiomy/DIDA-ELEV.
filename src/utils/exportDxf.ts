// src/utils/exportDxf.ts
// Professional DXF export — closed polylines, ISO layers, 5 drawing views + title block.
import { DxfWriter, point3d } from '@tarikjabiri/dxf';
import { saveAs } from 'file-saver';
import type { ElevatorConfig } from '../store/elevatorStore';
import { calculateEngineering } from './engineeringCalculations';
import {
  drawClosedRect,
  drawWallRect,
  drawDimension,
  drawCenterLine,
  drawTRailSection,
  drawTitleBlock,
  drawLeader,
  drawIBeamSection,
  drawApron,
} from './drawingHelpers';

// ISO 128 layer definitions
const LAYERS = {
  WALL:    { name: 'S-WALL',   color: 7  },  // white/black — concrete walls
  CAB:     { name: 'S-CAB',    color: 5  },  // blue — cab outline
  DOOR:    { name: 'S-DOOR',   color: 4  },  // cyan — doors
  RAIL:    { name: 'S-RAIL',   color: 8  },  // gray — guide rails
  ROPE:    { name: 'S-ROPE',   color: 9  },  // light gray — ropes
  DIM:     { name: 'S-DIM',    color: 1  },  // red — dimensions
  CENTER:  { name: 'S-CENTER', color: 3  },  // green — center lines
  HATCH:   { name: 'S-HATCH',  color: 254 }, // near-black — section hatch
  CW:      { name: 'S-CW',     color: 6  },  // magenta — counterweight
  TITLE:   { name: 'S-TITLE',  color: 7  },  // title block
};

export function exportToDxf(config: ElevatorConfig) {
  const dxf = new DxfWriter();

  // Register all layers
  Object.values(LAYERS).forEach(({ name, color }) => dxf.addLayer(name, color));

  const { hoistway, cab, machine, performance } = config;
  const eng = calculateEngineering(config);

  // All values in millimeters for DXF
  const scale = 1000;  // m → mm
  const HW  = hoistway.width  * scale;
  const HD  = hoistway.depth  * scale;
  const WT  = hoistway.wallThickness * scale;
  const CW  = cab.width  * scale;
  const CD  = cab.depth  * scale;
  const CH  = cab.height * scale;
  const CWT = cab.wallThickness  * scale;
  const CFT = cab.floorThickness * scale;
  const PIT = hoistway.pitDepth * scale;
  const TSH = eng.totalShaftHeight * scale;
  const TT  = eng.totalTravel * scale;
  const DBG = hoistway.dbg   * scale;
  const CWD = hoistway.cwDistance * scale;

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 1 — FLOOR PLAN (top-down section at mid-height)
  // ═══════════════════════════════════════════════════════════════════════════
  const planOX = 0, planOY = 0;

  // Hoistway walls (double-line: outer concrete face + inner shaft face)
  drawWallRect(dxf, planOX, planOY, HW, HD, WT, LAYERS.WALL.name);

  // Center lines
  drawCenterLine(dxf, planOX - WT - 200, planOY + HD / 2, planOX + HW + WT + 200, planOY + HD / 2, LAYERS.CENTER.name);
  drawCenterLine(dxf, planOX + HW / 2, planOY - WT - 200, planOX + HW / 2, planOY + HD + WT + 200, LAYERS.CENTER.name);

  // Cab walls (with wall thickness) — centered in shaft
  const cabPX = planOX + (HW - CW) / 2;
  const cabPY = planOY + (HD - CD) / 2;
  // Cab shell closed rects (inner cavity + 4 wall slabs)
  drawClosedRect(dxf, cabPX,       cabPY,       CW,       CD,       LAYERS.CAB.name);
  drawClosedRect(dxf, cabPX - CWT, cabPY - CWT, CW + CWT * 2, CD + CWT * 2, LAYERS.CAB.name);

  // Door opening on front face (erase with white = show opening)
  const doorClearW = CW - CWT * 2;
  const doorStartX = cabPX + CWT;
  dxf.addLine(point3d(doorStartX, cabPY + CD + CWT), point3d(doorStartX + doorClearW, cabPY + CD + CWT), { layerName: LAYERS.DOOR.name });

  // Guide rails — T-section symbols
  const lRailX = planOX + HW / 2 - DBG / 2;
  const rRailX = planOX + HW / 2 + DBG / 2;
  drawTRailSection(dxf, lRailX, planOY + HD / 2, 1, LAYERS.RAIL.name);
  drawTRailSection(dxf, rRailX, planOY + HD / 2, 1, LAYERS.RAIL.name);

  // Counterweight (plan)
  const cwPX = planOX + (HW - CW * 0.65) / 2;
  const cwPZ = planOY - CWD - 75;
  drawClosedRect(dxf, cwPX, cwPZ, CW * 0.65, 150, LAYERS.CW.name);
  // CW rails
  drawTRailSection(dxf, cwPX,              cwPZ + 75, 1, LAYERS.RAIL.name);
  drawTRailSection(dxf, cwPX + CW * 0.65, cwPZ + 75, 1, LAYERS.RAIL.name);

  // Plan dimensions
  drawDimension(dxf, planOX - WT, planOY - WT, planOX + HW + WT, planOY - WT, -400,
    `${hoistway.width.toFixed(3)} m`, LAYERS.DIM.name, true);
  drawDimension(dxf, planOX + HW + WT, planOY - WT, planOX + HW + WT, planOY + HD + WT, 400,
    `${hoistway.depth.toFixed(3)} m`, LAYERS.DIM.name, false);
  drawDimension(dxf, cabPX, planOY + HD + WT + 100, cabPX + CW, planOY + HD + WT + 100, 400,
    `CAB ${cab.width.toFixed(3)} m`, LAYERS.DIM.name, true);
  drawDimension(dxf, planOX + HW / 2 - DBG / 2, planOY + HD / 2, planOX + HW / 2 + DBG / 2, planOY + HD / 2, -600,
    `DBG ${DBG} mm`, LAYERS.DIM.name, true);

  // Labels
  drawLeader(dxf, cabPX + CW / 2, cabPY + CD / 2, planOX + HW + 1200, planOY + HD / 2, 'CAR ENCLOSURE', LAYERS.TITLE.name);
  drawLeader(dxf, rRailX, planOY + HD / 2, planOX + HW + 1200, planOY + HD / 2 + 500, 'T75-B GUIDE RAIL', LAYERS.TITLE.name);
  drawLeader(dxf, cwPX + CW * 0.3, cwPZ + 75, planOX - 1200, planOY - 400, 'COUNTERWEIGHT FRAME', LAYERS.TITLE.name);

  // Plan title
  dxf.addText(point3d(planOX, planOY - WT - 1200), 100, 'FLOOR PLAN — HOISTWAY SECTION', { layerName: LAYERS.TITLE.name });
  dxf.addText(point3d(planOX, planOY - WT - 1350), 60, `SCALE 1:50 | ALL DIMS IN MILLIMETERS`, { layerName: LAYERS.TITLE.name });

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 2 — FRONT ELEVATION (looking at door face, +Z direction)
  // ═══════════════════════════════════════════════════════════════════════════
  const elOX = HW + WT * 2 + 2000;
  const elOY = 0;

  // Shaft outline (double-line for wall thickness)
  drawWallRect(dxf, elOX, elOY, HW, TSH, WT, LAYERS.WALL.name);

  // Floor levels
  for (let i = 0; i < performance.stops; i++) {
    const yFloor = elOY + PIT + i * performance.floorHeight * scale;
    dxf.addLine(point3d(elOX - WT - 300, yFloor), point3d(elOX + HW + WT + 300, yFloor), { layerName: LAYERS.DIM.name });
    dxf.addText(point3d(elOX + HW + WT + 350, yFloor - 30), 45, `FL.${i + 1}`, { layerName: LAYERS.DIM.name });
  }

  // Cab in elevation (at floor 1 position)
  const cabElX = elOX + (HW - CW) / 2;
  const cabElYbottom = elOY + PIT;
  drawClosedRect(dxf, cabElX - CWT, cabElYbottom - CFT, CW + CWT * 2, CH + CFT + 3, LAYERS.CAB.name);
  drawClosedRect(dxf, cabElX,       cabElYbottom,        CW,           CH,             LAYERS.CAB.name);

  // Doors (center-opening — two panels)
  if (cab.doorType === 'center') {
    drawClosedRect(dxf, cabElX,          cabElYbottom, CW / 2 - CWT, CH - 30, LAYERS.DOOR.name);
    drawClosedRect(dxf, cabElX + CW / 2, cabElYbottom, CW / 2 - CWT, CH - 30, LAYERS.DOOR.name);
  } else {
    drawClosedRect(dxf, cabElX + CW / 4, cabElYbottom, CW / 2 + 25, CH - 30, LAYERS.DOOR.name);
  }

  // Counterweight elevation (opposite side)
  const cwElX = elOX + HW + WT + 500;
  const cwH_mm = Math.max(1000, eng.counterweightMass / 500 * scale);
  drawClosedRect(dxf, cwElX, elOY + PIT + TT, CW * 0.65, cwH_mm, LAYERS.CW.name);

  // Rails in elevation
  dxf.addLine(point3d(elOX + (HW - DBG) / 2,        elOY), point3d(elOX + (HW - DBG) / 2,        elOY + TSH), { layerName: LAYERS.RAIL.name });
  dxf.addLine(point3d(elOX + (HW + DBG) / 2,        elOY), point3d(elOX + (HW + DBG) / 2,        elOY + TSH), { layerName: LAYERS.RAIL.name });

  // Center line (vertical)
  drawCenterLine(dxf, elOX + HW / 2, elOY - WT - 200, elOX + HW / 2, elOY + TSH + WT + 200, LAYERS.CENTER.name);

  // Elevation dimensions
  drawDimension(dxf, elOX - WT, elOY, elOX - WT, elOY + PIT, -1200, `PIT ${hoistway.pitDepth.toFixed(2)} m`, LAYERS.DIM.name, false);
  drawDimension(dxf, elOX - WT, elOY + PIT, elOX - WT, elOY + PIT + TT, -1200, `TRAVEL ${eng.totalTravel.toFixed(2)} m`, LAYERS.DIM.name, false);
  drawDimension(dxf, elOX - WT, elOY + PIT + TT, elOX - WT, elOY + TSH, -1200, `OH ${hoistway.overhead.toFixed(2)} m`, LAYERS.DIM.name, false);
  drawDimension(dxf, elOX - WT, elOY, elOX - WT, elOY + TSH, -2000, `TOTAL ${eng.totalShaftHeight.toFixed(2)} m`, LAYERS.DIM.name, false);

  // Structural Details
  drawIBeamSection(dxf, elOX + HW / 2, elOY + TSH - 100, HW + WT * 2, 200, LAYERS.WALL.name);
  drawApron(dxf, cabElX + 50, cabElYbottom, CW - 100, 750, LAYERS.CAB.name);

  // Labels
  drawLeader(dxf, elOX + HW / 2, elOY + TSH - 50, elOX + HW + 1200, elOY + TSH + 500, 'HEB 200 MACHINE BEAM', LAYERS.TITLE.name);
  drawLeader(dxf, elOX + HW / 2, elOY + PIT + CH / 2, elOX + HW + 1200, elOY + PIT + CH / 2, 'CAR ASSEMBLY', LAYERS.TITLE.name);

  // Elevation title
  dxf.addText(point3d(elOX, elOY - WT - 1200), 100, 'FRONT ELEVATION — SHAFT SECTION', { layerName: LAYERS.TITLE.name });

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 3 — SIDE ELEVATION (section looking from +X)
  // ═══════════════════════════════════════════════════════════════════════════
  const sidOX = elOX + HW + WT * 2 + 3500;
  const sidOY = 0;

  drawWallRect(dxf, sidOX, sidOY, HD, TSH, WT, LAYERS.WALL.name);
  drawCenterLine(dxf, sidOX + HD / 2, sidOY - WT - 200, sidOX + HD / 2, sidOY + TSH + WT + 200, LAYERS.CENTER.name);

  const cabSX = sidOX + (HD - CD) / 2;
  drawClosedRect(dxf, cabSX, sidOY + PIT, CD, CH, LAYERS.CAB.name);

  // CW in side elevation
  const cwSX = sidOX + (HD - CWD - 100);
  drawClosedRect(dxf, cwSX, sidOY + PIT + TT, 150, cwH_mm, LAYERS.CW.name);

  drawDimension(dxf, sidOX - WT, sidOY - WT, sidOX + HD + WT, sidOY - WT, -400, `${hoistway.depth.toFixed(3)} m`, LAYERS.DIM.name, true);
  drawDimension(dxf, cabSX, sidOY - WT - 100, cabSX + CD, sidOY - WT - 100, -700, `CAB ${cab.depth.toFixed(3)} m`, LAYERS.DIM.name, true);

  dxf.addText(point3d(sidOX, sidOY - WT - 700), 80, 'SIDE ELEVATION — DEPTH SECTION', { layerName: LAYERS.TITLE.name });

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW 4 — GUIDE RAIL CROSS-SECTION DETAIL (1:5 scale)
  // ═══════════════════════════════════════════════════════════════════════════
  const detOX = 0;
  const detOY = -(HD + WT * 2 + 4000);

  drawClosedRect(dxf, detOX - 200, detOY - 200, 800, 600, LAYERS.TITLE.name);
  drawTRailSection(dxf, detOX + 200, detOY + 50, 5, LAYERS.RAIL.name);
  dxf.addText(point3d(detOX - 100, detOY - 400), 60, 'GUIDE RAIL SECTION — T75-B (ISO 7465)', { layerName: LAYERS.TITLE.name });
  dxf.addText(point3d(detOX - 100, detOY - 520), 45, 'SCALE 1:5 | DIM. IN mm', { layerName: LAYERS.DIM.name });

  // ═══════════════════════════════════════════════════════════════════════════
  // TITLE BLOCK
  // ═══════════════════════════════════════════════════════════════════════════
  drawTitleBlock(
    dxf,
    0, -(HD + WT * 2 + 6000),
    {
      title: `ELEVATOR DESIGN — ${performance.capacity}KG | ${performance.stops} STOPS`,
      capacity: performance.capacity,
      stops: performance.stops,
      speed: machine.speed,
      travel: eng.totalTravel,
      cwMass: eng.counterweightMass,
      roping: machine.ropingRatio,
      ropeDia: machine.ropeDiameter,
      ropeCount: machine.ropeCount,
    },
    LAYERS.TITLE.name
  );

  // Save
  const blob = new Blob([dxf.stringify()], { type: 'application/dxf' });
  saveAs(blob, `elevator_design_${Date.now()}.dxf`);
}
