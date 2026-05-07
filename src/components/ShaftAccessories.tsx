// src/components/ShaftAccessories.tsx
import { useMemo } from 'react';
import { useElevatorStore } from '../store/elevatorStore';
import { calculateEngineering } from '../utils/engineeringCalculations';
import * as THREE from 'three';

export function ShaftAccessories() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, performance } = config;
  const { totalShaftHeight, totalTravel } = calculateEngineering(config);

  // Travelling Cable: loops from cab down and up to mid-shaft
  const cabY = 0; // Current cab position in local group
  const midShaftY = totalTravel / 2 + hoistway.pitDepth;
  
  // Create a curve for the travelling cable loop
  const curve = useMemo(() => {
    const start = new THREE.Vector3(-hoistway.width / 2 + 0.1, cabY + cab.height / 2, 0);
    const bottom = new THREE.Vector3(-hoistway.width / 2 + 0.1, (cabY - midShaftY) / 2, 0);
    const end = new THREE.Vector3(-hoistway.width / 2 + 0.1, midShaftY, 0);
    
    return new THREE.CatmullRomCurve3([start, bottom, end]);
  }, [hoistway.width, cab.height, cabY, midShaftY]);

  return (
    <group>
      {/* ── Travelling Cable ── */}
      <mesh>
         <tubeGeometry args={[curve, 20, 0.02, 8, false]} />
         <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* ── Governor Rope Loop ── */}
      {/* Loop from MR governor to pit tensioner */}
      <group position={[-hoistway.width / 2 + 0.30, 0, -0.30]}>
         {/* Vertical segments */}
         <mesh position={[0, totalShaftHeight / 2 - hoistway.pitDepth, 0.1]}>
            <cylinderGeometry args={[0.004, 0.004, totalShaftHeight, 6]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
         </mesh>
         <mesh position={[0, totalShaftHeight / 2 - hoistway.pitDepth, -0.1]}>
            <cylinderGeometry args={[0.004, 0.004, totalShaftHeight, 6]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
         </mesh>
      </group>

      {/* ── Shaft Lighting (every 7m) ── */}
      {Array.from({ length: Math.ceil(totalShaftHeight / 7) }).map((_, i) => (
        <mesh key={i} position={[hoistway.width / 2, i * 7, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.6, 0.05]} />
          <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* ── Position Sensor Flags (at each floor) ── */}
      {Array.from({ length: performance.stops }).map((_, i) => (
        <mesh key={i} position={[hoistway.dbg / 2 + 0.05, i * performance.floorHeight + hoistway.pitDepth, 0]}>
           <boxGeometry args={[0.01, 0.2, 0.08]} />
           <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
