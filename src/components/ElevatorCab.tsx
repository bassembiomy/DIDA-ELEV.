// src/components/ElevatorCab.tsx
import { useElevatorStore } from '../store/elevatorStore';
import { ProfessionalSheave, RollerGuide } from './MechanicalParts';

export function ElevatorCab() {
  const config = useElevatorStore((s) => s.config);
  const { cab, machine } = config;

  const wallThickness = 0.05;

  return (
    <group>
      {/* --- CAB SLING (Structural Frame) --- */}
      <group>
        {/* Bottom Beam */}
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[cab.width + 0.2, 0.1, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={1} />
        </mesh>
        {/* Vertical Uprights */}
        <mesh position={[-cab.width / 2 - 0.1, cab.height / 2, 0]}>
          <boxGeometry args={[0.08, cab.height + 0.2, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={1} />
        </mesh>
        <mesh position={[cab.width / 2 + 0.1, cab.height / 2, 0]}>
          <boxGeometry args={[0.08, cab.height + 0.2, 0.1]} />
          <meshStandardMaterial color="#1e293b" metalness={1} />
        </mesh>
        {/* Crosshead (Top Beam) */}
        <mesh position={[0, cab.height + 0.1, 0]}>
          <boxGeometry args={[cab.width + 0.2, 0.1, 0.2]} />
          <meshStandardMaterial color="#1e293b" metalness={1} />
        </mesh>

        {/* Diagonal Bracing (Support Rods) - Professional CAD look */}
        <mesh position={[-cab.width / 4 - 0.1, cab.height / 2, 0]} rotation={[0, 0, Math.PI / 8]}>
          <cylinderGeometry args={[0.015, 0.015, cab.height + 0.4, 8]} />
          <meshStandardMaterial color="#475569" metalness={1} />
        </mesh>
        <mesh position={[cab.width / 4 + 0.1, cab.height / 2, 0]} rotation={[0, 0, -Math.PI / 8]}>
          <cylinderGeometry args={[0.015, 0.015, cab.height + 0.4, 8]} />
          <meshStandardMaterial color="#475569" metalness={1} />
        </mesh>
      </group>

      {/* --- TOE GUARD (Yellow Protection Plate) --- */}
      <mesh position={[0, -cab.toeGuardHeight / 2 - 0.1, cab.depth / 2 + 0.05]}>
        <boxGeometry args={[cab.width - 0.1, cab.toeGuardHeight, 0.01]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* --- ROLLER GUIDES --- */}
      <group position={[-cab.width / 2 - 0.1, cab.height + 0.15, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <RollerGuide />
      </group>
      <group position={[cab.width / 2 + 0.1, cab.height + 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
        <RollerGuide />
      </group>
      <group position={[-cab.width / 2 - 0.1, -0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <RollerGuide />
      </group>
      <group position={[cab.width / 2 + 0.1, -0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <RollerGuide />
      </group>

      {/* --- CAB INTERIOR --- */}
      <group position={[0, cab.height / 2, 0]}>
        <mesh position={[0, -cab.height / 2 + wallThickness / 2, 0]}>
          <boxGeometry args={[cab.width, wallThickness, cab.depth]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0, cab.height / 2 - wallThickness / 2, 0]}>
          <boxGeometry args={[cab.width, wallThickness, cab.depth]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[-cab.width / 2 + wallThickness / 2, 0, 0]}>
          <boxGeometry args={[wallThickness, cab.height, cab.depth]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
        </mesh>
        <mesh position={[cab.width / 2 - wallThickness / 2, 0, 0]}>
          <boxGeometry args={[wallThickness, cab.height, cab.depth]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, -cab.depth / 2 + wallThickness / 2]}>
          <boxGeometry args={[cab.width, cab.height, wallThickness]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} />
        </mesh>

        {/* COP (Car Operating Panel) */}
        <mesh position={[cab.width / 2 - wallThickness - 0.01, 0, cab.depth / 4]}>
          <boxGeometry args={[0.02, 1.2, 0.3]} />
          <meshStandardMaterial color="#1e293b" metalness={1} />
          {/* Blue Screen Placeholder */}
          <mesh position={[0.011, 0.4, 0]}>
             <planeGeometry args={[0.15, 0.1]} />
             <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
          </mesh>
        </mesh>
      </group>

      {/* --- CAB PULLEYS --- */}
      {machine.ropingRatio > 1 && (
        <group position={[0, cab.height + 0.35, 0]}>
          <ProfessionalSheave diameter={0.4} grooves={machine.ropeCount} />
        </group>
      )}

      {/* --- DOORS --- */}
      <group position={[0, cab.height / 2, cab.depth / 2]}>
        {cab.doorType === 'center' ? (
          <>
            <mesh position={[-cab.width / 4, 0, 0.03]}>
              <boxGeometry args={[cab.width / 2 - 0.05, cab.height - 0.1, 0.04]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
            <mesh position={[cab.width / 4, 0, 0.03]}>
              <boxGeometry args={[cab.width / 2 - 0.05, cab.height - 0.1, 0.04]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
          </>
        ) : (
          <mesh position={[cab.width / 4, 0, 0.03]}>
            <boxGeometry args={[cab.width / 2 - 0.05, cab.height - 0.1, 0.04]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
        )}
      </group>
    </group>
  );
}
