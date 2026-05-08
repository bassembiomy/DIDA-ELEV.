// src/components/PitEquipment.tsx
import { useElevatorStore } from '../store/elevatorStore';
import { OilBuffer } from './MechanicalParts';

export function PitEquipment() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, machine } = config;
  
  // Safe default buffer stroke if engine is offline
  const bufferStroke = 0.420;

  return (
    <group position={[0, -hoistway.pitDepth, 0]}>
      {/* CAB BUFFERS */}
      <group position={[-cab.width * 0.25, 0, 0]}>
        <OilBuffer stroke={bufferStroke} />
      </group>
      <group position={[cab.width * 0.25, 0, 0]}>
        <OilBuffer stroke={bufferStroke} />
      </group>

      {/* CW BUFFER */}
      <group position={[0, 0, -hoistway.cwDistance]}>
        <OilBuffer stroke={bufferStroke} />
      </group>

      {/* COMPENSATION PULLEY */}
      {machine.ropingSystem !== '1:1 Roping' && (
        <group position={[0, 0.40, -hoistway.cwDistance / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.08, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} />
          </mesh>
        </group>
      )}

      {/* PIT LADDER */}
      <group position={[hoistway.width / 2 - 0.050, hoistway.pitDepth / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[-0.190, 0, 0]} castShadow>
          <boxGeometry args={[0.040, hoistway.pitDepth, 0.040]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        <mesh position={[0.190, 0, 0]} castShadow>
          <boxGeometry args={[0.040, hoistway.pitDepth, 0.040]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
