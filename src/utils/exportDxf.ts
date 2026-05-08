// src/utils/exportDxf.ts
import { DxfWriter, point3d } from '@tarikjabiri/dxf';
import { saveAs } from 'file-saver';
import type { ElevatorConfig } from '../store/elevatorStore';
import {
  drawClosedRect,
  drawWallRect,
  drawCenterLine,
  drawTitleBlock,
} from './drawingHelpers';

const LAYERS = {
  WALL:    { name: 'S-WALL',   color: 7  },
  CAB:     { name: 'S-CAB',    color: 5  },
  DOOR:    { name: 'S-DOOR',   color: 4  },
  RAIL:    { name: 'S-RAIL',   color: 8  },
  ROPE:    { name: 'S-ROPE',   color: 9  },
  DIM:     { name: 'S-DIM',    color: 1  },
  CENTER:  { name: 'S-CENTER', color: 3  },
  HATCH:   { name: 'S-HATCH',  color: 254 },
  CW:      { name: 'S-CW',     color: 6  },
  TITLE:   { name: 'S-TITLE',  color: 7  },
};

export function exportToDxf(config: ElevatorConfig) {
  const dxf = new DxfWriter();
  Object.values(LAYERS).forEach(({ name, color }) => dxf.addLayer(name, color));

  const { hoistway, cab, machine, performance } = config;
  
  const scale = 1000;
  const HW  = hoistway.width  * scale;
  const HD  = hoistway.depth  * scale;
  const WT  = hoistway.wallThickness * scale;
  const CW  = cab.width  * scale;
  const CD  = cab.depth  * scale;
  const CWT = 52; 
  const PIT = hoistway.pitDepth * scale;

  const TT = performance.floorHeightsMm.reduce((a, b) => a + b, 0);
  const TSH = PIT + TT + hoistway.overhead * scale;

  // VIEW 1 - FLOOR PLAN
  const planOX = 0, planOY = 0;
  drawWallRect(dxf, planOX, planOY, HW, HD, WT, LAYERS.WALL.name);
  drawCenterLine(dxf, planOX - WT - 200, planOY + HD / 2, planOX + HW + WT + 200, planOY + HD / 2, LAYERS.CENTER.name);
  drawCenterLine(dxf, planOX + HW / 2, planOY - WT - 200, planOX + HW / 2, planOY + HD + WT + 200, LAYERS.CENTER.name);

  const cabPX = planOX + (HW - CW) / 2;
  const cabPY = planOY + (HD - CD) / 2;
  drawClosedRect(dxf, cabPX, cabPY, CW, CD, LAYERS.CAB.name);
  drawClosedRect(dxf, cabPX - CWT, cabPY - CWT, CW + CWT * 2, CD + CWT * 2, LAYERS.CAB.name);

  // VIEW 2 - FRONT ELEVATION
  const elOX = HW + WT * 2 + 2000;
  const elOY = 0;
  drawWallRect(dxf, elOX, elOY, HW, TSH, WT, LAYERS.WALL.name);

  let currentY = elOY + PIT;
  for (let i = 0; i < performance.stops; i++) {
    dxf.addLine(point3d(elOX - WT - 300, currentY), point3d(elOX + HW + WT + 300, currentY), { layerName: LAYERS.DIM.name });
    dxf.addText(point3d(elOX + HW + WT + 350, currentY - 30), 45, `FL.${i + 1}`, { layerName: LAYERS.DIM.name });
    currentY += performance.floorHeightsMm[i] || 3500;
  }

  // TITLE BLOCK
  drawTitleBlock(
    dxf,
    0, -(HD + WT * 2 + 6000),
    {
      title: `ELEVATOR DESIGN — ${cab.ratedLoadKg}KG | ${performance.stops} STOPS`,
      capacity: cab.ratedLoadKg,
      stops: performance.stops,
      speed: machine.speed,
      travel: TT / 1000,
      cwMass: (CW * CD / scale / scale * 200 + 400) + cab.ratedLoadKg * 0.45,
      roping: machine.ropingSystem,
      ropeDia: 8,
      ropeCount: machine.ropeCount,
    },
    LAYERS.TITLE.name
  );

  const blob = new Blob([dxf.stringify()], { type: 'application/dxf' });
  saveAs(blob, `elevator_design_${Date.now()}.dxf`);
}
