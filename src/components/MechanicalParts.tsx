// src/components/MechanicalParts.tsx
import * as THREE from 'three';
import { useMemo } from 'react';

/**
 * Professional T-Profile Guide Rail (ISO 7465)
 */
export function TGuideRail({ height }: { height: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // T-profile dimensions (mm converted to meters)
    // Example: T75-3/A
    const k = 0.075 / 2; // base half-width
    const b = 0.062 / 2; // head half-width
    const h = 0.010;     // thickness
    const d = 0.062;     // total depth
    
    s.moveTo(-k, 0);
    s.lineTo(k, 0);
    s.lineTo(k, h);
    s.lineTo(b, h);
    s.lineTo(b, d);
    s.lineTo(-b, d);
    s.lineTo(-b, h);
    s.lineTo(-k, h);
    s.lineTo(-k, 0);
    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
      <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
    </mesh>
  );
}

/**
 * Professional Roller Guide Assembly
 */
export function RollerGuide() {
  return (
    <group>
      {/* Mounting Bracket */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.15, 0.05, 0.1]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      
      {/* Three Rollers */}
      <group position={[0, 0, 0.1]}>
        {/* Main Roller (Front) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]}>
          <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} />
        </mesh>
        {/* Side Rollers */}
        <mesh rotation={[0, Math.PI / 2, 0]} position={[-0.05, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]} position={[0.05, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 16]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Professional Pulley (Sheave) with grooves
 */
export function ProfessionalSheave({ diameter, width = 0.2, grooves = 6 }: { diameter: number, width?: number, grooves?: number }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Main Body */}
      <mesh>
        <cylinderGeometry args={[diameter / 2, diameter / 2, width, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Hub */}
      <mesh>
        <cylinderGeometry args={[diameter / 6, diameter / 6, width + 0.05, 16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Grooves (Visual rings) */}
      {Array.from({ length: grooves }).map((_, i) => (
        <mesh key={i} position={[0, (i - (grooves-1)/2) * 0.02, 0]}>
          <torusGeometry args={[diameter / 2, 0.005, 8, 32]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}
    </group>
  );
}
