// src/utils/engineBridge.ts
import type { ElevatorConfig } from '../store/elevatorStore';

const ENGINE_URL = 'http://localhost:5281';

export interface EngineeringResult {
  totalShaftHeight: number;
  totalTravel: number;
  cabWeight: number;
  counterweightMass: number;
  ratedLoad: number;
  requiredMotorPowerKw: number;
  tractionRatio: number;
  tractionSafetyValid: boolean;
  bufferStrokeCab: number;
  bufferStrokeCw: number;
  safetyGearActivationSpeed: number;
}

export interface MeshData {
  name: string;
  vertices: number[];
  normals: number[];
  indices: number[];
  material: string;
}

export interface AssemblyGeometry {
  meshes: MeshData[];
}

export interface DrawingEntity {
  type: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  layer: string;
}

export interface DrawingView {
  name: string;
  entities: DrawingEntity[];
}

export interface AssemblyDrawing {
  views: DrawingView[];
}

export async function calculateWithCSharp(config: ElevatorConfig): Promise<EngineeringResult | null> {
  try {
    const response = await fetch(`${ENGINE_URL}/api/solver/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      console.error('C# Engine error:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to connect to C# Engine:', error);
    return null;
  }
}

export async function fetchGeometry(config: ElevatorConfig): Promise<AssemblyGeometry | null> {
  try {
    const response = await fetch(`${ENGINE_URL}/api/geometry/assembly`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch C# geometry:', error);
    return null;
  }
}

export async function fetchDrawings(config: ElevatorConfig): Promise<AssemblyDrawing | null> {
  try {
    const response = await fetch(`${ENGINE_URL}/api/geometry/drawings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch C# drawings:', error);
    return null;
  }
}

export async function checkEngineHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ENGINE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}
