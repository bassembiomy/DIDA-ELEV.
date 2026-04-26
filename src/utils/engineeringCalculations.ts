// src/utils/engineeringCalculations.ts
import type { ElevatorConfig } from '../store/elevatorStore';

export interface EngineeringResults {
  totalTravel: number;
  totalShaftHeight: number;
  counterweightMass: number;
  ropeLength: number;
  totalLoadOnMachine: number; // Simplified
  cabWeight: number; // Estimated dead weight
}

export function calculateEngineering(config: ElevatorConfig): EngineeringResults {
  const { hoistway, performance, machine, cab } = config;

  // 1. Total Travel
  const totalTravel = (performance.stops - 1) * performance.floorHeight;

  // 2. Total Shaft Height
  const totalShaftHeight = hoistway.pitDepth + totalTravel + hoistway.overhead;

  // 3. Counterweight Mass (W = G + k*Q)
  // Estimated Cab Dead Weight (G) based on volume
  const G = (cab.width * cab.depth * cab.height) * 200; // Rough: 200kg per m3
  const k = 0.45; // Balancing coefficient (usually 0.45 - 0.50)
  const Q = performance.capacity;
  const counterweightMass = G + (k * Q);

  // 4. Rope Length (Simplified)
  // Length = Ratio * (Shaft Height + extra for loops)
  const ropeLength = machine.ropingRatio * (totalShaftHeight + 10);

  // 5. Total Load on Machine (Approximate Static Load including ropes)
  const totalLoadOnMachine = G + Q + counterweightMass + (ropeLength * machine.ropeCount * 0.4); // ~0.4kg/m per rope

  return {
    totalTravel,
    totalShaftHeight,
    counterweightMass,
    ropeLength,
    totalLoadOnMachine,
    cabWeight: G
  };
}
