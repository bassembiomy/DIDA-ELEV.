// src/components/ElevatorCab.tsx
// High-fidelity Elevator Cab with solid geometry and technical details.
// All geometry uses closed meshes with real-world thicknesses.
import { useMemo } from 'react';
import { useElevatorStore } from '../store/elevatorStore';
import { 
  RollerGuide, 
  SafetyGear, 
  ProfessionalSheave, 
  RHSBeam,
  ToeGuard 
} from './MechanicalParts';
import * as THREE from 'three';

// ─── UPN / C-Channel profile for crosshead beam ───────────────────────────────
function UPNBeam({ length, width = 0.20, height = 0.08, thickness = 0.01 }: { length: number; width?: number; height?: number; thickness?: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const w = width / 2;
    const h = height / 2;
    const t = thickness;
    // Outer
    s.moveTo(-w, -h);
    s.lineTo(w, -h);
    s.lineTo(w, h);
    s.lineTo(-w, h);
    s.lineTo(-w, -h);
    // Inner hole
    const hole = new THREE.Path();
    hole.moveTo(-w + t, -h + t);
    hole.lineTo(w, -h + t);
    hole.lineTo(w, h - t);
    hole.lineTo(-w + t, h - t);
    hole.lineTo(-w + t, -h + t);
    s.holes.push(hole);
    return s;
  }, [width, height, thickness]);

  return (
    <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
      <extrudeGeometry args={[shape, { depth: length, bevelEnabled: false }]} />
      <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

export function ElevatorCab() {
  const config = useElevatorStore((s) => s.config);
  const { cab, hoistway } = config;
  const cw = cab.width;
  const cd = cab.depth;
  const ch = cab.height;
  const wt = cab.wallThickness;
  const ft = cab.floorThickness;

  return (
    <group>
      {/* ══ FLOOR SLAB ═══════════════════════════════════════════════════════════ */}
      <mesh position={[0, -ft / 2, 0]} castShadow>
        <boxGeometry args={[cw, ft, cd]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* ══ CAB WALLS (L, R, Back) ══════════════════════════════════════════════ */}
      {/* Back Wall */}
      <mesh position={[0, ch / 2, -(cd / 2 - wt / 2)]} castShadow>
        <boxGeometry args={[cw, ch, wt]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-(cw / 2 - wt / 2), ch / 2, 0]} castShadow>
        <boxGeometry args={[wt, ch, cd]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[cw / 2 - wt / 2, ch / 2, 0]} castShadow>
        <boxGeometry args={[wt, ch, cd]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.2} />
      </mesh>

      {/* ══ CEILING ══════════════════════════════════════════════════════════════ */}
      <mesh position={[0, ch + wt / 2, 0]} castShadow>
        <boxGeometry args={[cw, wt, cd]} />
        <meshStandardMaterial color="#475569" metalness={0.6} />
      </mesh>

      {/* ══ SLING / CAR FRAME (Structural H-Frame) ═════════════════════════════ */}
      {/* Bottom Plank (Under floor) */}
      <group position={[0, -ft - 0.08, 0]}>
         <RHSBeam length={cw + 0.2} width={0.16} height={0.16} />
      </group>
      {/* Uprights (Stiles) */}
      <group position={[-(cw / 2 + 0.1), ch / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
         <RHSBeam length={ch + ft + 0.4} width={0.12} height={0.08} />
      </group>
      <group position={[cw / 2 + 0.1, ch / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
         <RHSBeam length={ch + ft + 0.4} width={0.12} height={0.08} />
      </group>
      {/* Crosshead (Top beam) */}
      <group position={[0, ch + 0.25, 0]}>
         <UPNBeam length={cw + 0.4} width={0.20} height={0.12} />
      </group>

      {/* ══ MECHANICAL ATTACHMENTS ══════════════════════════════════════════════ */}
      {/* Safety Gear (Under bottom plank) */}
      <group position={[-(cw / 2 + 0.1), -ft - 0.16, 0]}>
         <SafetyGear />
      </group>
      <group position={[cw / 2 + 0.1, -ft - 0.16, 0]}>
         <SafetyGear />
      </group>

      {/* Roller Guides (Top and Bottom) */}
      <group position={[-(cw / 2 + 0.1), ch + 0.35, 0]}>
         <RollerGuide />
      </group>
      <group position={[cw / 2 + 0.1, ch + 0.35, 0]}>
         <RollerGuide />
      </group>
      <group position={[-(cw / 2 + 0.1), -ft - 0.25, 0]}>
         <RollerGuide />
      </group>
      <group position={[cw / 2 + 0.1, -ft - 0.25, 0]}>
         <RollerGuide />
      </group>

      {/* Car Pulley (on top of crosshead for 2:1) */}
      <group position={[0, ch + 0.50, 0]} rotation={[0, 0, Math.PI / 2]}>
         <ProfessionalSheave diameter={0.4} grooves={6} />
      </group>

      {/* ══ TOE GUARD ═══════════════════════════════════════════════════════════ */}
      <group position={[0, -ft, cd / 2 + 0.05]}>
         <ToeGuard width={cw - 0.1} />
      </group>

      {/* ══ INTERNAL CAB DETAILS ════════════════════════════════════════════════ */}
      {/* Car Operating Panel (COP) */}
      <group position={[cw / 2 - wt - 0.02, ch / 2, cd / 2 - 0.4]}>
         <mesh castShadow>
            <boxGeometry args={[0.02, 1.4, 0.25]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
         </mesh>
         {/* Button grid */}
         {Array.from({ length: 10 }).map((_, i) => (
           <mesh key={i} position={[0.012, -0.4 + i * 0.08, 0]} rotation={[0, 0, Math.PI/2]}>
             <cylinderGeometry args={[0.015, 0.015, 0.01, 16]} />
             <meshStandardMaterial color="#cbd5e1" emissive="#3b82f6" emissiveIntensity={0.2} />
           </mesh>
         ))}
      </group>

      {/* Internal Lighting (Recessed LED) */}
      <mesh position={[0, ch - 0.01, 0]}>
        <boxGeometry args={[cw * 0.7, 0.005, cd * 0.7]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.8} />
      </mesh>

      {/* ══ CAB DOORS & OPERATOR ════════════════════════════════════════════════ */}
      <group position={[0, ch / 2, cd / 2 + wt / 2 + 0.01]}>
        {cab.doorType === 'center' ? (
          <>
            <mesh position={[-(cw / 4), 0, 0]} castShadow>
              <boxGeometry args={[cw / 2 - wt - 0.02, ch - 0.05, 0.040]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} />
            </mesh>
            <mesh position={[(cw / 4), 0, 0]} castShadow>
              <boxGeometry args={[cw / 2 - wt - 0.02, ch - 0.05, 0.040]} />
              <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} />
            </mesh>
          </>
        ) : (
          <mesh position={[cw / 4, 0, 0]} castShadow>
            <boxGeometry args={[cw / 2 + 0.05, ch - 0.05, 0.040]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.15} />
          </mesh>
        )}

        {/* Door Operator */}
        <group position={[cw / 2 - 0.40, ch / 2 + 0.12, 0]}>
           <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.15, 16]} />
              <meshStandardMaterial color="#1e293b" />
           </mesh>
           <mesh position={[-cw / 2 + 0.40, 0, 0]} castShadow>
              <boxGeometry args={[cw, 0.04, 0.03]} />
              <meshStandardMaterial color="#0f172a" />
           </mesh>
        </group>

        {/* Light Curtain */}
        <mesh position={[cw / 2 - wt - 0.01, 0, 0]} castShadow>
           <boxGeometry args={[0.010, ch, 0.010]} />
           <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
}
