// src/components/PitEquipment.tsx
// Pit equipment: oil buffers, pit ladder, compensation pulley, lighting.
// All geometry = closed solids with real dimensions.
import { useElevatorStore } from '../store/elevatorStore';
import { calculateEngineering } from '../utils/engineeringCalculations';
import { OilBuffer } from './MechanicalParts';

export function PitEquipment() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, machine } = config;
  const { bufferStroke } = calculateEngineering(config);

  // Buffers sit on the pit floor (y = 0 relative to pit floor)
  return (
    <group position={[0, -hoistway.pitDepth, 0]}>

      {/* ── CAB BUFFERS (2 oil buffers under cab footprint) ── */}
      <group position={[-cab.width * 0.25, 0, 0]}>
        <OilBuffer stroke={bufferStroke} />
      </group>
      <group position={[cab.width * 0.25, 0, 0]}>
        <OilBuffer stroke={bufferStroke} />
      </group>

      {/* ── CW BUFFER (1 buffer under counterweight travel) ── */}
      <group position={[0, 0, -hoistway.cwDistance]}>
        <OilBuffer stroke={bufferStroke} />
      </group>

      {/* ── PIT LADDER — welded steel rungs (Moved to side wall to avoid door clash) ── */}
      <group position={[hoistway.width / 2 - 0.050, hoistway.pitDepth / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Side rails */}
        <mesh position={[-0.190, 0, 0]} castShadow>
          <boxGeometry args={[0.040, hoistway.pitDepth, 0.040]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        <mesh position={[0.190, 0, 0]} castShadow>
          <boxGeometry args={[0.040, hoistway.pitDepth, 0.040]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        {/* Rungs every 300mm */}
        {Array.from({ length: Math.ceil(hoistway.pitDepth / 0.30) }).map((_, i) => (
          <mesh key={i} position={[0, -hoistway.pitDepth / 2 + i * 0.30 + 0.15, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.380, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── COMPENSATION ROPE PULLEY (for roping ratio > 1) ── */}
      {machine.ropingRatio > 1 && (
        <group position={[0, 0.40, -hoistway.cwDistance / 2]} rotation={[Math.PI / 2, 0, 0]}>
          {/* Pulley body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} />
          </mesh>
          {/* Pulley mounting shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[0.030, 0.030, 0.20, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        </group>
      )}

      {/* ── GOVERNOR TENSION WEIGHT ── */}
      <group position={[-hoistway.width / 2 + 0.30, 0.30, -0.30]}>
         {/* Tensioner frame */}
         <mesh castShadow>
            <boxGeometry args={[0.2, 0.6, 0.1]} />
            <meshStandardMaterial color="#334155" />
         </mesh>
         {/* Pulley */}
         <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
            <meshStandardMaterial color="#1e293b" />
         </mesh>
         {/* Weights */}
         <mesh position={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.25, 0.15, 0.15]} />
            <meshStandardMaterial color="#0f172a" />
         </mesh>
      </group>

      {/* ── PIT LIGHTING (fluorescent fixture) ── */}
      <mesh position={[0, hoistway.pitDepth - 0.15, 0]} castShadow>
        <boxGeometry args={[0.60, 0.060, 0.120]} />
        <meshStandardMaterial color="#f1f5f9" emissive="#f1f5f9" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}
