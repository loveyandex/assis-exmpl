"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, Environment } from '@react-three/drei';
import * as THREE from 'three';

function FloatingCloud({ position, speed = 1 }: { position: [number, number, number], speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed * 0.7) * 0.3;
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * speed * 0.5) * 0.1;
    }
  });

  return (
    <Cloud
      ref={meshRef}
      position={position}
      speed={0.4}
      opacity={0.6}
      color="#ffffff"
      segments={20}
    />
  );
}

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
        <planeGeometry args={[4, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function Scene() {
  const clouds = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2
      ] as [number, number, number],
      speed: Math.random() * 0.5 + 0.3
    }));
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} color="#4f46e5" />
      
      <NemoText />
      
      {clouds.map((cloud, index) => (
        <FloatingCloud
          key={index}
          position={cloud.position}
          speed={cloud.speed}
        />
      ))}
      
      <Environment preset="night" />
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
