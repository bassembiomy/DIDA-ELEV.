// src/components/Hoistway.tsx
import { useElevatorStore } from '../store/elevatorStore';
import * as THREE from 'three';
import { TGuideRail } from './MechanicalParts';

const WALL_COLOR: Record<string, string> = {
  Concrete: '#9ca3af',
  Brick: '#b45309',
  Steel: '#334155',
};

export function Hoistway() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, performance } = config;
  
  const wt  = hoistway.wallThickness;
  const hw  = hoistway.width;
  const hd  = hoistway.depth;
  const pit = hoistway.pitDepth;
  const wallColor = WALL_COLOR[hoistway.wallMaterial] ?? '#9ca3af';

  // Calculate total height from floor heights
  const tt = performance.floorHeightsMm.reduce((a, b) => a + b, 0) / 1000;
  const shaftH = pit + tt + hoistway.overhead;

  return (
    <group position={[0, -pit, 0]}>
      {/* PIT FLOOR */}
      <mesh position={[0, -(wt / 2), 0]} receiveShadow>
        <boxGeometry args={[hw + wt * 2, wt, hd + wt * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} metalness={0} />
      </mesh>

      {/* ROOF SLAB */}
      <mesh position={[0, shaftH + wt / 2, 0]} receiveShadow>
        <boxGeometry args={[hw + wt * 2, wt, hd + wt * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} metalness={0} />
      </mesh>

      {/* WALLS */}
      <mesh position={[0, shaftH / 2, -(hd / 2 + wt / 2)]} receiveShadow>
        <boxGeometry args={[hw + wt * 2, shaftH, wt]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[-(hw / 2 + wt / 2), shaftH / 2, 0]} receiveShadow>
        <boxGeometry args={[wt, shaftH, hd + wt * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[(hw / 2 + wt / 2), shaftH / 2, 0]} receiveShadow>
        <boxGeometry args={[wt, shaftH, hd + wt * 2]} />
        <meshStandardMaterial color={wallColor} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[0, shaftH / 2, (hd / 2 + wt / 2)]}>
        <boxGeometry args={[hw + wt * 2, shaftH, wt]} />
        <meshStandardMaterial color={wallColor} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* FLOOR INDICATORS */}
      {Array.from({ length: performance.stops }).map((_, i) => {
        let yFloor = pit;
        for(let j=0; j<i; j++) yFloor += (performance.floorHeightsMm[j] || 3500) / 1000;
        return (
          <group key={i} position={[0, yFloor, 0]}>
            <mesh position={[0, -0.080, hd / 2 + wt / 2]} castShadow>
              <boxGeometry args={[hw + wt * 2, 0.160, wt]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>
          </group>
        );
      })}

      {/* GUIDE RAILS */}
      <group position={[-hoistway.dbg / 2, 0, 0]}>
        <TGuideRail height={shaftH} />
      </group>
      <group position={[hoistway.dbg / 2, 0, 0]} rotation={[0, Math.PI, 0]}>
        <TGuideRail height={shaftH} />
      </group>
    </group>
  );
}
