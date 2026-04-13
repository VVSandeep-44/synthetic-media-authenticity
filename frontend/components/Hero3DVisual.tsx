'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1.5, 64, 64]}>
      <MeshDistortMaterial
        color="#22d5f2"
        attach="material"
        distort={0.4}
        speed={1.5}
        roughness={0.2}
        metalness={0.8}
        wireframe={true}
        emissive="#061426"
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
}

function InnerCore() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * -0.1;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * -0.5;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]}>
      <meshStandardMaterial
        color="#5effeb"
        transparent
        opacity={0.8}
        roughness={0.1}
        metalness={1}
      />
    </Sphere>
  );
}

export default function Hero3DVisual() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[2, 5, 2]} intensity={1} color="#5effeb" />
        <pointLight position={[-2, -2, 2]} intensity={2} color="#22d5f2" />
        
        <AnimatedSphere />
        <InnerCore />
        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
