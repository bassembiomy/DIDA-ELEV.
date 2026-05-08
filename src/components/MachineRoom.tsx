import { useElevatorStore } from '../store/elevatorStore';
import { IBeam } from './MechanicalParts';

export function MachineRoom() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, machine, performance } = config;

  if (hoistway.machineRoomLocation !== 'Top') return null;

  // Calculate machine room floor Y
  const tt = performance.floorHeightsMm.reduce((a, b) => a + b, 0) / 1000;
  const mrFloorY = tt + hoistway.overhead;

  return (
    <group position={[0, mrFloorY, 0]}>
      {/* Machine Room Floor slab */}
      <mesh position={[0, -0.075, 0]} receiveShadow>
        <boxGeometry args={[hoistway.width + hoistway.wallThickness * 2, 0.150, hoistway.depth + hoistway.wallThickness * 2]} />
        <meshStandardMaterial color="#9ca3af" roughness={0.95} />
      </mesh>

      {/* Machine Support I-Beams */}
      <group position={[0, 0.100, -0.200]}>
         {[-1, 1].map((side) => (
           <group key={side} position={[0, 0, side * 0.4]}>
              <group rotation={[0, -Math.PI / 2, 0]} position={[-(hoistway.width + hoistway.wallThickness * 2) / 2, 0, 0]}>
                 <IBeam length={hoistway.width + hoistway.wallThickness * 2} />
              </group>
           </group>
         ))}
      </group>

      {/* Control PanelCabinet */}
      <mesh position={[hoistway.width / 2 - 0.40, 0.9, -hoistway.depth / 2 + 0.28]} castShadow>
        <boxGeometry args={[0.600, 1.800, 0.350]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Deflector sheave */}
      {machine.ropingSystem !== '1:1 Roping' && (
        <group position={[-0.60, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.16, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      )}
    </group>
  );
}
