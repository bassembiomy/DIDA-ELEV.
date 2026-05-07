// src/App.tsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls, Grid, Environment, ContactShadows,
  GizmoHelper, GizmoViewport,
} from '@react-three/drei';
import * as THREE from 'three';
import { ElevatorCab } from './components/ElevatorCab';
import { Hoistway } from './components/Hoistway';
import { Counterweight, Machine } from './components/ElevatorExtras';
import { MachineRoom } from './components/MachineRoom';
import { PitEquipment } from './components/PitEquipment';
import { LandingDoorSystem } from './components/LandingDoors';
import { ShaftAccessories } from './components/ShaftAccessories';
import { Drawing2DPanel } from './components/Drawing2DPanel';
import { useElevatorStore } from './store/elevatorStore';
import { exportToDxf } from './utils/exportDxf';
import { Accordion, InputGroup } from './components/ui/Accordion';
import { validateElevator } from './utils/validationEngine';
import type { ValidationIssue } from './utils/validationEngine';
import { calculateEngineering } from './utils/engineeringCalculations';
import {
  Box, Settings, Cpu, Ruler, Activity, Download,
  RotateCcw, RotateCw, RefreshCcw, Maximize2,
  AlertTriangle, CheckCircle2, Eye, Layout,
} from 'lucide-react';

type AppMode = '3d' | '2d';

