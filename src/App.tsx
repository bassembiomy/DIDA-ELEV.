// src/App.tsx
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  Environment, 
  ContactShadows, 
  GizmoHelper, 
  GizmoViewport 
} from '@react-three/drei';
import * as THREE from 'three';
import { ElevatorCab } from './components/ElevatorCab';
import { Hoistway } from './components/Hoistway';
import { Counterweight, Machine } from './components/ElevatorExtras';
import { useElevatorStore } from './store/elevatorStore';
import { exportToDxf } from './utils/exportDxf';
import { Accordion, InputGroup } from './components/ui/Accordion';
import { validateElevator } from './utils/validationEngine';
import type { ValidationIssue } from './utils/validationEngine';
import { calculateEngineering } from './utils/engineeringCalculations';
import { 
  Box, 
  Settings, 
  Cpu, 
  Ruler, 
  Activity, 
  Download, 
  RotateCcw, 
  RotateCw, 
  RefreshCcw,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  Eye
} from 'lucide-react';

function ValidationPanel({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3 text-green-700">
        <CheckCircle2 size={18} />
        <span className="text-xs font-bold">ALL STANDARDS VALIDATED (EN 81-20)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {issues.map(issue => (
        <div 
          key={issue.id} 
          className={`p-3 border rounded-lg flex flex-col gap-1 ${
            issue.severity === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
            <AlertTriangle size={14} />
            {issue.category} - {issue.code}
          </div>
          <p className="text-xs leading-relaxed">{issue.message}</p>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ issues }: { issues: ValidationIssue[] }) {
  const { draftConfig, updateDraft, applyDraft, config } = useElevatorStore();
  const eng = calculateEngineering(draftConfig);

  const isDirty = JSON.stringify(draftConfig) !== JSON.stringify(config);

  return (
    <div className="absolute top-0 left-0 w-85 h-full bg-white/90 backdrop-blur-xl shadow-2xl z-20 flex flex-col border-r border-gray-200">
      <div className="p-6 border-b border-gray-200 bg-white">
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
            <Maximize2 size={20} />
          </div>
          ELEVATOR DESIGNER
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b bg-gray-50/30">
          <ValidationPanel issues={issues} />
        </div>

        {/* Engineering Summary */}
        <div className="p-4 bg-slate-900 text-white flex flex-col gap-2">
          <div className="flex justify-between text-[10px] font-bold opacity-60 uppercase">
            <span>Total Travel</span>
            <span>{eng.totalTravel.toFixed(2)}m</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold opacity-60 uppercase">
            <span>CW Mass</span>
            <span>{eng.counterweightMass.toFixed(0)}kg</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold opacity-60 uppercase">
            <span>Rope Length</span>
            <span>{eng.ropeLength.toFixed(1)}m</span>
          </div>
        </div>

        <Accordion title="Hoistway" icon={<Ruler size={18} />} defaultOpen>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Width (m)">
              <input type="number" step="0.1" value={draftConfig.hoistway.width} 
                onChange={(e) => updateDraft(d => { d.hoistway.width = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Depth (m)">
              <input type="number" step="0.1" value={draftConfig.hoistway.depth} 
                onChange={(e) => updateDraft(d => { d.hoistway.depth = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Pit Depth (m)">
              <input type="number" step="0.1" value={draftConfig.hoistway.pitDepth} 
                onChange={(e) => updateDraft(d => { d.hoistway.pitDepth = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Overhead (m)">
              <input type="number" step="0.1" value={draftConfig.hoistway.overhead} 
                onChange={(e) => updateDraft(d => { d.hoistway.overhead = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="DBG (m)">
              <input type="number" step="0.1" value={draftConfig.hoistway.dbg} 
                onChange={(e) => updateDraft(d => { d.hoistway.dbg = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="CW Dist (m)">
              <input type="number" step="0.1" value={draftConfig.hoistway.cwDistance} 
                onChange={(e) => updateDraft(d => { d.hoistway.cwDistance = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
          </div>
        </Accordion>

        <Accordion title="Cab & Doors" icon={<Box size={18} />}>
          <div className="grid grid-cols-2 gap-3">
            <InputGroup label="Cab Width (m)">
              <input type="number" step="0.1" value={draftConfig.cab.width} 
                onChange={(e) => updateDraft(d => { d.cab.width = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Cab Depth (m)">
              <input type="number" step="0.1" value={draftConfig.cab.depth} 
                onChange={(e) => updateDraft(d => { d.cab.depth = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Cab Height (m)">
              <input type="number" step="0.1" value={draftConfig.cab.height} 
                onChange={(e) => updateDraft(d => { d.cab.height = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Toe Guard (m)">
              <input type="number" step="0.1" value={draftConfig.cab.toeGuardHeight} 
                onChange={(e) => updateDraft(d => { d.cab.toeGuardHeight = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <InputGroup label="Door Type">
              <select value={draftConfig.cab.doorType} 
                onChange={(e) => updateDraft(d => { d.cab.doorType = e.target.value as any })}
                className="input-field col-span-2">
                <option value="center">Center</option>
                <option value="side">Side</option>
              </select>
            </InputGroup>
          </div>
        </Accordion>

        <Accordion title="Machine & Roping" icon={<Cpu size={18} />}>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="Location">
                <select value={draftConfig.machine.location} 
                  onChange={(e) => updateDraft(d => { d.machine.location = e.target.value as any })}
                  className="input-field">
                  <option value="above">Above (MR)</option>
                  <option value="below">Below</option>
                  <option value="none">MRL</option>
                </select>
              </InputGroup>
              <InputGroup label="Roping Ratio">
                <select value={draftConfig.machine.ropingRatio} 
                  onChange={(e) => updateDraft(d => { d.machine.ropingRatio = parseInt(e.target.value) as any })}
                  className="input-field">
                  <option value="1">1:1</option>
                  <option value="2">2:1</option>
                  <option value="4">4:1</option>
                </select>
              </InputGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="Rope Count">
                <input type="number" value={draftConfig.machine.ropeCount} 
                  onChange={(e) => updateDraft(d => { d.machine.ropeCount = parseInt(e.target.value) || 0 })}
                  className="input-field" />
              </InputGroup>
              <InputGroup label="Rope Ø (mm)">
                <input type="number" value={draftConfig.machine.ropeDiameter} 
                  onChange={(e) => updateDraft(d => { d.machine.ropeDiameter = parseInt(e.target.value) || 0 })}
                  className="input-field" />
              </InputGroup>
            </div>
            <InputGroup label="Speed (m/s)">
              <input type="number" step="0.1" value={draftConfig.machine.speed} 
                onChange={(e) => updateDraft(d => { d.machine.speed = parseFloat(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
          </div>
        </Accordion>

        <Accordion title="Performance" icon={<Activity size={18} />}>
          <div className="flex flex-col gap-3">
            <InputGroup label="Capacity (kg)">
              <input type="number" value={draftConfig.performance.capacity} 
                onChange={(e) => updateDraft(d => { d.performance.capacity = parseInt(e.target.value) || 0 })}
                className="input-field" />
            </InputGroup>
            <div className="grid grid-cols-2 gap-3">
              <InputGroup label="Stops">
                <input type="number" value={draftConfig.performance.stops} 
                  onChange={(e) => updateDraft(d => { d.performance.stops = parseInt(e.target.value) || 0 })}
                  className="input-field" />
              </InputGroup>
              <InputGroup label="Floor H (m)">
                <input type="number" step="0.1" value={draftConfig.performance.floorHeight} 
                  onChange={(e) => updateDraft(d => { d.performance.floorHeight = parseFloat(e.target.value) || 0 })}
                  className="input-field" />
              </InputGroup>
            </div>
          </div>
        </Accordion>
      </div>

      <div className="p-6 bg-white border-t border-gray-200 flex flex-col gap-3">
        <button 
          onClick={applyDraft}
          disabled={!isDirty}
          className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            isDirty 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <RefreshCcw size={18} className={isDirty ? 'animate-spin-slow' : ''} />
          UPDATE 3D DESIGN
        </button>
        <button 
          onClick={() => exportToDxf(config)}
          className="w-full py-3 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          <Download size={18} />
          EXPORT DXF
        </button>
      </div>
    </div>
  );
}

function TopBar({ issues }: { issues: ValidationIssue[] }) {
  const { undo, redo } = useElevatorStore.temporal.getState();
  const hasErrors = issues.some(i => i.severity === 'error');

  return (
    <div className="absolute top-0 right-0 left-85 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <button onClick={() => undo()} className="p-2 hover:bg-gray-100 rounded-md text-gray-600" title="Undo">
          <RotateCcw size={20} />
        </button>
        <button onClick={() => redo()} className="p-2 hover:bg-gray-100 rounded-md text-gray-600" title="Redo">
          <RotateCw size={20} />
        </button>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Project Status</span>
          {hasErrors ? (
            <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              VALIDATION FAILED
            </span>
          ) : (
            <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              READY FOR EXPORT
            </span>
          )}
        </div>
        <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700">
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { config, draftConfig } = useElevatorStore();
  const issues = validateElevator(draftConfig); // Real-time feedback for the user
  const committedIssues = validateElevator(config); // Status for the top bar

  return (
    <div className="relative w-screen h-screen bg-[#f8fafc] overflow-hidden text-slate-900">
      <Sidebar issues={issues} />
      <TopBar issues={committedIssues} />
      
      {/* CAD Standard Views Toolbar */}
      <div className="absolute top-20 right-6 z-10 flex flex-col gap-2">
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-lg shadow-xl border border-gray-200 flex flex-col gap-1">
          <button className="w-10 h-10 hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-600 transition-colors" title="Front View">
             <span className="text-[10px] font-bold">FRONT</span>
          </button>
          <button className="w-10 h-10 hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-600 transition-colors" title="Top View">
             <span className="text-[10px] font-bold">TOP</span>
          </button>
          <button className="w-10 h-10 hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-600 transition-colors" title="Right View">
             <span className="text-[10px] font-bold">RIGHT</span>
          </button>
          <div className="h-px bg-gray-200 mx-1 my-1" />
          <button className="w-10 h-10 hover:bg-gray-100 rounded-md flex items-center justify-center text-gray-600 transition-colors" title="Isometric">
             <Eye size={18} />
          </button>
        </div>
      </div>

      <main className="w-full h-full pl-85 pt-16">
        <Canvas shadows camera={{ position: [8, 8, 12], fov: 40 }}>
          <color attach="background" args={['#f8fafc']} />
          <ambientLight intensity={0.8} />
          <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
          <directionalLight position={[-5, 5, 5]} intensity={0.5} />
          <Environment preset="city" />
          
          <group position={[0, 0, 0]}>
            <Hoistway />
            <ElevatorCab />
            <Counterweight />
            <Machine />
            <ContactShadows 
              position={[0, -config.hoistway.pitDepth, 0]} 
              opacity={0.3} 
              scale={15} 
              blur={2.5} 
              far={10} 
            />
          </group>

          <Grid 
            position={[0, -config.hoistway.pitDepth, 0]}
            infiniteGrid 
            fadeDistance={50} 
            cellColor="#e2e8f0" 
            sectionColor="#cbd5e1" 
          />

          <OrbitControls 
            makeDefault 
            enableDamping 
            dampingFactor={0.05} 
            minDistance={2} 
            maxDistance={50}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.ROTATE, // SolidWorks style
              RIGHT: THREE.MOUSE.PAN
            }}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY_PAN
            }}
          />

          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="black" />
          </GizmoHelper>
        </Canvas>
      </main>

      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 pointer-events-none">
        <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg text-sm font-medium text-slate-700 border border-slate-200 backdrop-blur-md">
          Isometric Engineering View
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-full shadow-lg text-[10px] font-mono text-slate-300 border border-slate-800 uppercase tracking-widest backdrop-blur-md">
          FR: 60FPS | P: 1.1.0
        </div>
      </div>
    </div>
  );
}
