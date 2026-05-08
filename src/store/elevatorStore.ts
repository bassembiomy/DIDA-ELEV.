// src/store/elevatorStore.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';

export type DoorType = 'Center Opening' | 'Side Opening' | 'Telescopic';
export type MachineRoomLocation = 'Top' | 'Bottom' | 'Side' | 'None';
export type ElevatorType = 'Passenger Elevator' | 'Freight Elevator' | 'Hospital Elevator' | 'Panoramic Elevator' | 'Home Elevator';

export interface HoistwayConfig {
  width: number;
  depth: number;
  pitDepth: number;
  overhead: number;
  wallThickness: number;
  wallMaterial: string;
  dbg: number;
  cwDistance: number;
  machineRoomLocation: MachineRoomLocation;
}

export interface CabConfig {
  width: number;
  depth: number;
  height: number;
  doorType: DoorType;
  toeGuardHeight: number;
  cabinMaterial: string;
  floorMaterial: string;
  ratedLoadKg: number;
  passengerCapacity: number;
}

export interface MachineConfig {
  machineType: 'Gearless' | 'Geared' | 'Hydraulic';
  sheaveDiameter: number;
  speed: number;
  ropingSystem: '1:1 Roping' | '2:1 Roping' | '4:1 Roping';
  ropeCount: number;
  ropeDiameter: number;
  efficiency: number;
}

export interface PerformanceConfig {
  elevatorType: ElevatorType;
  stops: number;
  floorHeightsMm: number[];
  nominalSpeed: number;
  acceleration: number;
  jerk: number;
}

export interface SimulationState {
  currentPosition: number;
  currentVelocity: number;
  currentAcceleration: number;
  doorStatus: string;
  currentFloor: number;
}

export interface ElevatorConfig {
  hoistway: HoistwayConfig;
  cab: CabConfig;
  machine: MachineConfig;
  performance: PerformanceConfig;
  simulation: SimulationState;
}

interface ElevatorStore {
  config: ElevatorConfig;
  draftConfig: ElevatorConfig;
  updateDraft: (update: (draft: ElevatorConfig) => void) => void;
  applyDraft: () => void;
  resetDraft: () => void;
}

const initialConfig: ElevatorConfig = {
  hoistway: {
    width: 2.2,
    depth: 2.0,
    pitDepth: 1.5,
    overhead: 3.8,
    wallThickness: 0.2,
    wallMaterial: 'Concrete',
    dbg: 1.8,
    cwDistance: 0.85,
    machineRoomLocation: 'Top',
  },
  cab: {
    width: 1.6,
    depth: 1.5,
    height: 2.3,
    doorType: 'Center Opening',
    toeGuardHeight: 0.75,
    cabinMaterial: 'Steel',
    floorMaterial: 'Granite',
    ratedLoadKg: 1000,
    passengerCapacity: 13,
  },
  machine: {
    machineType: 'Gearless',
    sheaveDiameter: 400,
    speed: 1.0,
    ropingSystem: '2:1 Roping',
    ropeCount: 6,
    ropeDiameter: 8,
    efficiency: 0.85,
  },
  performance: {
    elevatorType: 'Passenger Elevator',
    stops: 5,
    floorHeightsMm: [3500, 3500, 3500, 3500, 3500],
    nominalSpeed: 1.0,
    acceleration: 1.0,
    jerk: 1.0,
  },
  simulation: {
    currentPosition: 0,
    currentVelocity: 0,
    currentAcceleration: 0,
    doorStatus: 'Closed',
    currentFloor: 0,
  },
};

export const useElevatorStore = create<ElevatorStore>()(
  temporal(
    subscribeWithSelector(
      persist(
        (set) => ({
          config: initialConfig,
          draftConfig: initialConfig,

          updateDraft: (update) => set((state) => {
            const newDraft = JSON.parse(JSON.stringify(state.draftConfig));
            update(newDraft);
            return { draftConfig: newDraft };
          }),

          applyDraft: () => set((state) => ({
            config: JSON.parse(JSON.stringify(state.draftConfig)),
          })),

          resetDraft: () => set((state) => ({
            draftConfig: JSON.parse(JSON.stringify(state.config)),
          })),
        }),
        {
          name: 'elevator-designer-storage-v3',
          partialize: (state) => ({ config: state.config }),
        }
      )
    )
  )
);
