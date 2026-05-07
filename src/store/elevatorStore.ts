// src/store/elevatorStore.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';

export type DoorType = 'center' | 'side';
export type MachineRoomType = 'above' | 'below' | 'none';
export type WallMaterial = 'concrete' | 'brick' | 'steel';
export type SlingType = 'standard' | 'underslung';
export type BrakeType = 'disc' | 'drum';

export interface HoistwayConfig {
  width: number;
  depth: number;
  pitDepth: number;
  overhead: number;
  wallThickness: number;   // m — EN 81-20 min 200mm
  wallMaterial: WallMaterial;
  dbg: number;             // Distance Between Guides (m)
  cwDistance: number;      // CW center offset from cab center (m)
}

export interface CabConfig {
  width: number;
  depth: number;
  height: number;
  doorType: DoorType;
  toeGuardHeight: number;
  wallThickness: number;   // cab interior panel thickness (m), default 0.052
  floorThickness: number;  // cab floor slab thickness (m), default 0.080
  slingType: SlingType;
}

export interface MachineConfig {
  type: 'geared' | 'gearless' | 'hydraulic';
  location: MachineRoomType;
  sheaveDiameter: number;  // mm
  speed: number;           // m/s
  ropingRatio: 1 | 2 | 4;
  ropeCount: number;
  ropeDiameter: number;    // mm
  motorPower: number;      // kW
  brakeType: BrakeType;
}

export interface PerformanceConfig {
  capacity: number;        // kg
  stops: number;
  floorHeight: number;     // m
}

export interface ElevatorConfig {
  hoistway: HoistwayConfig;
  cab: CabConfig;
  machine: MachineConfig;
  performance: PerformanceConfig;
}

interface ElevatorStore {
  config: ElevatorConfig;
  draftConfig: ElevatorConfig;
  updateDraft: (update: (draft: ElevatorConfig) => void) => void;
  applyDraft: () => void;
  resetDraft: () => void;
  updateConfig: (partial: Partial<ElevatorConfig>) => void;
}

const initialConfig: ElevatorConfig = {
  hoistway: {
    width: 2.2,
    depth: 2.0,
    pitDepth: 1.5,
    overhead: 3.8,
    wallThickness: 0.2,
    wallMaterial: 'concrete',
    dbg: 1.8,
    cwDistance: 1.1,
  },
  cab: {
    width: 1.6,
    depth: 1.5,
    height: 2.3,
    doorType: 'center',
    toeGuardHeight: 0.75,
    wallThickness: 0.052,
    floorThickness: 0.080,
    slingType: 'standard',
  },
  machine: {
    type: 'gearless',
    location: 'above',
    sheaveDiameter: 400,
    speed: 1.0,
    ropingRatio: 2,
    ropeCount: 6,
    ropeDiameter: 8,
    motorPower: 15,
    brakeType: 'disc',
  },
  performance: {
    capacity: 1000,
    stops: 5,
    floorHeight: 3.5,
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

          updateConfig: (partial) => set((state) => ({
            config: { ...state.config, ...partial },
          })),
        }),
        {
          name: 'elevator-designer-storage-v2',
          partialize: (state) => ({ config: state.config }),
        }
      )
    )
  )
);
