// src/utils/engineeringCalculations.ts
import type { ElevatorConfig } from '../store/elevatorStore';

export interface EngineeringResults {
  totalTravel: number;
  totalShaftHeight: number;
  counterweightMass: number;
  ropeLength: number;
  totalLoadOnMachine: number;
  cabWeight: number;
  // EN 81-20 compliance values
  bufferStroke: number;        // m — oil buffer stroke (EN 81-20 §5.8.2)
  minPitDepth: number;         // m — minimum required pit depth (EN 81-20 §5.7.3.3)
  minOverhead: number;         // m — minimum required overhead (EN 81-20 §5.7.1.1)
  pitClearance: number;        // m — actual pit clearance
  overheadClearance: number;   // m — actual overhead clearance
  slingUprightLoad: number;    // N — load per upright
}

export function calculateEngineering(config: ElevatorConfig): EngineeringResults {
  const { hoistway, performance, machine, cab } = config;

  // 1. Total Travel
  const totalTravel = (performance.stops - 1) * performance.floorHeight;

  // 2. Total Shaft Height
  const totalShaftHeight = hoistway.pitDepth + totalTravel + hoistway.overhead;

  // 3. Counterweight Mass — W = G + k·Q
  const G = (cab.width * cab.depth * cab.height) * 200; // ~200 kg/m³ estimate
  const k = 0.45; // balancing factor (EN 81-20 typically 0.40–0.50)
  const Q = performance.capacity;
  const counterweightMass = G + k * Q;

  // 4. Rope Length (simplified)
  const ropeLength = machine.ropingRatio * (totalShaftHeight + 10);

  // 5. Total Load on Machine
  const ropeLinearMass = 0.4; // kg/m per rope (8mm rope ≈ 0.4 kg/m)
  const totalLoadOnMachine = G + Q + counterweightMass + ropeLength * machine.ropeCount * ropeLinearMass;

  // 6. Buffer Stroke — EN 81-20 §5.8.2.2 (oil buffer)
  //    h_s ≥ 0.135 · v² but minimum 420mm for oil buffers below 1 m/s
  const v = machine.speed;
  const bufferStroke = Math.max(0.420, 0.135 * v * v);

  // 7. Minimum Pit Depth — EN 81-20 §5.7.3.3
  //    = buffer compressed height (≈0.20m) + clearance (0.50m) + buffer stroke
  const minPitDepth = 0.20 + 0.50 + bufferStroke;

  // 8. Minimum Overhead — EN 81-20 §5.7.1.1 (simplified)
  //    = 1000mm + max(400mm, 2/3 · buffer stroke)
  const minOverhead = 1.000 + Math.max(0.400, (2 / 3) * bufferStroke) + 0.035 * v * v;

  // 9. Clearances (actual vs required)
  const pitClearance = hoistway.pitDepth - minPitDepth;
  const overheadClearance = hoistway.overhead - minOverhead;

  // 10. Sling upright load (each of 2 uprights carries half the static load)
  const slingUprightLoad = ((G + Q) / 2) * 9.81; // N

  return {
    totalTravel,
    totalShaftHeight,
    counterweightMass,
    ropeLength,
    totalLoadOnMachine,
    cabWeight: G,
    bufferStroke,
    minPitDepth,
    minOverhead,
    pitClearance,
    overheadClearance,
    slingUprightLoad,
  };
}
