// src/components/ElevatorExtras.tsx
import { useElevatorStore } from '../store/elevatorStore';
import { calculateEngineering } from '../utils/engineeringCalculations';
import { ProfessionalSheave, RollerGuide } from './MechanicalParts';

export function Counterweight() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, machine } = config;
  const { counterweightMass, totalTravel } = calculateEngineering(config);

  const cwHeight = Math.max(1.0, counterweightMass / 500);
  const cwDepthOffset = -hoistway.cwDistance;

  return (
    <group position={[0, totalTravel, cwDepthOffset]}>
      {/* --- CW FRAME --- */}
      <mesh position={[0, cwHeight / 2, 0]}>
        <boxGeometry args={[cab.width * 0.7, cwHeight, 0.12]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      
      {/* CW Filler Weights (Visual detail) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, (i + 0.5) * (cwHeight / 5), 0]}>
          <boxGeometry args={[cab.width * 0.65, 0.1, 0.1]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      ))}

      {/* CW Roller Guides */}
      <group position={[-cab.width * 0.35, cwHeight, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <RollerGuide />
      </group>
      <group position={[cab.width * 0.35, cwHeight, 0]} rotation={[0, Math.PI / 2, 0]}>
        <RollerGuide />
      </group>

      {/* CW Pulleys for 2:1 or 4:1 roping */}
      {machine.ropingRatio > 1 && (
        <group position={[0, cwHeight + 0.2, 0]}>
          <ProfessionalSheave diameter={0.3} grooves={machine.ropeCount} />
        </group>
      )}
    </group>
  );
}

function VerticalRope({ x, z, y1, y2, diameter }: { x: number, z: number, y1: number, y2: number, diameter: number }) {
  const height = Math.abs(y2 - y1);
  const midY = (y1 + y2) / 2;
  return (
    <mesh position={[x, midY, z]}>
      <cylinderGeometry args={[diameter / 2000, diameter / 2000, height, 8]} />
      <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
    </mesh>
  );
}

export function Machine() {
  const config = useElevatorStore((s) => s.config);
  const { machine, hoistway, cab } = config;
  const { totalTravel, counterweightMass } = calculateEngineering(config);

  if (machine.location === 'none') return null;

  const machineY = machine.location === 'above' ? totalTravel + hoistway.overhead - 0.5 : -0.5;
  const cwDepthOffset = -hoistway.cwDistance;
  const cwHeight = Math.max(1.0, counterweightMass / 500);

  return (
    <group position={[0, 0, 0]}>
      {/* Professional Machine Unit */}
      <group position={[0, machineY, 0]}>
        <ProfessionalSheave diameter={machine.sheaveDiameter / 1000} grooves={machine.ropeCount} />
        {/* Support Bedplate */}
        <mesh position={[0, -0.2, -0.2]}>
          <boxGeometry args={[1.2, 0.1, 1.2]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* Dynamic Precise Rope Connections */}
      <group position={[0, 0, 0]}>
        {Array.from({ length: machine.ropeCount }).map((_, i) => {
          const ropeX = (i - (machine.ropeCount - 1) / 2) * 0.03;
          const cabHitchY = cab.height + 0.35;
          const cwHitchY = totalTravel + cwHeight + 0.2;

          if (machine.ropingRatio === 1) {
            return (
              <group key={i}>
                <VerticalRope x={ropeX} z={0} y1={cabHitchY} y2={machineY} diameter={machine.ropeDiameter} />
                <VerticalRope x={ropeX} z={cwDepthOffset} y1={cwHitchY} y2={machineY} diameter={machine.ropeDiameter} />
              </group>
            );
          } else if (machine.ropingRatio === 2) {
            return (
              <group key={i}>
                {/* Dead end at ceiling -> Cab Pulley -> Machine -> CW Pulley -> Dead end at ceiling */}
                <VerticalRope x={ropeX - 0.1} z={0} y1={machineY + 0.5} y2={cabHitchY} diameter={machine.ropeDiameter} />
                <VerticalRope x={ropeX + 0.1} z={0} y1={cabHitchY} y2={machineY} diameter={machine.ropeDiameter} />
                <VerticalRope x={ropeX} z={cwDepthOffset} y1={machineY} y2={cwHitchY} diameter={machine.ropeDiameter} />
                <VerticalRope x={ropeX} z={cwDepthOffset} y1={cwHitchY} y2={machineY + 0.5} diameter={machine.ropeDiameter} />
              </group>
            );
          } else if (machine.ropingRatio === 4) {
             // Highly complex roping visualization (Simplified for performance but structurally indicative)
             return (
               <group key={i}>
                 <VerticalRope x={ropeX - 0.2} z={0} y1={machineY + 0.5} y2={cabHitchY} diameter={machine.ropeDiameter} />
                 <VerticalRope x={ropeX + 0.2} z={0} y1={cabHitchY} y2={machineY} diameter={machine.ropeDiameter} />
                 <VerticalRope x={ropeX - 0.15} z={cwDepthOffset} y1={machineY} y2={cwHitchY} diameter={machine.ropeDiameter} />
                 <VerticalRope x={ropeX + 0.15} z={cwDepthOffset} y1={cwHitchY} y2={machineY + 0.5} diameter={machine.ropeDiameter} />
               </group>
             );
          }
          return null;
        })}
      </group>
    </group>
  );
}
