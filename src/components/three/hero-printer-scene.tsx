"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import type { Group } from "three";

function PrinterFrame() {
  const postPositions = [
    [-1.8, 0, -1.35],
    [1.8, 0, -1.35],
    [-1.8, 0, 1.35],
    [1.8, 0, 1.35],
  ] as const;

  return (
    <group>
      <mesh position={[0, -1.15, 0]}>
        <boxGeometry args={[4.2, 0.18, 3.2]} />
        <meshStandardMaterial color="#27272a" roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.96, 0]}>
        <boxGeometry args={[3.35, 0.08, 2.35]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.45} metalness={0.15} />
      </mesh>
      {postPositions.map((position) => (
        <mesh key={position.join("-")} position={[position[0], -0.05, position[2]]}>
          <boxGeometry args={[0.12, 2.35, 0.12]} />
          <meshStandardMaterial color="#d4d4d8" roughness={0.38} metalness={0.45} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, -1.35]}>
        <boxGeometry args={[3.75, 0.12, 0.12]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.38} metalness={0.45} />
      </mesh>
      <mesh position={[0, 1.05, 1.35]}>
        <boxGeometry args={[3.75, 0.12, 0.12]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.38} metalness={0.45} />
      </mesh>
      <mesh position={[-1.8, 1.05, 0]}>
        <boxGeometry args={[0.12, 0.12, 2.8]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.38} metalness={0.45} />
      </mesh>
      <mesh position={[1.8, 1.05, 0]}>
        <boxGeometry args={[0.12, 0.12, 2.8]} />
        <meshStandardMaterial color="#d4d4d8" roughness={0.38} metalness={0.45} />
      </mesh>
    </group>
  );
}

function AnimatedPrintHead() {
  const head = useRef<Group>(null);
  const filament = useRef<Group>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const x = Math.sin(time * 1.4) * 0.8;
    const z = Math.cos(time * 0.9) * 0.45;

    if (head.current) {
      head.current.position.x = x;
      head.current.position.z = z;
    }
    if (filament.current) {
      filament.current.rotation.z = time * 0.55;
    }
  });

  return (
    <group>
      <group ref={filament} position={[1.35, 1.45, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.38, 0.08, 16, 64]} />
          <meshStandardMaterial color="#10b981" roughness={0.35} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.18, 32]} />
          <meshStandardMaterial color="#111827" roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[3, 0.1, 0.1]} />
        <meshStandardMaterial color="#a1a1aa" roughness={0.4} metalness={0.35} />
      </mesh>
      <group ref={head} position={[0, 0.5, 0]}>
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[0.74, 0.46, 0.58]} />
          <meshStandardMaterial color="#111827" roughness={0.42} metalness={0.18} />
        </mesh>
        <mesh position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.13, 0.34, 8]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.5} />
        </mesh>
        <mesh position={[0, -0.48, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.44, 12]} />
          <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </group>
  );
}

function PrintedModel() {
  return (
    <group position={[0, -0.78, 0]}>
      {[0, 1, 2, 3, 4, 5].map((layer) => (
        <RoundedBox key={layer} args={[1.15 - layer * 0.08, 0.045, 0.9 - layer * 0.06]} radius={0.03} position={[0, layer * 0.07, 0]}>
          <meshStandardMaterial color={layer % 2 === 0 ? "#34d399" : "#22c55e"} roughness={0.5} />
        </RoundedBox>
      ))}
      <RoundedBox args={[0.48, 0.32, 0.36]} radius={0.04} position={[0, 0.52, 0]}>
        <meshStandardMaterial color="#86efac" roughness={0.45} />
      </RoundedBox>
    </group>
  );
}

export function HeroPrinterScene() {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 sm:h-[470px]">
      <Canvas camera={{ position: [4.6, 2.9, 4.6], fov: 43 }}>
        <color attach="background" args={["#09090b"]} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} />
        <pointLight position={[-3, 2, -2]} color="#34d399" intensity={12} />
        <group rotation={[0, -0.35, 0]}>
          <PrinterFrame />
          <PrintedModel />
          <AnimatedPrintHead />
        </group>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.45} />
      </Canvas>
    </div>
  );
}
