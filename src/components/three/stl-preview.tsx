"use client";

import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Center, OrbitControls } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

function UploadedModel({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url);
  return (
    <Center>
      <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#10b981" roughness={0.45} metalness={0.05} />
      </mesh>
    </Center>
  );
}

function PlaceholderModel() {
  return (
    <group>
      <mesh rotation={[0.5, 0.4, 0]}>
        <icosahedronGeometry args={[1.25, 2]} />
        <meshStandardMaterial color="#10b981" roughness={0.55} />
      </mesh>
      <mesh position={[0, -1.35, 0]}>
        <cylinderGeometry args={[1.2, 1.45, 0.22, 48]} />
        <meshStandardMaterial color="#27272a" roughness={0.6} />
      </mesh>
    </group>
  );
}

export function StlPreview({ file }: { file: File | null }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  return (
    <div className="h-[340px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950">
      <Canvas camera={{ position: [3.2, 2.6, 4], fov: 45 }}>
        <color attach="background" args={["#09090b"]} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 5, 4]} intensity={1.7} />
        <Suspense fallback={<PlaceholderModel />}>
          {url ? <UploadedModel url={url} /> : <PlaceholderModel />}
        </Suspense>
        <OrbitControls makeDefault enableDamping />
      </Canvas>
    </div>
  );
}
