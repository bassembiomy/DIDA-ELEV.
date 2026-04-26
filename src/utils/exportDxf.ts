// src/utils/exportDxf.ts
import { DxfWriter, point3d } from '@tarikjabiri/dxf';
import { saveAs } from 'file-saver';
import type { ElevatorConfig } from '../store/elevatorStore';
import { calculateEngineering } from './engineeringCalculations';

export function exportToDxf(config: ElevatorConfig) {
  const dxf = new DxfWriter();

  // 1. Define ISO Layers
  dxf.addLayer('SHAFT_OUTLINE', 7); // White/Black
  dxf.addLayer('CAB_OUTLINE', 5);   // Blue
  dxf.addLayer('DOORS', 4);         // Cyan
  dxf.addLayer('RAILS', 8);         // Gray
  dxf.addLayer('DIMENSIONS', 1);    // Red
  dxf.addLayer('TITLE_BLOCK', 7);

  const { hoistway, cab, machine, performance } = config;
  const { totalShaftHeight, totalTravel, counterweightMass } = calculateEngineering(config);

  const hw = hoistway.width * 1000;
  const hd = hoistway.depth * 1000;
  const cw = cab.width * 1000;
  const cd = cab.depth * 1000;
  const pit = hoistway.pitDepth * 1000;
  const totalH = totalShaftHeight * 1000;

  // --- VIEW 1: FLOOR PLAN (Top Down) ---
  const planX = 0, planY = 0;

  // Shaft Outline
  drawRect(dxf, planX, planY, hw, hd, 'SHAFT_OUTLINE');

  // Cab Outline (centered)
  const cabX = planX + (hw - cw) / 2;
  const cabY = planY + (hd - cd) / 2;
  drawRect(dxf, cabX, cabY, cw, cd, 'CAB_OUTLINE');

  // Doors
  dxf.addLine(point3d(cabX, cabY + cd), point3d(cabX + cw, cabY + cd), { layerName: 'DOORS' });

  // Annotations
  dxf.addText(point3d(planX, planY - 200), 50, `FLOOR PLAN (STOPS: ${performance.stops})`, { layerName: 'TITLE_BLOCK' });

  // --- VIEW 2: FRONT ELEVATION ---
  const elevX = hw + 1000, elevY = 0;

  // Shaft Outline
  drawRect(dxf, elevX, elevY, hw, totalH, 'SHAFT_OUTLINE');

  // Floor Levels
  for (let i = 0; i < performance.stops; i++) {
    const y = pit + (i * performance.floorHeight * 1000);
    dxf.addLine(point3d(elevX - 200, elevY + y), point3d(elevX + hw + 200, elevY + y), { layerName: 'DIMENSIONS' });
    dxf.addText(point3d(elevX + hw + 300, elevY + y), 40, `FLOOR ${i + 1}`, { layerName: 'DIMENSIONS' });
  }

  // Cab in elevation
  const cabHeight = 2300;
  drawRect(dxf, elevX + (hw - cw) / 2, elevY + pit + 500, cw, cabHeight, 'CAB_OUTLINE');

  // Annotations
  dxf.addText(point3d(elevX, elevY - 200), 50, 'FRONT ELEVATION', { layerName: 'TITLE_BLOCK' });

  // --- TITLE BLOCK ---
  const tbX = 0, tbY = -3000;
  drawRect(dxf, tbX, tbY, 5000, 1200, 'TITLE_BLOCK');
  dxf.addText(point3d(tbX + 100, tbY + 900), 80, `PROJECT: ${performance.capacity}KG ELEVATOR - ${performance.stops} STOPS`, { layerName: 'TITLE_BLOCK' });
  dxf.addText(point3d(tbX + 100, tbY + 700), 60, `TRAVEL: ${totalTravel.toFixed(2)}m | ROPING: ${machine.ropingRatio}:1`, { layerName: 'TITLE_BLOCK' });
  dxf.addText(point3d(tbX + 100, tbY + 500), 60, `CW MASS: ${counterweightMass.toFixed(0)}kg | ROPE Ø: ${machine.ropeDiameter}mm (${machine.ropeCount}x)`, { layerName: 'TITLE_BLOCK' });

  // Export
  const dxfString = dxf.stringify();
  const blob = new Blob([dxfString], { type: 'application/dxf' });
  saveAs(blob, `elevator_pro_${Date.now()}.dxf`);
}

function drawRect(dxf: DxfWriter, x: number, y: number, w: number, h: number, layer: string) {
  dxf.addLine(point3d(x, y), point3d(x + w, y), { layerName: layer });
  dxf.addLine(point3d(x + w, y), point3d(x + w, y + h), { layerName: layer });
  dxf.addLine(point3d(x + w, y + h), point3d(x, y + h), { layerName: layer });
  dxf.addLine(point3d(x, y + h), point3d(x, y), { layerName: layer });
}
