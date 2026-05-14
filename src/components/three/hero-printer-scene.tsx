"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, RoundedBox } from "@react-three/drei";

function PrintHead() {
  return (
    <group position={[0, 0.25, 0]}>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.1, 0.5, 0.8]} />
        <meshStandardMaterial color="#111827" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <coneGeometry args={[0.16, 0.45, 6]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.25} metalness={0.6} />
      </mesh>
    </group>
  );
}

export function HeroPrinterScene() {
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 sm:h-[470px]">
      <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
        <color attach="background" args={["#09090b"]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.8} />
        <pointLight position={[-4, 3, -2]} color="#34d399" intensity={12} />
        <Float speed={1.3} rotationIntensity={0.35} floatIntensity={0.45}>
          <group>
            <mesh position={[0, -1.1, 0]}>
              <boxGeometry args={[3.8, 0.22, 3.2]} />
              <meshStandardMaterial color="#27272a" roughness={0.6} />
            </mesh>
            <RoundedBox args={[1.5, 1.1, 1.5]} radius={0.08} position={[0, -0.45, 0]}>
              <meshStandardMaterial color="#34d399" roughness={0.42} />
            </RoundedBox>
            <PrintHead />
            <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[1.25, 0.03, 8, 80]} />
              <meshStandardMaterial color="#e4e4e7" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[1.25, 0.03, 8, 80]} />
              <meshStandardMaterial color="#e4e4e7" roughness={0.5} />
            </mesh>
          </group>
        </Float>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.1} />
      </Canvas>
    </div>
  );
}
