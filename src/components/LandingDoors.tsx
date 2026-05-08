// src/components/LandingDoors.tsx
import { useMemo } from 'react';
import { useElevatorStore } from '../store/elevatorStore';

interface LandingDoorProps {
  yPos: number;
}

function LandingDoorAssembly({ yPos }: LandingDoorProps) {
  const config = useElevatorStore((s) => s.config);
  const { cab } = config;
  
  const frameT = 0.040; // 40mm frame thickness
  const jambW  = 0.120; // 120mm jamb width
  const doorT  = 0.040; // 40mm panel thickness
  
  const openingW = Math.min(cab.width - 0.100, config.hoistway.width - jambW * 2);
  const openingH = cab.height - 0.050;

  // Position at front wall inner face
  const doorZ = config.hoistway.depth / 2 + frameT / 2;

  return (
    <group position={[0, yPos, doorZ]}>
      {/* ── Landing Door Frame (Pressed Steel) ── */}
      {/* Left Jamb */}
      <mesh position={[-(openingW / 2 + jambW / 2), openingH / 2, 0]} castShadow>
        <boxGeometry args={[jambW, openingH, frameT]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      {/* Right Jamb */}
      <mesh position={[(openingW / 2 + jambW / 2), openingH / 2, 0]} castShadow>
        <boxGeometry args={[jambW, openingH, frameT]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      {/* Header frame */}
      <mesh position={[0, openingH + jambW / 4, 0]} castShadow>
        <boxGeometry args={[openingW + jambW * 2, jambW / 2, frameT]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>

      {/* ── Door Sill (Aluminium Extrusion) ── */}
      <mesh position={[0, 0, -frameT / 2]} castShadow>
        <boxGeometry args={[openingW + 0.200, 0.050, 0.120]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── Landing Door Panels ── */}
      <group position={[0, openingH / 2, frameT / 2]}>
         {cab.doorType === 'Center Opening' ? (
           <>
             <mesh position={[-(openingW / 4 + 0.01), 0, 0]} castShadow>
               <boxGeometry args={[openingW / 2, openingH, doorT]} />
               <meshStandardMaterial color="#64748b" metalness={0.8} />
             </mesh>
             <mesh position={[(openingW / 4 + 0.01), 0, 0]} castShadow>
               <boxGeometry args={[openingW / 2, openingH, doorT]} />
               <meshStandardMaterial color="#64748b" metalness={0.8} />
             </mesh>
           </>
         ) : (
           <mesh position={[openingW / 4, 0, 0]} castShadow>
             <boxGeometry args={[openingW / 2 + 0.1, openingH, doorT]} />
             <meshStandardMaterial color="#64748b" metalness={0.8} />
           </mesh>
         )}
      </group>

      {/* ── Hall Call Button Station ── */}
      <mesh position={[openingW / 2 + jambW + 0.150, 1.1, 0.01]} castShadow>
        <boxGeometry args={[0.080, 0.160, 0.010]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} />
      </mesh>
      <mesh position={[openingW / 2 + jambW + 0.150, 1.1, 0.015]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#f87171" emissive="#f87171" />
      </mesh>
    </group>
  );
}

export function LandingDoorSystem() {
  const config = useElevatorStore((s) => s.config);
  const { performance } = config;
  
  const floors = useMemo(() => {
    const positions: number[] = [];
    let currentY = 0;
    for (let i = 0; i < performance.stops; i++) {
      positions.push(currentY);
      currentY += (performance.floorHeightsMm[i] || 3500) / 1000;
    }
    return positions;
  }, [performance.stops, performance.floorHeightsMm]);

  return (
    <group>
      {floors.map((y, i) => (
        <LandingDoorAssembly key={i} yPos={y} />
      ))}
    </group>
  );
}
