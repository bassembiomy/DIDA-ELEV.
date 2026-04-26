// src/utils/validationEngine.ts
import type { ElevatorConfig } from '../store/elevatorStore';

export interface ValidationIssue {
  id: string;
  category: 'hoistway' | 'cab' | 'machine' | 'clearance';
  severity: 'error' | 'warning';
  message: string;
  code?: string; // e.g. EN 81-20 §5.2.3
}

const EN81_20_TABLE_6 = [
  [100, 0.37], [180, 0.58], [225, 0.70], [300, 0.90], [375, 1.10], [400, 1.17],
  [450, 1.30], [525, 1.45], [600, 1.60], [630, 1.66], [675, 1.75], [750, 1.90],
  [800, 2.00], [825, 2.05], [900, 2.20], [975, 2.35], [1000, 2.40], [1050, 2.50],
  [1125, 2.65], [1200, 2.80], [1250, 2.90], [1275, 2.95], [1350, 3.10], [1425, 3.25],
  [1500, 3.40], [1600, 3.56], [2000, 4.20], [2500, 5.00]
];

function getMaxCabArea(capacity: number): number {
  if (capacity <= 100) return 0.37;
  if (capacity >= 2500) return 5.00 + ((capacity - 2500) / 100) * 0.16;

  const upperIndex = EN81_20_TABLE_6.findIndex(([c]) => c >= capacity);
  if (upperIndex <= 0) return EN81_20_TABLE_6[0][1];
  const [c1, a1] = EN81_20_TABLE_6[upperIndex - 1];
  const [c2, a2] = EN81_20_TABLE_6[upperIndex];

  return a1 + (capacity - c1) * (a2 - a1) / (c2 - c1);
}

export function validateElevator(config: ElevatorConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { hoistway, cab, machine, performance } = config;

  // 1. Hoistway vs Cab Dimensions (Clearances)
  const lateralClearance = (hoistway.width - cab.width) / 2;
  const depthClearance = (hoistway.depth - cab.depth) / 2;

  if (lateralClearance < 0.2) {
    issues.push({
      id: 'clearance-width',
      category: 'clearance',
      severity: 'error',
      message: `Lateral clearance too small (${(lateralClearance * 1000).toFixed(0)}mm). Minimum 200mm required.`,
      code: 'EN 81-20 §5.2.2'
    });
  }

  if (depthClearance < 0.2) {
    issues.push({
      id: 'clearance-depth',
      category: 'clearance',
      severity: 'error',
      message: `Depth clearance too small (${(depthClearance * 1000).toFixed(0)}mm). Minimum 200mm required.`,
      code: 'EN 81-20 §5.2.2'
    });
  }

  // 2. Overhead Validation (simplified speed-based)
  const minOverhead = 3.5 + (machine.speed * 0.3); // Rough empirical formula
  if (hoistway.overhead < minOverhead) {
    issues.push({
      id: 'overhead-height',
      category: 'hoistway',
      severity: 'error',
      message: `Overhead height (${hoistway.overhead}m) is below minimum required for ${machine.speed}m/s (${minOverhead.toFixed(2)}m).`,
      code: 'EN 81-20 §5.2.5.7'
    });
  }

  // 3. Pit Depth Validation
  if (hoistway.pitDepth < 1.2) {
    issues.push({
      id: 'pit-depth',
      category: 'hoistway',
      severity: 'warning',
      message: `Pit depth (${hoistway.pitDepth}m) is shallow. Recommend ≥ 1.5m for professional installations.`,
      code: 'ISO 22200 Rec.'
    });
  }

  // 4. Capacity vs Cab Area (Exact EN 81-20 Table 6)
  const cabArea = cab.width * cab.depth;
  const maxAreaForCapacity = getMaxCabArea(performance.capacity);
  if (cabArea > maxAreaForCapacity) {
    issues.push({
      id: 'capacity-area',
      category: 'cab',
      severity: 'error',
      message: `Cab area (${cabArea.toFixed(2)}m²) exceeds maximum allowed (${maxAreaForCapacity.toFixed(2)}m²) for ${performance.capacity}kg capacity.`,
      code: 'EN 81-20 §5.4.2 Table 6'
    });
  }

  return issues;
}
