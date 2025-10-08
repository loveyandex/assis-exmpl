import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

// Optional: extend THREE if needed for custom materials
extend({ MeshBasicMaterial: THREE.MeshBasicMaterial });

function LocalCloud({
  position = [0, 0, 0],
  speed = 0.4,
  opacity = 0.6,
  color = '#ffffff',
  segments = 20,
  puffCount = 6
}: {
  position?: [number, number, number];
  speed?: number;
  opacity?: number;
  color?: string;
  segments?: number;
  puffCount?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Build a cluster of overlapping spheres to approximate a fluffy cloud
  const puffGeometries = useMemo(() => {
    const geometries: THREE.SphereGeometry[] = [];
    for (let i = 0; i < puffCount; i++) {
      const radius = 0.6 + Math.random() * 0.6; // varied puff sizes
      geometries.push(new THREE.SphereGeometry(radius, segments, segments));
    }
    return geometries;
  }, [segments, puffCount]);

  const cloudMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 1,
      metalness: 0,
      depthWrite: false
    });
  }, [opacity, color]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.7) * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {puffGeometries.map((geometry, index) => {
        // deterministic pseudo-random offsets for stable layout
        const angle = (index / puffGeometries.length) * Math.PI * 2;
        const radius = 0.6 + (index % 3) * 0.2;
        const offsetX = Math.cos(angle) * radius * 0.8 + (index % 2 === 0 ? 0.2 : -0.1);
        const offsetY = Math.sin(angle) * radius * 0.3 + (index % 2 === 0 ? 0.1 : -0.05);
        const offsetZ = ((index % 5) - 2) * 0.06;
        return (
          <mesh
            key={index}
            geometry={geometry}
            material={cloudMaterial}
            position={[offsetX, offsetY, offsetZ]}
          />
        );
      })}
    </group>
  );
}

export default LocalCloud;
