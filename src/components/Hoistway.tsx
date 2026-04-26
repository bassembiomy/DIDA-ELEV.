// src/components/Hoistway.tsx
import { useElevatorStore } from '../store/elevatorStore';
import { calculateEngineering } from '../utils/engineeringCalculations';
import * as THREE from 'three';
import { TGuideRail } from './MechanicalParts';

export function Hoistway() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, performance } = config;
  const { totalShaftHeight } = calculateEngineering(config);

  const lateralClearance = (hoistway.width - cab.width) / 2;
  const depthClearance = (hoistway.depth - cab.depth) / 2;
  const hasViolation = lateralClearance < 0.2 || depthClearance < 0.2;

  return (
    <group position={[0, -hoistway.pitDepth, 0]}>
      {/* Pit Floor */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[hoistway.width + 2, 0.2, hoistway.depth + 2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Floors Indicators */}
      {Array.from({ length: performance.stops }).map((_, i) => (
        <group key={i} position={[0, hoistway.pitDepth + (i * performance.floorHeight), 0]}>
          <mesh position={[0, -0.1, hoistway.depth / 2 + 0.5]}>
            <boxGeometry args={[hoistway.width + 1, 0.2, 1]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[hoistway.width, 0.02, hoistway.depth]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Walls (Technical Appearance) */}
      <mesh position={[0, totalShaftHeight / 2, 0]}>
        <boxGeometry args={[hoistway.width, totalShaftHeight, hoistway.depth]} />
        <meshStandardMaterial
          color={hasViolation ? "#ef4444" : "#94a3b8"}
          transparent
          opacity={hasViolation ? 0.2 : 0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* --- CABIN GUIDE RAILS (Professional T-Profile) --- */}
      <group position={[-hoistway.dbg / 2, 0, 0]}>
        <TGuideRail height={totalShaftHeight} />
        {/* Mounting Brackets every 2.5m */}
        {Array.from({ length: Math.ceil(totalShaftHeight / 2.5) }).map((_, i) => (
          <mesh key={i} position={[-0.1, i * 2.5, 0.05]}>
            <boxGeometry args={[0.2, 0.1, 0.1]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
      </group>
      <group position={[hoistway.dbg / 2, 0, 0]} rotation={[0, Math.PI, 0]}>
        <TGuideRail height={totalShaftHeight} />
        {Array.from({ length: Math.ceil(totalShaftHeight / 2.5) }).map((_, i) => (
          <mesh key={i} position={[-0.1, i * 2.5, 0.05]}>
            <boxGeometry args={[0.2, 0.1, 0.1]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        ))}
      </group>

      {/* --- CW GUIDE RAILS --- */}
      <group position={[-cab.width * 0.35, 0, -hoistway.cwDistance]}>
         <TGuideRail height={totalShaftHeight} />
      </group>
      <group position={[cab.width * 0.35, 0, -hoistway.cwDistance]}>
         <TGuideRail height={totalShaftHeight} />
      </group>
    </group>
  );
}
