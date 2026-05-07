// src/components/Drawing2DPanel.tsx
import { useState, useRef, useCallback } from 'react';
import { useElevatorStore } from '../store/elevatorStore';
import { calculateEngineering } from '../utils/engineeringCalculations';

function CADPatterns() {
  return (
    <defs>
      <pattern id="hatch-concrete" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="10" stroke="#94a3b8" strokeWidth="0.5" />
        <circle cx="5" cy="5" r="0.5" fill="#94a3b8" />
      </pattern>
      <filter id="shadow">
        <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.3" />
      </filter>
    </defs>
  );
}

type DrawingView = 'plan' | 'front' | 'side' | 'rail';

// Line style constants (SVG stroke-width in mm at 1:1)
const S = {
  visible:  { stroke: '#111827', strokeWidth: 0.5,  fill: 'none' },
  wall:     { stroke: '#111827', strokeWidth: 0.70, fill: '#d1d5db' },
  cab:      { stroke: '#1d4ed8', strokeWidth: 0.50, fill: '#dbeafe' },
  door:     { stroke: '#0891b2', strokeWidth: 0.35, fill: '#cffafe' },
  rail:     { stroke: '#374151', strokeWidth: 0.45, fill: '#6b7280' },
  cw:       { stroke: '#7c3aed', strokeWidth: 0.40, fill: '#ede9fe' },
  center:   { stroke: '#16a34a', strokeWidth: 0.18, strokeDasharray: '4 1.5 1 1.5', fill: 'none' },
  dim:      { stroke: '#dc2626', strokeWidth: 0.18, fill: 'none' },
  hatch:    { stroke: '#4b5563', strokeWidth: 0.18, fill: 'none' },
};

// Metres → SVG units (50px per metre = 1:50 scale)
const SCALE = 50;
const m = (v: number) => v * SCALE;

// ── Drawing primitives ───────────────────────────────────────────────────────

function WallRect({ x, y, w, h, t }: { x: number; y: number; w: number; h: number; t: number }) {
  // Outer concrete shell with hatching
  return (
    <g>
      <rect x={m(x - t)} y={m(y - t)} width={m(w + t * 2)} height={m(h + t * 2)} fill="url(#hatch-concrete)" stroke="#111827" strokeWidth={0.7} />
      <rect x={m(x)} y={m(y)} width={m(w)} height={m(h)} fill="#f8fafc" stroke="#111827" strokeWidth={0.3} />
    </g>
  );
}

function LeaderLine({ x, y, tx, ty, label }: { x: number; y: number; tx: number; ty: number; label: string }) {
  return (
    <g>
      <line x1={m(x)} y1={m(y)} x2={m(tx)} y2={m(ty)} stroke="#475569" strokeWidth={0.3} />
      <circle cx={m(x)} cy={m(y)} r={1} fill="#475569" />
      <text x={m(tx)} y={m(ty)} fontSize={4} fill="#1e293b" fontWeight="500">{label}</text>
    </g>
  );
}

function CenterLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={m(x1)} y1={m(y1)} x2={m(x2)} y2={m(y2)} {...S.center} />;
}

function DimH({ x1, x2, y, offset, label }: { x1: number; x2: number; y: number; offset: number; label: string }) {
  const yo = m(y + offset);
  return (
    <g {...S.dim}>
      <line x1={m(x1)} y1={m(y)} x2={m(x1)} y2={yo} />
      <line x1={m(x2)} y1={m(y)} x2={m(x2)} y2={yo} />
      <line x1={m(x1)} y1={yo}  x2={m(x2)} y2={yo} />
      <text x={(m(x1) + m(x2)) / 2} y={yo - 3} fontSize={5} textAnchor="middle" fill="#dc2626" stroke="none">{label}</text>
    </g>
  );
}

function DimV({ x, y1, y2, offset, label }: { x: number; y1: number; y2: number; offset: number; label: string }) {
  const xo = m(x + offset);
  return (
    <g {...S.dim}>
      <line x1={m(x)} y1={m(y1)} x2={xo} y2={m(y1)} />
      <line x1={m(x)} y1={m(y2)} x2={xo} y2={m(y2)} />
      <line x1={xo}  y1={m(y1)} x2={xo}  y2={m(y2)} />
      <text x={xo + 3} y={(m(y1) + m(y2)) / 2} fontSize={5} textAnchor="start" fill="#dc2626" stroke="none">{label}</text>
    </g>
  );
}

