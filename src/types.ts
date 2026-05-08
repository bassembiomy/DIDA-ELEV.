export type GuideRailType = 'T70' | 'T89' | 'T127';

export const ConstraintType = {
    Coincident: 'Coincident',
    Concentric: 'Concentric',
    Parallel: 'Parallel',
    Perpendicular: 'Perpendicular',
    Distance: 'Distance',
    Angle: 'Angle',
    Symmetry: 'Symmetry',
    Lock: 'Lock',
    Limit: 'Limit',
    GearRelation: 'Gear relation',
    PulleyRelation: 'Pulley relation'
} as const;

export type ConstraintType = typeof ConstraintType[keyof typeof ConstraintType];

// --- Base Parameter Types ---
export interface HoistwayParameters {
    shaftWidth: number;      // mm
    shaftDepth: number;      // mm
    shaftHeight: number;     // mm
    pitDepth: number;        // mm
    overheadHeight: number;  // mm
    wallThickness: number;   // mm
}

export interface CabinParameters {
    cabinWidth: number;       // mm
    cabinDepth: number;       // mm
    cabinHeight: number;      // mm
    ratedLoad: number;        // kg
    passengerCount: number;
    doorOpeningWidth: number; // mm
}

export interface CounterweightParameters {
    counterweightMass: number; // kg
    blockCount: number;
    blockMaterial: 'Steel' | 'Cast Iron';
    counterweightPosition: 'Side' | 'Rear';
    guideDistance: number;     // mm
}

export interface RopeSystemParameters {
    ropeDiameter: number;      // mm
    ropeCount: number;
    ropeLength: number;        // mm
    ropeWeight: number;        // kg/m
    sheaveDiameter: number;    // mm
    wrapAngle: number;         // degrees
}

export interface MotorParameters {
    motorPowerKW: number;     // kW
    ratedTorque: number;      // Nm
    rpm: number;              // Rotations per minute
    brakeTorque: number;      // Nm
    efficiency: number;       // Percentage (0.0 - 1.0)
}

// --- BOM & Part Definitions ---
export interface BomEntry {
    partNumber: string;
    partName: string;
    material: string;
    quantity: number;
    weight: number;
    manufacturer: string;
    assemblyLocation: string;
    revision: string;
}

export interface Part {
    id: string;
    name: string;
    bomData: BomEntry;
    meshRef?: string; // Reference to 3D mesh data for rendering
}

export interface Constraint {
    id: string;
    type: ConstraintType;
    targetPartAId: string;
    targetPartBId: string;
    offset?: number;
}

// --- Sub-Assemblies ---
export interface HoistwayAssembly {
    parameters: HoistwayParameters;
    components: {
        shaftWalls: Part[];
        supportBeams: Part[];
        dividerBeams: Part[];
        railBrackets: Part[];
        machineSupportFrame: Part | null;
        pitStructure: Part | null;
        overheadStructure: Part | null;
    };
    constraints: Constraint[];
}

export interface CabinAssembly {
    parameters: CabinParameters;
    components: Record<string, Part | Part[]>;
    constraints: Constraint[];
}

export interface CounterweightAssembly {
    parameters: CounterweightParameters;
    components: Record<string, Part | Part[]>;
    constraints: Constraint[];
}

export interface MachineAssembly {
    parameters: MotorParameters;
    components: Record<string, Part | Part[]>;
    constraints: Constraint[];
}

export interface SuspensionAssembly {
    parameters: RopeSystemParameters;
    components: Record<string, Part | Part[]>;
    constraints: Constraint[];
}

// Root Elevator Assembly Model (Section 2)
export interface ElevatorAssembly {
    id: string;
    projectName: string;
    hoistwayAssembly: HoistwayAssembly;
    cabinAssembly: CabinAssembly;
    counterweightAssembly: CounterweightAssembly;
    machineAssembly: MachineAssembly;
    suspensionAssembly: SuspensionAssembly;

    // Placeholders for remaining assemblies
    guideRailAssembly?: any;
    doorAssembly?: any;
    safetyAssembly?: any;
    electricalAssembly?: any;
}