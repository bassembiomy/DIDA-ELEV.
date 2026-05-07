import { useElevatorStore } from '../store/elevatorStore';
import { calculateEngineering } from '../utils/engineeringCalculations';
import { IBeam, BeamSupportPlate, RopeSegment } from './MechanicalParts';
import * as THREE from 'three';

export function MachineRoom() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, machine } = config;
  const { totalShaftHeight } = calculateEngineering(config);

  if (machine.location !== 'above') return null;

  // Machine room floor starts at top of shaft
  const mrFloorY = totalShaftHeight - hoistway.pitDepth;

  return (
    <group position={[0, mrFloorY, 0]}>

      {/* ── Machine Room Floor slab (150mm concrete) ── */}
      <mesh position={[0, -0.075, 0]} receiveShadow>
        <boxGeometry args={[hoistway.width + hoistway.wallThickness * 2, 0.150, hoistway.depth + hoistway.wallThickness * 2]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.95} />
      </mesh>

      {/* ── Rope Holes in Floor ── */}
      <mesh position={[0, -0.075, 0]}>
         <boxGeometry args={[0.3, 0.16, 0.3]} />
         <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, -0.075, -hoistway.cwDistance]}>
         <boxGeometry args={[0.3, 0.16, 0.3]} />
         <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* ── Machine Support I-Beams (HEB 200) ── */}
      {/* Spanning the Width (X-axis) */}
      <group position={[0, 0.100, -0.200]}>
         {[-1, 1].map((side) => (
           <group key={side} position={[0, 0, side * 0.4]}>
              {/* The beam itself */}
              <group rotation={[0, -Math.PI / 2, 0]} position={[-(hoistway.width + hoistway.wallThickness * 2) / 2, 0, 0]}>
                 <IBeam length={hoistway.width + hoistway.wallThickness * 2} />
              </group>
              {/* Support plates at both ends */}
              <group position={[-(hoistway.width + hoistway.wallThickness) / 2, -0.11, 0]}>
                 <BeamSupportPlate />
              </group>
              <group position={[(hoistway.width + hoistway.wallThickness) / 2, -0.11, 0]}>
                 <BeamSupportPlate />
              </group>
           </group>
         ))}
      </group>

      {/* ── Vibration Isolation Pads ── */}
      {[-1, 1].map(x => [-1, 1].map(z => (
         <mesh key={`${x}-${z}`} position={[x * 0.3, 0.21, -0.2 + z * 0.4]}>
            <boxGeometry args={[0.15, 0.02, 0.15]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
         </mesh>
      )))}

      {/* ── Anchor Bolts (M24) ── */}
      {[-1, 1].map(x => [-1, 1].map(z => (
         <mesh key={`bolt-${x}-${z}`} position={[x * 0.3, 0.25, -0.2 + z * 0.4]}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={1} />
         </mesh>
      )))}

      {/* ── Control Panel Cabinet (IP54 steel enclosure) ── */}
      <mesh position={[hoistway.width / 2 - 0.40, 0.9, -hoistway.depth / 2 + 0.28]} castShadow>
        <boxGeometry args={[0.600, 1.800, 0.350]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Cabinet door */}
      <mesh position={[hoistway.width / 2 - 0.40, 0.9, -hoistway.depth / 2 + 0.110]} castShadow>
        <boxGeometry args={[0.580, 1.760, 0.010]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Panel display */}
      <mesh position={[hoistway.width / 2 - 0.40, 1.2, -hoistway.depth / 2 + 0.104]}>
        <boxGeometry args={[0.220, 0.180, 0.002]} />
        <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.7} />
      </mesh>

      {/* ── Emergency Stop Button ── */}
      <group position={[hoistway.width / 2 - 0.1, 1.2, 0]}>
         <mesh rotation={[0, -Math.PI / 2, 0]}>
            <boxGeometry args={[0.1, 0.1, 0.05]} />
            <meshStandardMaterial color="#fbbf24" />
         </mesh>
         <mesh position={[-0.03, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.04, 16]} />
            <meshStandardMaterial color="#dc2626" />
         </mesh>
      </group>

      {/* ── Deflector sheave (if 2:1 roping) ── */}
      {machine.ropingRatio > 1 && (
        <group position={[-0.60, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.16, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.40, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        </group>
      )}

      {/* ── Governor (overspeed device) ── */}
      <group position={[-hoistway.width / 2 + 0.30, 0.70, -0.30]}>
        {/* Governor body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 16]} />
          <meshStandardMaterial color="#374151" metalness={0.75} />
        </mesh>
        {/* Governor sheave */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.10, 0.10, 0.06, 20]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
        {/* Mounting post */}
        <mesh position={[0, -0.24, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.30, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
      </group>

      {/* ── Traction Ropes (Visual) ── */}
      <group position={[0, -0.4, 0]}>
         {[-0.08, -0.04, 0, 0.04, 0.08].map((dz, i) => (
           <group key={i} position={[0, 0, dz]}>
              <RopeSegment length={1.5} />
              <group position={[0, 0, -hoistway.cwDistance]}>
                 <RopeSegment length={1.5} />
              </group>
           </group>
         ))}
      </group>

      {/* ── Machine room lighting ── */}
      <mesh position={[0, 2.6, 0]} castShadow>
        <boxGeometry args={[1.20, 0.06, 0.18]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
