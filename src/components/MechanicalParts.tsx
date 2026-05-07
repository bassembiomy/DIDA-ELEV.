// src/components/MechanicalParts.tsx
import * as THREE from 'three';
import { useMemo } from 'react';

// ─────────────────────────────────────────────────────────────
// T-Profile Guide Rail (ISO 7465 — T75-B: 75×62×16mm)
// Closed ExtrudeGeometry → guaranteed solid, no open edges
// ─────────────────────────────────────────────────────────────
export function TGuideRail({ height }: { height: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // T75-B dimensions (meters)
    const bw = 0.075 / 2;   // base half-width  = 37.5mm
    const hw = 0.062 / 2;   // head half-width  = 31mm
    const bt = 0.016;        // base (flange) thickness = 16mm
    const d  = 0.062;        // total depth (height of T)
    // Closed T-profile (bottom = flange, top = web tip)
    s.moveTo(-bw,  0);
    s.lineTo( bw,  0);
    s.lineTo( bw,  bt);
    s.lineTo( hw,  bt);
    s.lineTo( hw,  d);
    s.lineTo(-hw,  d);
    s.lineTo(-hw,  bt);
    s.lineTo(-bw,  bt);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
      <extrudeGeometry args={[shape, { depth: height, bevelEnabled: false }]} />
      <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// Hollow RHS (Rectangular Hollow Section) — EN 10219
// Used for sling uprights (100×50×5mm) and crosshead
// ─────────────────────────────────────────────────────────────
export function RHSBeam({
  width = 0.100, height = 0.050, thickness = 0.005, length = 1.0,
  color = '#1e293b'
}: {
  width?: number; height?: number; thickness?: number;
  length?: number; color?: string;
}) {
  const shape = useMemo(() => {
    const ow = width, oh = height, t = thickness;
    const outer = new THREE.Shape();
    outer.moveTo(-ow / 2, -oh / 2);
    outer.lineTo( ow / 2, -oh / 2);
    outer.lineTo( ow / 2,  oh / 2);
    outer.lineTo(-ow / 2,  oh / 2);
    outer.closePath();
    const inner = new THREE.Path();
    inner.moveTo(-ow / 2 + t, -oh / 2 + t);
    inner.lineTo( ow / 2 - t, -oh / 2 + t);
    inner.lineTo( ow / 2 - t,  oh / 2 - t);
    inner.lineTo(-ow / 2 + t,  oh / 2 - t);
    inner.closePath();
    outer.holes.push(inner);
    return outer;
  }, [width, height, thickness]);

  return (
    <mesh castShadow>
      <extrudeGeometry args={[shape, { depth: length, bevelEnabled: false }]} />
      <meshStandardMaterial color={color} metalness={0.85} roughness={0.25} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// I-Beam Profile (HEB 200: 200x200x15x9mm)
// ─────────────────────────────────────────────────────────────
export function IBeam({ length = 2.0, color = '#334155' }: { length?: number; color?: string }) {
  const shape = useMemo(() => {
    const h = 0.200, b = 0.200, tf = 0.015, tw = 0.009;
    const s = new THREE.Shape();
    s.moveTo(-b / 2, -h / 2);
    s.lineTo( b / 2, -h / 2);
    s.lineTo( b / 2, -h / 2 + tf);
    s.lineTo( tw / 2, -h / 2 + tf);
    s.lineTo( tw / 2,  h / 2 - tf);
    s.lineTo( b / 2,  h / 2 - tf);
    s.lineTo( b / 2,  h / 2);
    s.lineTo(-b / 2,  h / 2);
    s.lineTo(-b / 2,  h / 2 - tf);
    s.lineTo(-tw / 2,  h / 2 - tf);
    s.lineTo(-tw / 2, -h / 2 + tf);
    s.lineTo(-b / 2, -h / 2 + tf);
    s.closePath();
    return s;
  }, []);

  return (
    <mesh castShadow>
      <extrudeGeometry args={[shape, { depth: length, bevelEnabled: false }]} />
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// Beam Support Plate (Steel bedplate for beam seating)
// ─────────────────────────────────────────────────────────────
export function BeamSupportPlate() {
  return (
    <mesh castShadow>
      <boxGeometry args={[0.300, 0.020, 0.300]} />
      <meshStandardMaterial color="#475569" metalness={0.8} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// Roller Guide Assembly (3-roller type, ISO 4194)
// ─────────────────────────────────────────────────────────────
export function RollerGuide() {
  return (
    <group>
      {/* Housing bracket — solid box */}
      <mesh position={[0, 0, 0.06]} castShadow>
        <boxGeometry args={[0.180, 0.080, 0.120]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Back plate */}
      <mesh position={[0, 0, 0.008]} castShadow>
        <boxGeometry args={[0.180, 0.080, 0.016]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      {/* Front roller (vertical axis) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.130]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.040, 24]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Left side roller (horizontal axis) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.065, 0, 0.095]} castShadow>
        <cylinderGeometry args={[0.030, 0.030, 0.035, 20]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Right side roller */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.065, 0, 0.095]} castShadow>
        <cylinderGeometry args={[0.030, 0.030, 0.035, 20]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Rubber tread rings on front roller */}
      {[-0.010, 0, 0.010].map((dy, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]} position={[0, dy, 0.130]}>
          <torusGeometry args={[0.045, 0.004, 8, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Guide Rail Wall Bracket (L-Angle steel bracket)
// ─────────────────────────────────────────────────────────────
export function RailBracket({ wallDist = 0.080 }: { wallDist?: number }) {
  const angleShape = useMemo(() => {
    // L-angle 50x50x6mm
    const w = 0.050, h = 0.050, t = 0.006;
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(w, 0);
    s.lineTo(w, t);
    s.lineTo(t, t);
    s.lineTo(t, h);
    s.lineTo(0, h);
    s.closePath();
    return s;
  }, []);

  return (
    <group>
      {/* L-Angle bracket body */}
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[-0.100, -0.025, wallDist]} castShadow>
        <extrudeGeometry args={[angleShape, { depth: 0.200, bevelEnabled: false }]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* Wall anchor bolts (M16) */}
      {[ -0.060, 0.060 ].map((dx, i) => (
        <group key={i} position={[dx, 0, wallDist + 0.006]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.040, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.022, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.010, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={1} />
          </mesh>
        </group>
      ))}

      {/* Rail clip bolt */}
      <group position={[0, 0, 0.040]} rotation={[Math.PI / 2, 0, 0]}>
         <mesh castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.030, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.9} />
          </mesh>
      </group>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Guide Rail Fishplate (ISO 7465 joint)
// ─────────────────────────────────────────────────────────────
export function Fishplate() {
  return (
    <group>
      {/* Main plate */}
      <mesh position={[0, 0, -0.008]} castShadow>
        <boxGeometry args={[0.120, 0.300, 0.016]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Bolts (4 units) */}
      {[[-0.035, 0.08], [0.035, 0.08], [-0.035, -0.08], [0.035, -0.08]].map(([dx, dy], i) => (
        <mesh key={i} position={[dx, dy, 0.008]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.032, 8]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Safety Gear Clamp (Progressive type)
// ─────────────────────────────────────────────────────────────
export function SafetyGear() {
  return (
    <group>
      {/* Housing block */}
      <mesh castShadow>
        <boxGeometry args={[0.180, 0.220, 0.140]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Jaw slot (visual) */}
      <mesh position={[0, 0, 0.060]}>
        <boxGeometry args={[0.080, 0.200, 0.040]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Activation spring rod */}
      <mesh position={[0.100, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.300, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* Top/bottom mounting flanges */}
      <mesh position={[0, 0.120, 0]}>
        <boxGeometry args={[0.220, 0.020, 0.160]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, -0.120, 0]}>
        <boxGeometry args={[0.220, 0.020, 0.160]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Flanged Sheave — proper turned profile via LatheGeometry
// ─────────────────────────────────────────────────────────────
export function ProfessionalSheave({
  diameter, grooves = 6,
}: {
  diameter: number; width?: number; grooves?: number;
}) {
  const R = diameter / 2;
  const R_hub = diameter / 8;
  const hw = (grooves * 0.028 + 0.040) / 2; // half total width
  const grooveSpacing = 0.028;

  const lathePoints = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    // Rotation axis is Y. Profile is in XY plane (X = radius).
    // Hub
    pts.push(new THREE.Vector2(R_hub, -hw - 0.020));
    pts.push(new THREE.Vector2(R_hub, -hw));
    // Web transition to rim
    pts.push(new THREE.Vector2(R - 0.060, -hw));
    pts.push(new THREE.Vector2(R - 0.030, -hw + 0.025));
    // Outer flange (left)
    pts.push(new THREE.Vector2(R, -hw + 0.035));
    // Rope grooves (semicircular profile between flanges)
    for (let i = 0; i < grooves; i++) {
      const center = -hw + 0.035 + grooveSpacing * (i + 0.5);
      pts.push(new THREE.Vector2(R,           center - grooveSpacing * 0.4));
      pts.push(new THREE.Vector2(R - 0.008,   center));
      pts.push(new THREE.Vector2(R,           center + grooveSpacing * 0.4));
    }
    // Outer flange (right)
    pts.push(new THREE.Vector2(R, hw - 0.035));
    pts.push(new THREE.Vector2(R - 0.030, hw - 0.025));
    pts.push(new THREE.Vector2(R - 0.060, hw));
    // Back to hub
    pts.push(new THREE.Vector2(R_hub, hw));
    pts.push(new THREE.Vector2(R_hub, hw + 0.020));
    return pts;
  }, [R, R_hub, hw, grooves, grooveSpacing]);

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Main body via lathe */}
      <mesh castShadow>
        <latheGeometry args={[lathePoints, 48]} />
        <meshStandardMaterial color="#1e293b" metalness={0.92} roughness={0.08} />
      </mesh>
      {/* Hub bore (inner cylinder — dark) */}
      <mesh castShadow>
        <cylinderGeometry args={[R_hub * 0.4, R_hub * 0.4, hw * 2 + 0.05, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} />
      </mesh>
      {/* Spokes — 4 solid plates */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh key={i} rotation={[0, angle, 0]} position={[0, 0, 0]} castShadow>
          <boxGeometry args={[R - R_hub - 0.04, hw * 1.6, 0.018]} />
          <meshStandardMaterial color="#162032" metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Oil Buffer (EN 81-20 §5.8) — solid cylindrical body
// ─────────────────────────────────────────────────────────────
export function OilBuffer({ stroke = 0.42 }: { stroke?: number }) {
  const bodyH   = stroke + 0.15;   // compressed height + extra
  const cylinderR = 0.080;
  const pistonR   = 0.060;
  return (
    <group>
      {/* Base plate */}
      <mesh position={[0, 0.012, 0]} castShadow>
        <boxGeometry args={[0.22, 0.024, 0.22]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Cylinder body */}
      <mesh position={[0, bodyH / 2 + 0.024, 0]} castShadow>
        <cylinderGeometry args={[cylinderR, cylinderR, bodyH, 20]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Piston rod */}
      <mesh position={[0, bodyH + stroke * 0.6 + 0.024, 0]} castShadow>
        <cylinderGeometry args={[pistonR, pistonR, stroke * 0.7, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
      </mesh>
      {/* Cap / bumper head */}
      <mesh position={[0, bodyH + stroke * 0.95 + 0.024, 0]} castShadow>
        <cylinderGeometry args={[pistonR + 0.01, pistonR + 0.01, 0.04, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Toe Guard (Apron) — sits under cab entrance
// ─────────────────────────────────────────────────────────────
export function ToeGuard({ width, height = 0.75 }: { width: number; height?: number }) {
  return (
    <group>
      {/* Main apron plate (bent steel) */}
      <mesh position={[0, -height / 2, 0.002]} castShadow>
        <boxGeometry args={[width, height, 0.002]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} />
      </mesh>
      {/* Bottom return bend */}
      <mesh position={[0, -height, -0.01]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[width, 0.04, 0.002]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Rope Segment (Visual wire rope)
// ─────────────────────────────────────────────────────────────
export function RopeSegment({ length, diameter = 0.010 }: { length: number; diameter?: number }) {
  return (
    <mesh castShadow>
      <cylinderGeometry args={[diameter / 2, diameter / 2, length, 8]} />
      <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.5} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────
// Hydraulic Cylinder (1:2 Roped Hydraulic Support)
// ─────────────────────────────────────────────────────────────
export function HydraulicCylinder({ length }: { length: number }) {
  return (
    <group>
      {/* Outer cylinder casing */}
      <mesh position={[0, length / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, length, 16]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} />
      </mesh>
      {/* Piston rod */}
      <mesh position={[0, length * 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, length * 0.8, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Head pulley mounting */}
      <mesh position={[0, length * 1.3, 0]} castShadow>
        <boxGeometry args={[0.16, 0.12, 0.16]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}
