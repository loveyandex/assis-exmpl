"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import LocalCloud from './local-cloud';


function NemoText() {
  const textRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (textRef.current) {
      textRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group ref={textRef}>
      <mesh position={[0, 0, 0]}>
        {/* <planeGeometry args={[5, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} /> */}
      </mesh>
    </group>
  );
}

function Scene() {
  const clouds = useMemo(() => {
    // Create multiple layers of clouds with different sizes and speeds
    const cloudLayers = [
      // Background clouds (slower, larger, more transparent)
      ...Array.from({ length: 3 }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 6,
          -2 + Math.random() * 1
        ] as [number, number, number],
        speed: Math.random() * 0.2 + 0.1,
        opacity: 0.3,
        segments: 15,
        volume: 8,
        growth: 6,
        bounds: [6, 3, 2] as [number, number, number]
      })),
      // Mid-ground clouds (medium speed, medium size)
      ...Array.from({ length: 4 }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 5,
          -1 + Math.random() * 1
        ] as [number, number, number],
        speed: Math.random() * 0.4 + 0.2,
        opacity: 0.5,
        segments: 20,
        volume: 6,
        growth: 4,
        bounds: [5, 2, 1.5] as [number, number, number]
      })),
      // Foreground clouds (faster, smaller, more opaque)
      ...Array.from({ length: 3 }, (_, i) => ({
        position: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 4,
          Math.random() * 1
        ] as [number, number, number],
        speed: Math.random() * 0.6 + 0.4,
        opacity: 0.7,
        segments: 25,
        volume: 4,
        growth: 3,
        bounds: [4, 1.5, 1] as [number, number, number]
      }))
    ];
    return cloudLayers;
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />

      <NemoText />

      {clouds.map((cloud, index) => (
        <LocalCloud
          key={index}
          position={cloud.position}
          speed={cloud.speed}
          opacity={cloud.opacity}
          segments={cloud.segments}
          volume={cloud.volume}
          growth={cloud.growth}
          bounds={cloud.bounds}
        />
      ))}

      {/* Removed Environment to avoid remote HDRI; use simple lights instead */}
    </>
  );
}

export default function NemoCloudAnimation() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        style={{ background: 'transparent' }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}