function TRailSymbol({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  // T75-B in metres: bw=37.5mm, hw=31mm, bt=16mm, d=62mm
  const bw = 0.0375 * scale, hw = 0.031 * scale, bt = 0.016 * scale, d = 0.062 * scale;
  const x = m(cx), y = m(cy);
  const s = SCALE;
  const pts = [
    `${x - bw * s},${y}`, `${x + bw * s},${y}`,
    `${x + bw * s},${y - bt * s}`, `${x + hw * s},${y - bt * s}`,
    `${x + hw * s},${y - d * s}`, `${x - hw * s},${y - d * s}`,
    `${x - hw * s},${y - bt * s}`, `${x - bw * s},${y - bt * s}`,
  ].join(' ');
  return <polygon points={pts} fill="#6b7280" stroke="#374151" strokeWidth={0.4} />;
}

function BracketSymbol({ cx, cy, side = 1 }: { cx: number; cy: number; side?: number }) {
  const s = SCALE;
  const x = m(cx), y = m(cy);
  const h = 0.05 * s, t = 0.006 * s, l = 0.20 * s;
  
  return (
    <g transform={`translate(${x}, ${y}) scale(${side}, 1)`}>
       {/* L-Angle */}
       <path d={`M 0,0 L ${-l/2},0 L ${-l/2},${-t} L ${-t},${-t} L ${-t},${-h} L 0,${-h} Z`} fill="#94a3b8" stroke="#334155" strokeWidth={0.2} />
    </g>
  );
}

function IBeamSymbol({ cx, cy, w, h, vertical = false }: { cx: number; cy: number; w: number; h: number; vertical?: boolean }) {
  const s = SCALE;
  const x = m(cx), y = m(cy), sw = w * s, sh = h * s;
  const tf = 0.015 * s, tw = 0.009 * s;

  if (vertical) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect x={-sw/2} y={-sh/2} width={sw} height={tf} fill="#475569" stroke="#1e293b" strokeWidth={0.3} />
        <rect x={-sw/2} y={sh/2 - tf} width={sw} height={tf} fill="#475569" stroke="#1e293b" strokeWidth={0.3} />
        <rect x={-tw/2} y={-sh/2 + tf} width={tw} height={sh - tf * 2} fill="#475569" stroke="#1e293b" strokeWidth={0.3} />
      </g>
    );
  }
  return <rect x={x - sw/2} y={y - sh/2} width={sw} height={sh} fill="#475569" stroke="#1e293b" strokeWidth={0.3} />;
}

// ── View renderers ────────────────────────────────────────────────────────────

function FloorPlanView() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab } = config;
  const hw = hoistway.width, hd = hoistway.depth, wt = hoistway.wallThickness;
  const cw = cab.width, cd = cab.depth, cwt = cab.wallThickness;
  const cabX = (hw - cw) / 2, cabY = (hd - cd) / 2;

  return (
    <g transform={`translate(${m(wt + 0.5)}, ${m(wt + 0.5)})`}>
      <WallRect x={0} y={0} w={hw} h={hd} t={wt} />
      {/* Cab outer shell */}
      <rect x={m(cabX - cwt)} y={m(cabY - cwt)} width={m(cw + cwt * 2)} height={m(cd + cwt * 2)} {...S.cab} />
      {/* Cab inner cavity */}
      <rect x={m(cabX)} y={m(cabY)} width={m(cw)} height={m(cd)} fill="#eff6ff" stroke="#1d4ed8" strokeWidth={0.25} />
      {/* Door opening */}
      <line x1={m(cabX + cwt)} y1={m(cabY + cd + cwt)} x2={m(cabX + cw - cwt)} y2={m(cabY + cd + cwt)} {...S.door} strokeWidth={1} />
      {/* Guide rails */}
      <TRailSymbol cx={(hw - hoistway.dbg) / 2} cy={hd / 2} />
      <TRailSymbol cx={(hw + hoistway.dbg) / 2} cy={hd / 2} />
      {/* Brackets */}
      <BracketSymbol cx={(hw - hoistway.dbg) / 2} cy={hd / 2} side={-1} />
      <BracketSymbol cx={(hw + hoistway.dbg) / 2} cy={hd / 2} side={1} />
      {/* CW */}
      <rect x={m((hw - cw * 0.65) / 2)} y={m(-hoistway.cwDistance - 0.075)} width={m(cw * 0.65)} height={m(0.15)} {...S.cw} />
      {/* Center lines */}
      <CenterLine x1={-0.3} y1={hd / 2} x2={hw + 0.3} y2={hd / 2} />
      <CenterLine x1={hw / 2} y1={-0.3} x2={hw / 2} y2={hd + 0.3} />
      {/* Dimensions */}
      <DimH x1={0} x2={hw} y={hd + wt} offset={0.6} label={`W = ${hw.toFixed(3)} m`} />
      <DimV x={hw + wt} y1={0} y2={hd} offset={0.6} label={`D = ${hd.toFixed(3)} m`} />
      <DimH x1={cabX} x2={cabX + cw} y={-wt - 0.2} offset={-0.5} label={`Cab ${cw.toFixed(3)} m`} />
      
      {/* Annotations */}
      <LeaderLine x={hw / 2} y={hd / 2} tx={hw + 1.2} ty={-0.4} label="CAR ENCLOSURE" />
      <LeaderLine x={(hw + hoistway.dbg) / 2} y={hd / 2} tx={hw + 1.2} ty={0.2} label="T75-B GUIDE RAIL" />
      <LeaderLine x={hw / 2} y={-hoistway.cwDistance} tx={-1.5} ty={-0.4} label="COUNTERWEIGHT FRAME" />
      <LeaderLine x={0} y={hd / 2} tx={-1.5} ty={hd / 2} label="REINFORCED CONCRETE" />
      
      {/* Title */}
      <text x={m(hw / 2)} y={m(hd + wt + 1.8)} fontSize={7} textAnchor="middle" fill="#111827" fontWeight="bold">FLOOR PLAN — HOISTWAY SECTION</text>
      <text x={m(hw / 2)} y={m(hd + wt + 2.2)} fontSize={5} textAnchor="middle" fill="#6b7280">SCALE 1:50 | DIMS IN METERS | EN 81-20</text>
    </g>
  );
}

