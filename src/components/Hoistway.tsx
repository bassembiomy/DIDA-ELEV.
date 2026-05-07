// src/components/Hoistway.tsx
// 4 individual solid concrete wall slabs — no open surfaces.
// Front wall is transparent (cutaway section view so interior is visible).
import { useElevatorStore } from '../store/elevatorStore';
import { calculateEngineering } from '../utils/engineeringCalculations';
import * as THREE from 'three';
import { TGuideRail, RailBracket, Fishplate } from './MechanicalParts';

// Material colors per wall type
const WALL_COLOR: Record<string, string> = {
  concrete: '#9ca3af',
  brick: '#b45309',
  steel: '#334155',
};

export function Hoistway() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, performance } = config;
  const { totalShaftHeight, bufferStroke } = calculateEngineering(config);

  const wt  = hoistway.wallThickness; // 0.2m
  const hw  = hoistway.width;
  const hd  = hoistway.depth;
  const pit = hoistway.pitDepth;
  const wallColor = WALL_COLOR[hoistway.wallMaterial] ?? '#9ca3af';

  const lateralClearance = (hw - cab.width) / 2;
  const depthClearance   = (hd - cab.depth) / 2;
  const hasViolation = lateralClearance < 0.2 || depthClearance < 0.2;

  const shaftH = totalShaftHeight;

  return (
    <group position={[0, -pit, 0]}>

      {/* ── PIT FLOOR — 200mm concrete slab ── */}
      <mesh position={[0, -(wt / 2), 0]} receiveShadow>
        <boxGeometry args={[hw + wt * 2, wt, hd + wt * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} metalness={0} />
      </mesh>

      {/* ── ROOF SLAB ── */}
      <mesh position={[0, shaftH + wt / 2, 0]} receiveShadow>
        <boxGeometry args={[hw + wt * 2, wt, hd + wt * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} metalness={0} />
      </mesh>

      {/* ── BACK WALL (solid, opaque) ── */}
      <mesh position={[0, shaftH / 2, -(hd / 2 + wt / 2)]} receiveShadow>
        <boxGeometry args={[hw + wt * 2, shaftH, wt]} />
        <meshStandardMaterial
          color={hasViolation ? '#ef4444' : wallColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* ── LEFT WALL (solid, opaque) ── */}
      <mesh position={[-(hw / 2 + wt / 2), shaftH / 2, 0]} receiveShadow>
        <boxGeometry args={[wt, shaftH, hd + wt * 2]} />
        <meshStandardMaterial
          color={hasViolation ? '#ef4444' : wallColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* ── RIGHT WALL (solid, opaque) ── */}
      <mesh position={[(hw / 2 + wt / 2), shaftH / 2, 0]} receiveShadow>
        <boxGeometry args={[wt, shaftH, hd + wt * 2]} />
        <meshStandardMaterial
          color={hasViolation ? '#ef4444' : wallColor}
          roughness={0.95}
          metalness={0}
        />
      </mesh>

      {/* ── FRONT WALL — transparent cutaway (section view) ── */}
      <mesh position={[0, shaftH / 2, (hd / 2 + wt / 2)]}>
        <boxGeometry args={[hw + wt * 2, shaftH, wt]} />
        <meshStandardMaterial
          color={wallColor}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── FLOOR SLAB INDICATORS per level ── */}
      {Array.from({ length: performance.stops }).map((_, i) => {
        const yFloor = pit + i * performance.floorHeight;
        return (
          <group key={i} position={[0, yFloor, 0]}>
            {/* Landing sill beam (UPN 160 channel) sitting UNDER the sill */}
            <mesh position={[0, -0.080, hd / 2 + wt / 2]} castShadow>
              <boxGeometry args={[hw + wt * 2, 0.160, wt]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>
            {/* Floor plane (ghost) */}
            <mesh position={[0, 0.001, 0]}>
              <boxGeometry args={[hw, 0.002, hd]} />
              <meshStandardMaterial color="#cbd5e1" transparent opacity={0.15} />
            </mesh>
          </group>
        );
      })}

      {/* ── CAB GUIDE RAILS — T75-B, ISO 7465 ── */}
      {/* Left rail */}
      <group position={[-hoistway.dbg / 2, 0, 0]}>
        <TGuideRail height={shaftH} />
        {/* Mounting brackets every 2.5m (EN 81-20 §5.7) */}
        {Array.from({ length: Math.ceil(shaftH / 2.5) }).map((_, i) => (
          <group key={i} position={[-0.040, i * 2.5 + 1.2, 0]}>
             <RailBracket wallDist={hw / 2 - hoistway.dbg / 2} />
          </group>
        ))}
        {/* Fishplates every 5m */}
        {Array.from({ length: Math.floor(shaftH / 5) }).map((_, i) => (
          <group key={i} position={[0, i * 5 + 2.5, -0.01]}>
             <Fishplate />
          </group>
        ))}
      </group>
      {/* Right rail */}
      <group position={[hoistway.dbg / 2, 0, 0]} rotation={[0, Math.PI, 0]}>
        <TGuideRail height={shaftH} />
        {Array.from({ length: Math.ceil(shaftH / 2.5) }).map((_, i) => (
          <group key={i} position={[-0.040, i * 2.5 + 1.2, 0]}>
             <RailBracket wallDist={hw / 2 - hoistway.dbg / 2} />
          </group>
        ))}
        {Array.from({ length: Math.floor(shaftH / 5) }).map((_, i) => (
          <group key={i} position={[0, i * 5 + 2.5, -0.01]}>
             <Fishplate />
          </group>
        ))}
      </group>

      {/* ── CW GUIDE RAILS ── */}
      <group position={[-cab.width * 0.35, 0, -hoistway.cwDistance]}>
        <TGuideRail height={shaftH} />
        {/* Brackets on back wall */}
        {Array.from({ length: Math.ceil(shaftH / 2.5) }).map((_, i) => (
          <group key={i} position={[0, i * 2.5 + 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
             <RailBracket wallDist={hd / 2 - hoistway.cwDistance} />
          </group>
        ))}
      </group>
      <group position={[cab.width * 0.35, 0, -hoistway.cwDistance]} rotation={[0, Math.PI, 0]}>
        <TGuideRail height={shaftH} />
        {Array.from({ length: Math.ceil(shaftH / 2.5) }).map((_, i) => (
          <group key={i} position={[0, i * 2.5 + 1.2, 0]} rotation={[0, Math.PI / 2, 0]}>
             <RailBracket wallDist={hd / 2 - hoistway.cwDistance} />
          </group>
        ))}
      </group>
    </group>
  );
}
