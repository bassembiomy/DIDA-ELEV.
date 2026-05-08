// src/components/CSharpViewport.tsx
import { useMemo } from 'react';
import * as THREE from 'three';
import type { AssemblyGeometry, MeshData } from '../utils/engineBridge';

function CSharpMesh({ data }: { data: MeshData }) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    
    // Set vertices
    const vertices = new Float32Array(data.vertices);
    geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // Set indices if available
    if (data.indices && data.indices.length > 0) {
      geo.setIndex(data.indices);
    }
    
    // Compute normals if not provided
    if (data.normals && data.normals.length > 0) {
        geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(data.normals), 3));
    } else {
        geo.computeVertexNormals();
    }
    
    return geo;
  }, [data]);

  let color = '#94a3b8';
  let metalness = 0.5;
  let roughness = 0.5;

  switch (data.material) {
    case 'concrete': color = '#9ca3af'; metalness = 0.1; roughness = 0.8; break;
    case 'iron': color = '#1e293b'; metalness = 0.9; roughness = 0.4; break;
    case 'steel': color = '#64748b'; metalness = 0.8; roughness = 0.3; break;
    case 'stainless_steel': color = '#cbd5e1'; metalness = 0.9; roughness = 0.1; break;
    case 'copper': color = '#b45309'; metalness = 0.9; roughness = 0.2; break;
    case 'plastic': color = '#111827'; metalness = 0.2; roughness = 0.6; break;
  }

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
    </mesh>
  );
}

export function CSharpViewport({ geometry }: { geometry: AssemblyGeometry | null }) {
  if (!geometry) return null;

  return (
    <group>
      {geometry.meshes.map((mesh, i) => (
        <CSharpMesh key={`${mesh.name}-${i}`} data={mesh} />
      ))}
    </group>
  );
}