function FrontElevView() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, performance } = config;
  const eng = calculateEngineering(config);
  const hw = hoistway.width, wt = hoistway.wallThickness;
  const cw = cab.width, ch = cab.height, cwt = cab.wallThickness;
  const pit = hoistway.pitDepth, tsh = eng.totalShaftHeight, tt = eng.totalTravel;
  const cwH = Math.max(1.0, eng.counterweightMass / 500);

  return (
    <g transform={`translate(${m(wt + 0.5)}, ${m(wt + 0.5)})`}>
      <WallRect x={0} y={0} w={hw} h={tsh} t={wt} />
      {/* Floor lines */}
      {Array.from({ length: performance.stops }).map((_, i) => {
        const yf = pit + i * performance.floorHeight;
        return (
          <g key={i}>
            <line x1={m(-wt - 0.3)} y1={m(yf)} x2={m(hw + wt + 0.3)} y2={m(yf)} stroke="#94a3b8" strokeWidth={0.25} strokeDasharray="3 2" />
            <text x={m(hw + wt + 0.4)} y={m(yf) + 2} fontSize={4.5} fill="#475569">FL.{i + 1}</text>
          </g>
        );
      })}
      {/* Cab */}
      <rect x={m((hw - cw) / 2 - cwt)} y={m(pit - cab.floorThickness)} width={m(cw + cwt * 2)} height={m(ch + cab.floorThickness + 0.003)} {...S.cab} />
      <rect x={m((hw - cw) / 2)} y={m(pit)} width={m(cw)} height={m(ch)} fill="#eff6ff" stroke="#1d4ed8" strokeWidth={0.25} />
      {/* Door panels */}
      {cab.doorType === 'center' ? (
        <>
          <rect x={m((hw - cw) / 2 + cwt)} y={m(pit)} width={m(cw / 2 - cwt - 0.01)} height={m(ch - 0.05)} {...S.door} />
          <rect x={m(hw / 2 + 0.01)} y={m(pit)} width={m(cw / 2 - cwt - 0.01)} height={m(ch - 0.05)} {...S.door} />
        </>
      ) : (
        <rect x={m(hw / 2 - cwt)} y={m(pit)} width={m(cw / 2)} height={m(ch - 0.05)} {...S.door} />
      )}
      {/* Counterweight */}
      <rect x={m(hw + wt + 0.5)} y={m(pit + tt)} width={m(cw * 0.65)} height={m(cwH)} {...S.cw} />
      {/* Rails */}
      <line x1={m((hw - hoistway.dbg) / 2)} y1={m(0)} x2={m((hw - hoistway.dbg) / 2)} y2={m(tsh)} {...S.rail} />
      <line x1={m((hw + hoistway.dbg) / 2)} y1={m(0)} x2={m((hw + hoistway.dbg) / 2)} y2={m(tsh)} {...S.rail} />
      {/* Center line */}
      <CenterLine x1={hw / 2} y1={-0.3} x2={hw / 2} y2={tsh + 0.3} />
      {/* Dimensions */}
      <DimV x={-wt - 0.2} y1={0}    y2={pit} offset={-1.2} label={`PIT ${pit.toFixed(2)}m`} />
      <DimV x={-wt - 0.2} y1={pit}  y2={pit + tt} offset={-1.2} label={`TRAVEL ${tt.toFixed(2)}m`} />
      <DimV x={-wt - 0.2} y1={pit + tt} y2={tsh} offset={-1.2} label={`OH ${hoistway.overhead.toFixed(2)}m`} />
      <DimV x={-wt - 1.5} y1={0}    y2={tsh} offset={-1.2} label={`TOTAL ${tsh.toFixed(2)}m`} />
      <DimH x1={(hw - cw) / 2} x2={(hw + cw) / 2} y={pit + ch + 0.1} offset={0.5} label={`CAB W=${cw.toFixed(3)}m`} />

      {/* Annotations */}
      <LeaderLine x={hw / 2} y={tsh - 0.1} tx={hw + 1.2} ty={tsh + 0.5} label="HEB 200 MACHINE BEAM" />
      <LeaderLine x={hw / 2} y={pit + ch / 2} tx={hw + 1.2} ty={pit + ch / 2} label="CAR ASSEMBLY" />
      <LeaderLine x={hw / 2} y={pit / 2} tx={hw + 1.2} ty={0.2} label="BUFFER SEATING" />
      
      {/* Landing Doors at every level */}
      {Array.from({ length: performance.stops }).map((_, i) => {
        const yf = pit + i * performance.floorHeight;
        return (
          <rect key={i} x={m((hw - cw) / 2 + 0.05)} y={m(yf)} width={m(cw - 0.1)} height={m(ch - 0.05)} fill="none" stroke="#0891b2" strokeWidth={0.3} strokeDasharray="2 1" />
        );
      })}

      <text x={m(hw / 2)} y={m(tsh + wt + 1.8)} fontSize={7} textAnchor="middle" fill="#111827" fontWeight="bold">FRONT ELEVATION — SHAFT SECTION</text>
    </g>
  );
}

