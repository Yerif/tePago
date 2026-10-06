import { VisorGlb } from "@/components/personaje/VisorGlb";

export const dynamic = "force-dynamic";

/** Spike PX-17: visor de un .glb exportado (`?url=/modelos/oso.glb`). Solo dev/preview. */
export default async function GlbPage({ searchParams }: { searchParams: Promise<{ url?: string }> }) {
  const { url } = await searchParams;
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-2xl font-bold">Visor .glb</h1>
      {url?.startsWith("/modelos/") ? <VisorGlb url={url} /> : <p>Pasa ?url=/modelos/oso.glb</p>}
    </main>
  );
}
