// src/components/Drawing2DPanel.tsx
import { useState, useRef, useCallback } from 'react';
import type { AssemblyDrawing } from '../utils/engineBridge';

interface Drawing2DProps {
  csharpDrawings?: AssemblyDrawing | null;
}

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


// ── Drawing primitives ───────────────────────────────────────────────────────


// ── Drawing primitives ───────────────────────────────────────────────────────

// ── View renderers ────────────────────────────────────────────────────────────





// ── Drawing primitives ───────────────────────────────────────────────────────

// ── Main Panel ────────────────────────────────────────────────────────────────
export function Drawing2DPanel({ csharpDrawings }: Drawing2DProps) {
  const [view, setView] = useState<DrawingView>('plan');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = e.deltaY < 0 ? 1.15 : 0.85;
    
    // Calculate new zoom
    const newZoom = Math.min(10, Math.max(0.1, zoom * scaleFactor));
    if (newZoom === zoom) return;

    // Calculate mouse position relative to SVG container
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate new pan to keep mouse over the same point
    const x = (mouseX - pan.x) / zoom;
    const y = (mouseY - pan.y) / zoom;

    setPan({
        x: mouseX - x * newZoom,
        y: mouseY - y * newZoom
    });
    setZoom(newZoom);
  }, [zoom, pan]);

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

  // ── Render C# drawings if available ───────────────────────────────────────
  const activeCSharpView = csharpDrawings?.views.find(v => 
    (view === 'plan' && v.name === 'Floor Plan') || 
    (view === 'front' && v.name === 'Front Elevation') ||
    (view === 'side' && v.name === 'Side Elevation')
  );

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
              {activeCSharpView ? (
                 <g transform="scale(0.05)">
                    {activeCSharpView.entities.map((entity, i) => {
                        const layer = entity.layer?.toUpperCase() || 'VISIBLE';
                        let stroke = '#64748b';
                        let width = 1.5;
                        let dash = '';

                        if (layer === 'WALL') { stroke = '#111827'; width = 3; }
                        if (layer === 'CAB') { stroke = '#1d4ed8'; width = 2; }
                        if (layer === 'DOOR') { stroke = '#0891b2'; width = 1.5; }
                        if (layer === 'CW') { stroke = '#7c3aed'; width = 2; }
                        if (layer === 'RAIL') { stroke = '#374151'; width = 2; }
                        if (layer === 'DIM') { stroke = '#dc2626'; width = 1; }
                        if (layer === 'CENTER') { stroke = '#16a34a'; width = 0.8; dash = '8 4'; }

                        if (entity.type === 'line') {
                            return (
                                <line 
                                    key={i}
                                    x1={entity.x1} y1={-entity.y1} 
                                    x2={entity.x2} y2={-entity.y2} 
                                    stroke={stroke} 
                                    strokeWidth={width}
                                    strokeDasharray={dash}
                                />
                            );
                        }
                        if (entity.type === 'text') {
                            return (
                                <text 
                                    key={i}
                                    x={entity.x1} y={-entity.y1} 
                                    fontSize={entity.layer === 'DIM' ? 120 : 150}
                                    fill={stroke}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {entity.label}
                                </text>
                            );
                        }
                        return null;
                    })}
                 </g>
              ) : (
                <g className="opacity-20">
                  <text x={100} y={100} fontSize={20} fill="#64748b">C# Mechanical Engine Offline</text>
                  <text x={100} y={130} fontSize={14} fill="#94a3b8">Please restart the app to enable professional drafting.</text>
                </g>
              )}
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