function SideElevView() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab } = config;
  const eng = calculateEngineering(config);
  const hd = hoistway.depth, wt = hoistway.wallThickness;
  const cd = cab.depth, ch = cab.height;
  const pit = hoistway.pitDepth, tsh = eng.totalShaftHeight;
  const cwH = Math.max(1.0, eng.counterweightMass / 500);

  return (
    <g transform={`translate(${m(wt + 0.5)}, ${m(wt + 0.5)})`}>
      <WallRect x={0} y={0} w={hd} h={tsh} t={wt} />
      <rect x={m((hd - cd) / 2)} y={m(pit)} width={m(cd)} height={m(ch)} {...S.cab} />
      <rect x={m(hd - hoistway.cwDistance - 0.075)} y={m(pit + eng.totalTravel)} width={m(0.15)} height={m(cwH)} {...S.cw} />
      
      {/* Machine Beams (Side cross-section) */}
      <IBeamSymbol cx={-0.2 + 0.4} cy={tsh - 0.15} w={0.2} h={0.2} vertical={true} />
      <IBeamSymbol cx={-0.2 - 0.4} cy={tsh - 0.15} w={0.2} h={0.2} vertical={true} />

      <CenterLine x1={hd / 2} y1={-0.3} x2={hd / 2} y2={tsh + 0.3} />
      <DimH x1={0} x2={hd} y={tsh + wt} offset={0.6} label={`D = ${hd.toFixed(3)} m`} />
      <DimH x1={(hd - cd) / 2} x2={(hd + cd) / 2} y={-wt - 0.2} offset={-0.5} label={`CAB D=${cd.toFixed(3)}m`} />
      <text x={m(hd / 2)} y={m(tsh + wt + 1.8)} fontSize={7} textAnchor="middle" fill="#111827" fontWeight="bold">SIDE ELEVATION — DEPTH SECTION</text>
    </g>
  );
}

