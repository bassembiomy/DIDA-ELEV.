// src/components/ShaftAccessories.tsx
import { useElevatorStore } from '../store/elevatorStore';

export function ShaftAccessories() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, performance } = config;

  const pit = hoistway.pitDepth;
  const tt = performance.floorHeightsMm.reduce((a, b) => a + b, 0) / 1000;
  const totalShaftHeight = pit + tt + hoistway.overhead;

  return (
    <group>
      {/* Shaft Lighting (every 7m) */}
      {Array.from({ length: Math.ceil(totalShaftHeight / 7) }).map((_, i) => (
        <mesh key={i} position={[hoistway.width / 2, i * 7 - pit, 0]} rotation={[0, -Math.PI / 2, 0]} castShadow>
          <boxGeometry args={[0.1, 0.6, 0.05]} />
          <meshStandardMaterial color="#f8fafc" emissive="#ffffff" emissiveIntensity={0.4} />
        </mesh>
      ))}

      {/* Position Sensor Flags */}
      {Array.from({ length: performance.stops }).map((_, i) => {
        let yFloor = 0;
        for(let j=0; j<i; j++) yFloor += (performance.floorHeightsMm[j] || 3500) / 1000;
        return (
          <mesh key={i} position={[hoistway.dbg / 2 + 0.05, yFloor, 0]}>
             <boxGeometry args={[0.01, 0.2, 0.08]} />
             <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}
