"use client";
import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Icosahedron, Float } from '@react-three/drei';
import * as THREE from 'three';

function IcosahedronMesh({ scrollY }: { scrollY: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    meshRef.current.rotation.y += delta * 0.15;
    meshRef.current.rotation.x += delta * 0.08;

    const targetRotationX = mouseRef.current.y * 0.3;
    const targetRotationY = mouseRef.current.x * 0.3;
    meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.05;
    meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.05;

    const scrollFactor = Math.min(scrollY / viewport.height, 1);
    meshRef.current.position.y = -scrollFactor * 0.5;
    meshRef.current.rotation.z = scrollFactor * 0.5;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <Icosahedron ref={meshRef} args={[1.5, 1]}>
        <meshBasicMaterial
          color="#D4A24C"
          wireframe
          transparent
          opacity={0.6}
        />
      </Icosahedron>
    </Float>
  );
}

function Scene({ scrollY }: { scrollY: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <IcosahedronMesh scrollY={scrollY} />
    </>
  );
}

interface Props {
  scrollY: number;
}

export default function HeroElement3D({ scrollY }: Props) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
