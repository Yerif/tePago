"use client";

import { Canvas, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function Modelo({ url, alCargar }: { url: string; alCargar: () => void }) {
  const gltf = useLoader(GLTFLoader, url);
  useEffect(() => alCargar(), [gltf, alCargar]);
  return <primitive object={gltf.scene} />;
}

/** SPIKE (PX-17, solo dev/preview): carga un .glb exportado y lo dibuja con las mismas luces y cámara que el personaje. */
export function VisorGlb({ url }: { url: string }) {
  const [t0] = useState(() => performance.now());
  const [ms, setMs] = useState<number | null>(null);
  return (
    <section className="flex flex-col gap-2" data-component="VisorGlb">
      <div className="size-64 rounded-3xl border-[2.5px] border-border">
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 34 }} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}>
          <ambientLight intensity={1.05} />
          <hemisphereLight args={["#ffffff", "#8C93AE", 0.7]} />
          <directionalLight position={[3, 5, 4]} intensity={1.6} />
          <Suspense fallback={null}>
            <Modelo url={url} alCargar={() => setMs(Math.round(performance.now() - t0))} />
          </Suspense>
        </Canvas>
      </div>
      <p data-testid="glb-carga" className="text-sm text-muted-foreground">
        {ms === null ? "Cargando…" : `Cargado y dibujado en ${ms} ms`}
      </p>
    </section>
  );
}
