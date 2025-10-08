import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Optional: extend THREE if needed for custom materials
extend({ MeshBasicMaterial: THREE.MeshBasicMaterial });

function LocalCloud({
  position = [0, 0, 0],
  speed = 0.4,
  opacity = 0.6,
  color = '#ffffff',
  segments = 20
}: {
  position?: [number, number, number];
  speed?: number;
  opacity?: number;
  color?: string;
  segments?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture('/assets/cloud.png');

  const cloudGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1, segments, segments);
    return geometry;
  }, [segments]);

  const cloudMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity,
      color
    });
  }, [texture, opacity, color]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.7) * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={cloudGeometry} material={cloudMaterial} />
    </group>
  );
}

export default LocalCloud;
