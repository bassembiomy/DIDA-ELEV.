// src/store/elevatorStore.ts
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';

export type DoorType = 'center' | 'side';
export type MachineRoomType = 'above' | 'below' | 'none';

export interface HoistwayConfig {
  width: number;
  depth: number;
  pitDepth: number;
  overhead: number;
  wallThickness: number;
  dbg: number; // Distance Between Guides
  cwDistance: number; // Distance from Cab center to CW center
}

export interface CabConfig {
  width: number;
  depth: number;
  height: number;
  doorType: DoorType;
  toeGuardHeight: number;
}

export interface MachineConfig {
  type: 'geared' | 'gearless' | 'hydraulic';
  location: MachineRoomType;
  sheaveDiameter: number;
  speed: number; // m/s
  ropingRatio: 1 | 2 | 4;
  ropeCount: number;
  ropeDiameter: number; // mm
}

export interface PerformanceConfig {
  capacity: number; // kg
  stops: number;
  floorHeight: number; // m
}

export interface ElevatorConfig {
  hoistway: HoistwayConfig;
  cab: CabConfig;
  machine: MachineConfig;
  performance: PerformanceConfig;
}

interface ElevatorStore {
  // Committed state (what 3D viewport sees)
  config: ElevatorConfig;
  
  // Staging state (what inputs edit)
  draftConfig: ElevatorConfig;

  // Actions
  updateDraft: (update: (draft: ElevatorConfig) => void) => void;
  applyDraft: () => void;
  resetDraft: () => void;
  
  // Direct updates (for things that should be real-time if any)
  updateConfig: (partial: Partial<ElevatorConfig>) => void;
}

const initialConfig: ElevatorConfig = {
  hoistway: {
    width: 2.2,
    depth: 2.0,
    pitDepth: 1.5,
    overhead: 3.8,
    wallThickness: 0.2,
    dbg: 1.8,
    cwDistance: 1.1
  },
  cab: {
    width: 1.6,
    depth: 1.5,
    height: 2.3,
    doorType: 'center',
    toeGuardHeight: 0.75
  },
  machine: {
    type: 'gearless',
    location: 'above',
    sheaveDiameter: 400,
    speed: 1.0,
    ropingRatio: 2,
    ropeCount: 6,
    ropeDiameter: 8
  },
  performance: {
    capacity: 1000,
    stops: 5,
    floorHeight: 3.5
  }
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
            config: JSON.parse(JSON.stringify(state.draftConfig))
          })),

          resetDraft: () => set((state) => ({
            draftConfig: JSON.parse(JSON.stringify(state.config))
          })),

          updateConfig: (partial) => set((state) => ({
            config: { ...state.config, ...partial }
          }))
        }),
        {
          name: 'elevator-designer-storage',
          partialize: (state) => ({ config: state.config }), // Only persist committed config
        }
      )
    )
  )
);
