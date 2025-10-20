import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Custom cloud material similar to drei's approach
class CloudMaterial extends THREE.MeshLambertMaterial {
  constructor() {
    super();
    this.onBeforeCompile = (shader) => {
      shader.vertexShader = `
        attribute float cloudOpacity;
        varying float vOpacity;
        ${shader.vertexShader}
      `.replace('#include <fog_vertex>', `
        #include <fog_vertex>
        vOpacity = cloudOpacity;
      `);
      
      shader.fragmentShader = `
        varying float vOpacity;
        ${shader.fragmentShader}
      `.replace('#include <output_fragment>', `
        #include <output_fragment>
        gl_FragColor = vec4(outgoingLight, diffuseColor.a * vOpacity);
      `);
    };
  }
}

extend({ CloudMaterial });

function LocalCloud({
  position = [0, 0, 0],
  speed = 0.4,
  opacity = 0.6,
  color = '#ffffff',
  segments = 20,
  volume = 6,
  growth = 4,
  bounds = [5, 1, 1]
}: {
  position?: [number, number, number];
  speed?: number;
  opacity?: number;
  color?: string;
  segments?: number;
  volume?: number;
  growth?: number;
  bounds?: [number, number, number];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cloudTexture = useTexture('/assets/cloud.png');
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  
  // Create cloud instances similar to drei's approach
  const cloudInstances = useMemo(() => {
    const instances = [];
    for (let i = 0; i < segments; i++) {
      const random = () => {
        const x = Math.sin(i * 1000) * 10000;
        return x - Math.floor(x);
      };
      
      instances.push({
        position: new THREE.Vector3(
          (random() * 2 - 1) * bounds[0],
          (random() * 2 - 1) * bounds[1], 
          (random() * 2 - 1) * bounds[2]
        ),
        rotation: i * (Math.PI / segments),
        rotationFactor: Math.max(0.2, 0.5 * random()) * speed,
        density: Math.max(0.5, random()),
        volume: volume * (0.5 + random() * 0.5),
        growth: growth * (0.5 + random() * 0.5),
        opacity: opacity * (0.7 + random() * 0.3),
        matrix: new THREE.Matrix4()
      });
    }
    return instances;
  }, [segments, bounds, speed, volume, growth, opacity]);

  const cloudMaterial = useMemo(() => {
    const material = new CloudMaterial();
    material.map = cloudTexture;
    material.transparent = true;
    material.depthWrite = false;
    material.color = new THREE.Color(color);
    return material;
  }, [cloudTexture, color]);

  useFrame((state) => {
    if (!instancedMeshRef.current) return;
    
    const time = state.clock.elapsedTime;
    const cameraPosition = state.camera.position;
    
    // Update each cloud instance
    cloudInstances.forEach((cloud, index) => {
      // Calculate position with movement
      const worldPosition = new THREE.Vector3(
        position[0] + cloud.position.x + Math.sin(time * speed) * 0.8,
        position[1] + cloud.position.y + Math.sin(time * speed * 0.5) * 0.4,
        position[2] + cloud.position.z + Math.cos(time * speed * 0.7) * 0.2
      );
      
      // Calculate rotation
      const rotation = cloud.rotation + time * cloud.rotationFactor;
      const quaternion = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 0, 1), 
        rotation
      );
      
      // Calculate scale with breathing effect
      const scale = cloud.volume + (1 + Math.sin(time * cloud.density * speed)) / 2 * cloud.growth;
      const scaleVector = new THREE.Vector3(scale, scale, scale);
      
      // Compose matrix
      cloud.matrix.compose(worldPosition, quaternion, scaleVector);
      
      // Set instance matrix
      instancedMeshRef.current!.setMatrixAt(index, cloud.matrix);
    });
    
    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, cloudMaterial, segments]}
        matrixAutoUpdate={false}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>
    </group>
  );
}

export default LocalCloud;
