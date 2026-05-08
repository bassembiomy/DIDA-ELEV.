// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, PerspectiveCamera, Grid } from '@react-three/drei';
import { useElevatorStore } from './store/elevatorStore';
import { fetchGeometry, fetchDrawings, checkEngineHealth, type AssemblyGeometry, type AssemblyDrawing } from './utils/engineBridge';
import { CSharpViewport } from './components/CSharpViewport';
import { Drawing2DPanel } from './components/Drawing2DPanel';
import './App.css';

export default function App() {
  const { config, draftConfig, updateDraft, applyDraft } = useElevatorStore();
  const [geometry, setGeometry] = useState<AssemblyGeometry | null>(null);
  const [drawings, setDrawings] = useState<AssemblyDrawing | null>(null);
  const [engineOnline, setEngineOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');

  // Check engine health on mount
  useEffect(() => {
    checkEngineHealth().then(setEngineOnline);
  }, []);

  // Sync with C# Mechanical Engine
  const syncWithEngine = useCallback(async () => {
    setIsSyncing(true);
    try {
      const geo = await fetchGeometry(config);
      const dwg = await fetchDrawings(config);
      setGeometry(geo);
      setDrawings(dwg);
      setEngineOnline(true);
    } catch (e) {
      setEngineOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, [config]);

  // Initial sync
  useEffect(() => {
    syncWithEngine();
  }, [syncWithEngine]);

  return (
    <div className="cad-layout">
      {/* Top Toolbar */}
      <header className="cad-toolbar">
        <div className="flex items-center gap-4">
          <div className="logo text-xl">DIDA-ELEV <span className="text-blue-400 font-light">Pro Designer</span></div>
          <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${engineOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {engineOnline ? 'MECHANICAL ENGINE ONLINE' : 'ENGINE OFFLINE'}
          </div>
        </div>
        
        <nav className="tools flex items-center gap-2">
          <div className="bg-slate-800 p-1 rounded-lg flex mr-4">
            <button 
              onClick={() => setViewMode('3D')}
              className={`px-4 py-1 rounded text-xs transition-all ${viewMode === '3D' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              3D VIEWPORT
            </button>
            <button 
              onClick={() => setViewMode('2D')}
              className={`px-4 py-1 rounded text-xs transition-all ${viewMode === '2D' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
            >
              2D CAD DRAWINGS
            </button>
          </div>
          
          <button 
            onClick={syncWithEngine} 
            disabled={isSyncing}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${isSyncing ? 'bg-slate-700' : 'bg-blue-600 hover:bg-blue-500'} text-white shadow-lg`}
          >
            {isSyncing ? 'CALCULATING...' : 'SYNC MECHANICAL'}
          </button>
        </nav>
      </header>

      <div className="cad-workspace flex-1 flex overflow-hidden">
        {/* Left Sidebar: Parameters */}
        <aside className="w-80 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Engineering Parameters</h2>
          </div>
          
          <div className="p-4 space-y-6">
            {/* Hoistway Section */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b border-blue-50 pb-1">Hoistway Geometry</h3>
              <div className="space-y-3">
                <ParameterRow label="Width (W)" value={draftConfig.hoistway.width} unit="m" min={1.5} max={4} step={0.1}
                  onChange={(v) => updateDraft(d => { d.hoistway.width = v; })} />
                <ParameterRow label="Depth (D)" value={draftConfig.hoistway.depth} unit="m" min={1.5} max={4} step={0.1}
                  onChange={(v) => updateDraft(d => { d.hoistway.depth = v; })} />
                <ParameterRow label="Pit Depth" value={draftConfig.hoistway.pitDepth} unit="m" min={1.0} max={3} step={0.1}
                  onChange={(v) => updateDraft(d => { d.hoistway.pitDepth = v; })} />
                <ParameterRow label="Overhead" value={draftConfig.hoistway.overhead} unit="m" min={3.5} max={6} step={0.1}
                  onChange={(v) => updateDraft(d => { d.hoistway.overhead = v; })} />
                <ParameterRow label="DBG (Rails)" value={draftConfig.hoistway.dbg} unit="m" min={1.0} max={3} step={0.1}
                  onChange={(v) => updateDraft(d => { d.hoistway.dbg = v; })} />
              </div>
            </section>

            {/* Cab Section */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 border-b border-blue-50 pb-1">Cabin Specification</h3>
              <div className="space-y-3">
                <ParameterRow label="Cab Width" value={draftConfig.cab.width} unit="m" min={1.0} max={3} step={0.05}
                  onChange={(v) => updateDraft(d => { d.cab.width = v; })} />
                <ParameterRow label="Cab Depth" value={draftConfig.cab.depth} unit="m" min={1.0} max={3} step={0.05}
                  onChange={(v) => updateDraft(d => { d.cab.depth = v; })} />
              </div>
            </section>

            <button 
              onClick={applyDraft}
              className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-slate-800 transition-colors shadow-md"
            >
              APPLY ALL CHANGES
            </button>
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="flex-1 bg-slate-100 relative">
          {viewMode === '3D' ? (
            <div className="w-full h-full">
              <Canvas shadows>
                <PerspectiveCamera makeDefault position={[5, 8, 12]} fov={40} />
                <OrbitControls makeDefault minDistance={2} maxDistance={50} />
                
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} castShadow />
                <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

                <Grid 
                  infiniteGrid 
                  fadeDistance={50} 
                  fadeStrength={5} 
                  cellSize={1} 
                  sectionSize={5} 
                  sectionColor="#334155" 
                  cellColor="#94a3b8" 
                />

                <CSharpViewport geometry={geometry} />
                
                <ContactShadows 
                  position={[0, -initialConfig.hoistway.pitDepth, 0]} 
                  opacity={0.4} 
                  scale={20} 
                  blur={2} 
                  far={4.5} 
                />
              </Canvas>
              
              {/* 3D Overlay Stats */}
              <div className="absolute bottom-6 right-6 p-4 bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-xl pointer-events-none">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mechanical Status</div>
                <div className="text-sm font-mono text-slate-800">CAR LOAD: {config.cab.ratedLoadKg} KG</div>
                <div className="text-sm font-mono text-slate-800">SYSTEM STABILITY: <span className="text-green-600">VALID</span></div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full">
              <Drawing2DPanel csharpDrawings={drawings} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ParameterRow({ label, value, unit, min, max, step, onChange }: { 
  label: string; value: number; unit: string; min: number; max: number; step: number; 
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-[11px] font-semibold text-slate-500 uppercase">{label}</label>
        <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{value.toFixed(2)} {unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}

const initialConfig = {
  hoistway: {
    pitDepth: 1.5
  }
};