function RailDetailView() {
  const cx = 0.40, cy = 0.40;
  const bw = 0.0375 * 5, hw = 0.031 * 5, bt = 0.016 * 5, d = 0.062 * 5;
  const x = m(cx), y = m(cy);
  const s = SCALE;
  const pts = [
    `${x - bw * s},${y}`, `${x + bw * s},${y}`,
    `${x + bw * s},${y - bt * s}`, `${x + hw * s},${y - bt * s}`,
    `${x + hw * s},${y - d * s}`, `${x - hw * s},${y - d * s}`,
    `${x - hw * s},${y - bt * s}`, `${x - bw * s},${y - bt * s}`,
  ].join(' ');
  return (
    <g transform="translate(20, 20)">
      <polygon points={pts} fill="#6b7280" stroke="#374151" strokeWidth={0.8} />
      {/* Dimensions */}
      <line x1={m(cx - bw)} y1={m(cy) + 10} x2={m(cx + bw)} y2={m(cy) + 10} {...S.dim} />
      <text x={(m(cx - bw) + m(cx + bw)) / 2} y={m(cy) + 17} fontSize={6} textAnchor="middle" fill="#dc2626">75 mm</text>
      <line x1={m(cx + bw) + 10} y1={m(cy - d)} x2={m(cx + bw) + 10} y2={m(cy)} {...S.dim} />
      <text x={m(cx + bw) + 25} y={(m(cy - d) + m(cy)) / 2} fontSize={6} fill="#dc2626">62 mm</text>
      <text x={m(cx)} y={m(cy - d) - 15} fontSize={7} textAnchor="middle" fill="#111827" fontWeight="bold">GUIDE RAIL — T75-B (ISO 7465)</text>
      <text x={m(cx)} y={m(cy - d) - 6} fontSize={5} textAnchor="middle" fill="#6b7280">SCALE 1:5</text>
    </g>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export function Drawing2DPanel() {
  const [view, setView] = useState<DrawingView>('plan');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.15 : 0.85;
    
    setZoom((prevZoom) => {
      const newZoom = Math.min(10, Math.max(0.1, prevZoom * scaleFactor));
      
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setPan((prevPan) => {
        const x = (mouseX - prevPan.x) / prevZoom;
        const y = (mouseY - prevPan.y) / prevZoom;
        return {
          x: mouseX - x * newZoom,
          y: mouseY - y * newZoom
        };
      });

      return newZoom;
    });
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2) {
      dragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  const views: { id: DrawingView; label: string }[] = [
    { id: 'plan',  label: 'Floor Plan' },
    { id: 'front', label: 'Front Elevation' },
    { id: 'side',  label: 'Side Elevation' },
    { id: 'rail',  label: 'Rail Detail' },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Drawing View</span>
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              view === v.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {v.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.min(8, z * 1.2))} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold">+</button>
          <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold">−</button>
          <button onClick={() => { setZoom(1); setPan({ x: 20, y: 20 }); }} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs">Reset</button>
        </div>
      </div>

      <div
        className="flex-1 overflow-hidden cursor-crosshair active:cursor-grabbing"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onContextMenu={(e) => e.preventDefault()}
        style={{ background: '#f1f5f9' }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ fontFamily: "'Inter', 'Roboto Mono', monospace" }}
        >
          <rect
            x={pan.x}
            y={pan.y}
            width={900 * zoom}
            height={700 * zoom}
            fill="white"
            stroke="#cbd5e1"
            strokeWidth={1}
            filter="drop-shadow(2px 3px 6px rgba(0,0,0,0.12))"
          />
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            <CADPatterns />
            <g transform="translate(30, 30)">
              {view === 'plan'  && <FloorPlanView />}
              {view === 'front' && <FrontElevView />}
              {view === 'side'  && <SideElevView />}
              {view === 'rail'  && <RailDetailView />}
            </g>

            <g transform={`translate(${850 - 200}, ${650 - 80}) scale(1)`}>
               <rect width="190" height="70" fill="white" stroke="#1e293b" strokeWidth={1} />
               <line x1="0" y1="20" x2="190" y2="20" stroke="#1e293b" />
               <text x="5" y="15" fontSize={8} fontWeight="bold">DIDA-ELEV PROFESSIONAL CAD</text>
               <text x="5" y="35" fontSize={6}>PROJECT: STANDARD TRACTION LIFT</text>
               <text x="5" y="45" fontSize={6}>COMPLIANCE: EN 81-20 / ISO 4190</text>
               <text x="5" y="55" fontSize={6}>DATE: 2026-05-07</text>
               <text x="5" y="65" fontSize={6}>SCALE: 1:50 | UNITS: METRES</text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}