// ── Validation Panel ──────────────────────────────────────────────────────────
function ValidationPanel({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 text-green-700">
        <CheckCircle2 size={16} />
        <span className="text-xs font-bold">ALL STANDARDS VALIDATED (EN 81-20)</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {issues.map((issue) => (
        <div
          key={issue.id}
          className={`p-3 border rounded-lg flex flex-col gap-1 ${
            issue.severity === 'error'
              ? 'bg-red-50 border-red-100 text-red-700'
              : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
            <AlertTriangle size={13} />
            {issue.category} — {issue.code}
          </div>
          <p className="text-xs leading-relaxed">{issue.message}</p>
        </div>
      ))}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ issues }: { issues: ValidationIssue[] }) {
  const { draftConfig, updateDraft, applyDraft, config } = useElevatorStore();
  const eng = calculateEngineering(draftConfig);
  const isDirty = JSON.stringify(draftConfig) !== JSON.stringify(config);

  return (
    <div className="absolute top-0 left-0 w-80 h-full bg-white/95 backdrop-blur-xl shadow-2xl z-20 flex flex-col border-r border-gray-200">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
            <Maximize2 size={18} />
          </div>
          DIDA-ELEV
        </h1>
        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Professional Elevator Designer</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Validation */}
        <div className="p-4 border-b bg-gray-50/30">
          <ValidationPanel issues={issues} />
        </div>

        {/* EN 81-20 Engineering Summary */}
        <div className="p-4 bg-slate-900 text-white flex flex-col gap-1.5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Engineering Summary</p>
          {[
            ['Total Travel', `${eng.totalTravel.toFixed(2)} m`],
            ['Shaft Height', `${eng.totalShaftHeight.toFixed(2)} m`],
            ['CW Mass', `${eng.counterweightMass.toFixed(0)} kg`],
            ['Rope Length', `${eng.ropeLength.toFixed(1)} m`],
            ['Buffer Stroke', `${(eng.bufferStroke * 1000).toFixed(0)} mm`],
            ['Min Pit Depth', `${eng.minPitDepth.toFixed(2)} m`],
            ['Min Overhead', `${eng.minOverhead.toFixed(2)} m`],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between text-[10px] font-bold opacity-70 uppercase">
              <span>{label}</span>
              <span className="text-blue-300">{val}</span>
            </div>
          ))}
          {/* Clearance indicators */}
          <div className={`mt-1 text-[10px] font-bold ${eng.pitClearance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Pit Clearance: {eng.pitClearance >= 0 ? '✓' : '✗'} {(eng.pitClearance * 1000).toFixed(0)} mm
          </div>
          <div className={`text-[10px] font-bold ${eng.overheadClearance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Overhead Clearance: {eng.overheadClearance >= 0 ? '✓' : '✗'} {(eng.overheadClearance * 1000).toFixed(0)} mm
          </div>
        </div>

        {/* Hoistway */}
        <Accordion title="Hoistway" icon={<Ruler size={16} />} defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Width (m)', 'hoistway.width', 0.1],
              ['Depth (m)', 'hoistway.depth', 0.1],
              ['Pit Depth (m)', 'hoistway.pitDepth', 0.1],
              ['Overhead (m)', 'hoistway.overhead', 0.1],
              ['DBG (m)', 'hoistway.dbg', 0.05],
              ['CW Dist (m)', 'hoistway.cwDistance', 0.05],
              ['Wall Thick (m)', 'hoistway.wallThickness', 0.05],
            ].map(([label, path, step]) => {
              const [section, field] = (path as string).split('.');
              const value = (draftConfig as any)[section][field];
              return (
                <InputGroup key={path as string} label={label as string}>
                  <input type="number" step={step as number} value={value}
                    onChange={(e) => updateDraft((d: any) => { d[section][field] = parseFloat(e.target.value) || 0; })}
                    className="input-field" />
                </InputGroup>
              );
            })}
            <InputGroup label="Wall Material">
              <select value={draftConfig.hoistway.wallMaterial}
                onChange={(e) => updateDraft((d) => { d.hoistway.wallMaterial = e.target.value as any; })}
                className="input-field">
                <option value="concrete">Concrete</option>
                <option value="brick">Brick</option>
                <option value="steel">Steel</option>
              </select>
            </InputGroup>
          </div>
        </Accordion>

        {/* Cab */}
        <Accordion title="Cab & Doors" icon={<Box size={16} />}>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Cab Width (m)', 'cab.width', 0.1],
              ['Cab Depth (m)', 'cab.depth', 0.1],
              ['Cab Height (m)', 'cab.height', 0.1],
              ['Toe Guard (m)', 'cab.toeGuardHeight', 0.05],
              ['Wall Thick (m)', 'cab.wallThickness', 0.001],
              ['Floor Thick (m)', 'cab.floorThickness', 0.005],
            ].map(([label, path, step]) => {
              const [section, field] = (path as string).split('.');
              const value = (draftConfig as any)[section][field];
              return (
                <InputGroup key={path as string} label={label as string}>
                  <input type="number" step={step as number} value={value}
                    onChange={(e) => updateDraft((d: any) => { d[section][field] = parseFloat(e.target.value) || 0; })}
                    className="input-field" />
                </InputGroup>
              );
            })}
            <InputGroup label="Door Type">
              <select value={draftConfig.cab.doorType}
                onChange={(e) => updateDraft((d) => { d.cab.doorType = e.target.value as any; })}
                className="input-field">
                <option value="center">Center Opening</option>
                <option value="side">Side Opening</option>
              </select>
            </InputGroup>
            <InputGroup label="Sling Type">
              <select value={draftConfig.cab.slingType}
                onChange={(e) => updateDraft((d) => { d.cab.slingType = e.target.value as any; })}
                className="input-field">
                <option value="standard">Standard</option>
                <option value="underslung">Underslung</option>
              </select>
            </InputGroup>
          </div>
        </Accordion>

        {/* Machine */}
        <Accordion title="Machine & Roping" icon={<Cpu size={16} />}>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Location">
              <select value={draftConfig.machine.location}
                onChange={(e) => updateDraft((d) => { d.machine.location = e.target.value as any; })}
                className="input-field">
                <option value="above">Above (MR)</option>
                <option value="below">Below</option>
                <option value="none">MRL</option>
              </select>
            </InputGroup>
            <InputGroup label="Roping Ratio">
              <select value={draftConfig.machine.ropingRatio}
                onChange={(e) => updateDraft((d) => { d.machine.ropingRatio = parseInt(e.target.value) as any; })}
                className="input-field">
                <option value="1">1:1</option>
                <option value="2">2:1</option>
                <option value="4">4:1</option>
              </select>
            </InputGroup>
            <InputGroup label="Brake Type">
              <select value={draftConfig.machine.brakeType}
                onChange={(e) => updateDraft((d) => { d.machine.brakeType = e.target.value as any; })}
                className="input-field">
                <option value="disc">Disc Brake</option>
                <option value="drum">Drum Brake</option>
              </select>
            </InputGroup>
            <InputGroup label="Motor Power (kW)">
              <input type="number" step="1" value={draftConfig.machine.motorPower}
                onChange={(e) => updateDraft((d) => { d.machine.motorPower = parseInt(e.target.value) || 0; })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Speed (m/s)">
              <input type="number" step="0.1" value={draftConfig.machine.speed}
                onChange={(e) => updateDraft((d) => { d.machine.speed = parseFloat(e.target.value) || 0; })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Sheave Ø (mm)">
              <input type="number" step="10" value={draftConfig.machine.sheaveDiameter}
                onChange={(e) => updateDraft((d) => { d.machine.sheaveDiameter = parseInt(e.target.value) || 0; })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Rope Count">
              <input type="number" value={draftConfig.machine.ropeCount}
                onChange={(e) => updateDraft((d) => { d.machine.ropeCount = parseInt(e.target.value) || 0; })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Rope Ø (mm)">
              <input type="number" value={draftConfig.machine.ropeDiameter}
                onChange={(e) => updateDraft((d) => { d.machine.ropeDiameter = parseInt(e.target.value) || 0; })}
                className="input-field" />
            </InputGroup>
          </div>
        </Accordion>

        {/* Performance */}
        <Accordion title="Performance" icon={<Activity size={16} />}>
          <div className="flex flex-col gap-3">
            <InputGroup label="Capacity (kg)">
              <input type="number" value={draftConfig.performance.capacity}
                onChange={(e) => updateDraft((d) => { d.performance.capacity = parseInt(e.target.value) || 0; })}
                className="input-field" />
            </InputGroup>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="Stops">
                <input type="number" value={draftConfig.performance.stops}
                  onChange={(e) => updateDraft((d) => { d.performance.stops = parseInt(e.target.value) || 0; })}
                  className="input-field" />
              </InputGroup>
              <InputGroup label="Floor Height (m)">
                <input type="number" step="0.1" value={draftConfig.performance.floorHeight}
                  onChange={(e) => updateDraft((d) => { d.performance.floorHeight = parseFloat(e.target.value) || 0; })}
                  className="input-field" />
              </InputGroup>
            </div>
          </div>
        </Accordion>
      </div>

      {/* Footer actions */}
      <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-2">
        <button
          onClick={applyDraft}
          disabled={!isDirty}
          className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all text-sm ${
            isDirty
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <RefreshCcw size={16} className={isDirty ? 'animate-spin-slow' : ''} />
          UPDATE DESIGN
        </button>
        <button
          onClick={() => exportToDxf(config)}
          className="w-full py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <Download size={16} />
          EXPORT DXF
        </button>
      </div>
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────────────────────
function TopBar({ issues, mode, setMode }: {
  issues: ValidationIssue[];
  mode: AppMode;
  setMode: (m: AppMode) => void;
}) {
  const { undo, redo } = useElevatorStore.temporal.getState();
  const hasErrors = issues.some((i) => i.severity === 'error');

  return (
    <div className="absolute top-0 right-0 left-80 h-14 bg-white/90 backdrop-blur-md border-b border-gray-200 z-10 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <button onClick={() => undo()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Undo"><RotateCcw size={18} /></button>
        <button onClick={() => redo()} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Redo"><RotateCw size={18} /></button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        {/* Mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setMode('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              mode === '3d' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye size={14} /> 3D View
          </button>
          <button
            onClick={() => setMode('2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              mode === '2d' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layout size={14} /> 2D Drawings
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Project Status</span>
          {hasErrors ? (
            <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> VALIDATION FAILED
            </span>
          ) : (
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> READY FOR EXPORT
            </span>
          )}
        </div>
        <button className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"><Settings size={18} /></button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { config, draftConfig } = useElevatorStore();
  const [mode, setMode] = useState<AppMode>('3d');

  const issues = validateElevator(draftConfig);
  const committedIssues = validateElevator(config);

  return (
    <div className="relative w-screen h-screen bg-[#f8fafc] overflow-hidden text-slate-900">
      <Sidebar issues={issues} />
      <TopBar issues={committedIssues} mode={mode} setMode={setMode} />

      <main className="w-full h-full pl-80 pt-14">
        {mode === '2d' ? (
          <Drawing2DPanel />
        ) : (
          <Canvas shadows camera={{ position: [8, 8, 12], fov: 40 }}>
            <color attach="background" args={['#f8fafc']} />
            <ambientLight intensity={0.6} />
            <spotLight position={[12, 22, 12]} angle={0.18} penumbra={1} intensity={2.0} castShadow shadow-mapSize={[2048, 2048]} />
            <directionalLight position={[-6, 8, 6]} intensity={0.6} />
            <Environment preset="city" />

            <group position={[0, 0, 0]}>
              <Hoistway />
              <ElevatorCab />
              <Counterweight />
              <Machine />
              <MachineRoom />
              <PitEquipment />
              <LandingDoorSystem />
              <ShaftAccessories />
              <ContactShadows
                position={[0, -config.hoistway.pitDepth, 0]}
                opacity={0.25} scale={18} blur={2.5} far={12}
              />
            </group>

            <Grid
              position={[0, -config.hoistway.pitDepth - config.hoistway.wallThickness, 0]}
              infiniteGrid fadeDistance={60}
              cellColor="#e2e8f0" sectionColor="#cbd5e1"
            />

            <OrbitControls
              makeDefault enableDamping dampingFactor={0.05}
              minDistance={2} maxDistance={80}
              mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                MIDDLE: THREE.MOUSE.ROTATE,
                RIGHT: THREE.MOUSE.PAN,
              }}
              touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
            />

            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
              <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="black" />
            </GizmoHelper>
          </Canvas>
        )}
      </main>

      {mode === '3d' && (
        <div className="absolute bottom-5 right-5 flex flex-col items-end gap-1.5 pointer-events-none">
          <div className="bg-white/90 px-3 py-1.5 rounded-full shadow text-xs font-medium text-slate-700 border border-slate-200 backdrop-blur-md">
            Left/Mid-drag: Orbit · Scroll: Zoom · Right-drag: Pan
          </div>
          <div className="bg-slate-900 px-3 py-1.5 rounded-full shadow text-[10px] font-mono text-slate-300 border border-slate-800 uppercase tracking-widest backdrop-blur-md">
            EN 81-20 · ISO 4190 · ISO 7465
          </div>
        </div>
      )}
    </div>
  );
}
