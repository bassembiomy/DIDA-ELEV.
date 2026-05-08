import { useElevatorStore } from '../store/elevatorStore';
import { ProfessionalSheave, RollerGuide, SafetyGear, RHSBeam } from './MechanicalParts';

// ─────────────────────────────────────────────────────────────────────────────
// Counterweight
// ─────────────────────────────────────────────────────────────────────────────
export function Counterweight() {
  const config = useElevatorStore((s) => s.config);
  const { hoistway, cab, machine } = config;
  
  const totalTravel = config.performance.floorHeightsMm.reduce((a, b) => a + b, 0) / 1000;
  const cwH     = 2.0; 
  const cwW     = cab.width * 0.65;
  const cwD     = 0.15;                                      // depth of CW frame
  const frameT  = 0.012;                                     // frame plate thickness
  const cwDepthOffset = -hoistway.cwDistance;

  return (
    <group position={[0, totalTravel, cwDepthOffset]}>

      {/* ── CW Back plate (main structural slab) ── */}
      <mesh position={[0, cwH / 2, 0]} castShadow>
        <boxGeometry args={[cwW, cwH, frameT]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* ── CW Side channels (UPN sections) ── */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (cwW / 2 + 0.020), cwH / 2, cwD / 2]} castShadow>
          <boxGeometry args={[0.040, cwH + 0.05, cwD]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      {/* ── Top and Bottom Tie Beams (RHS) ── */}
      <group position={[0, cwH + 0.025, cwD / 2]} rotation={[0, 0, Math.PI / 2]}>
         <RHSBeam length={cwW + 0.04} width={0.05} height={0.05} />
      </group>
      <group position={[0, -0.025, cwD / 2]} rotation={[0, 0, Math.PI / 2]}>
         <RHSBeam length={cwW + 0.04} width={0.05} height={0.05} />
      </group>

      {/* ── Front Retainer Plate (Steel mesh or thin plate) ── */}
      <mesh position={[0, cwH / 2, cwD + 0.002]} castShadow>
         <boxGeometry args={[cwW, cwH, 0.004]} />
         <meshStandardMaterial color="#334155" transparent opacity={0.6} />
      </mesh>

      {/* ── Filler weights — solid cast iron blocks ── */}
      {Array.from({ length: Math.round(cwH / 0.12) }).map((_, i) => (
        <mesh key={i} position={[0, i * 0.12 + 0.06, cwD / 2 - 0.010]} castShadow>
          <boxGeometry args={[cwW - 0.05, 0.100, cwD - 0.020]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#1e293b' : '#334155'} metalness={0.6} />
        </mesh>
      ))}

      {/* ── CW Safety Gear (under bottom beam) ── */}
      <group position={[-cwW / 2 - 0.04, -0.15, cwD / 2]}>
         <SafetyGear />
      </group>
      <group position={[cwW / 2 + 0.04, -0.15, cwD / 2]} rotation={[0, Math.PI, 0]}>
         <SafetyGear />
      </group>

      {/* ── Buffer Striker Plate ── */}
      <mesh position={[0, -0.06, cwD / 2]} castShadow>
         <boxGeometry args={[0.2, 0.04, 0.2]} />
         <meshStandardMaterial color="#0f172a" metalness={1} />
      </mesh>

      {/* ── Roller guides ── */}
      <group position={[-cwW / 2 - 0.04, cwH + 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <RollerGuide />
      </group>
      <group position={[cwW / 2 + 0.04, cwH + 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <RollerGuide />
      </group>
      {/* Bottom guides */}
      <group position={[-cwW / 2 - 0.04, -0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <RollerGuide />
      </group>
      <group position={[cwW / 2 + 0.04, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <RollerGuide />
      </group>

      {/* ── CW pulleys (2:1 or 4:1) ── */}
      {machine.ropingSystem !== '1:1 Roping' && (
        <group position={[0, cwH + 0.24, 0]}>
          <ProfessionalSheave diameter={0.30} grooves={machine.ropeCount} />
        </group>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rope segment — solid cylinder with correct radius
// ─────────────────────────────────────────────────────────────────────────────
function RopeSegment({
  x, z, y1, y2, diameter,
}: {
  x: number; z: number; y1: number; y2: number; diameter: number;
}) {
  const h = Math.abs(y2 - y1);
  const midY = (y1 + y2) / 2;
  const r = (diameter / 2) / 1000; // mm → m
  return (
    <mesh position={[x, midY, z]} castShadow>
      <cylinderGeometry args={[r, r, h, 10]} />
      <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Machine (traction motor unit)
// ─────────────────────────────────────────────────────────────────────────────
export function Machine() {
  const config = useElevatorStore((s) => s.config);
  const { machine, hoistway, cab } = config;
  const totalTravel = config.performance.floorHeightsMm.reduce((a, b) => a + b, 0) / 1000;
  const counterweightMass = (cab.width * cab.depth * 200 + 400) + (config.cab.ratedLoadKg * 0.45);

  if (hoistway.machineRoomLocation === 'None') return null;

  const machineY = hoistway.machineRoomLocation === 'Top'
    ? totalTravel + hoistway.overhead - 0.6
    : -0.6;
  const cwDepthOff  = -hoistway.cwDistance;
  const cwH         = Math.max(1.0, counterweightMass / 500);
  const sheaveD     = machine.sheaveDiameter / 1000;

  return (
    <group>
      {/* ── Machine bedplate (steel plate 25mm) ── */}
      <mesh position={[0, machineY - 0.025, -0.20]} castShadow>
        <boxGeometry args={[1.400, 0.025, 1.200]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* ── Motor housing (gearless disc motor) ── */}
      <mesh position={[0.350, machineY, -0.20]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.220, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Motor face plate */}
      <mesh position={[0.350, machineY, -0.20 + 0.115]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.010, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.95} />
      </mesh>

      {/* ── Traction Sheave ── */}
      <group position={[0, machineY, 0]}>
        <ProfessionalSheave diameter={sheaveD} grooves={machine.ropeCount} />
      </group>

      {/* ── Brake housing (disc brake) ── */}
      <mesh position={[-0.200, machineY, -0.20]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.150, 0.150, 0.120, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ── Rope connections ── */}
      {Array.from({ length: machine.ropeCount }).map((_, i) => {
        const ropeX = (i - (machine.ropeCount - 1) / 2) * 0.030;
        const cabHitchY  = 0 + 0.080;   // top of cab
        const cwHitchY   = totalTravel + cwH + 0.24;

        if (machine.ropingSystem === '1:1 Roping') {
          return (
            <group key={i}>
              <RopeSegment x={ropeX} z={0}           y1={cabHitchY} y2={machineY} diameter={machine.ropeDiameter} />
              <RopeSegment x={ropeX} z={cwDepthOff}  y1={cwHitchY}  y2={machineY} diameter={machine.ropeDiameter} />
            </group>
          );
        }
        return (
          <group key={i}>
            <RopeSegment x={ropeX - 0.015} z={0}          y1={machineY + sheaveD / 2} y2={cabHitchY}  diameter={machine.ropeDiameter} />
            <RopeSegment x={ropeX + 0.015} z={0}          y1={cabHitchY}  y2={machineY + sheaveD / 2}  diameter={machine.ropeDiameter} />
            <RopeSegment x={ropeX}         z={cwDepthOff} y1={machineY + sheaveD / 2} y2={cwHitchY}   diameter={machine.ropeDiameter} />
          </group>
        );
      })}
    </group>
  );
}
