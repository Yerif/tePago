import { ExportadorGlb } from "@/components/personaje/ExportadorGlb";
import { baseValida } from "@/lib/game/apariencia";

export const dynamic = "force-dynamic";

/** Spike PX-17: exporta el modelo procedural a .glb (solo dev/preview; `/dev/*` da 404 en producción). */
export default async function ExportarPage({ searchParams }: { searchParams: Promise<{ base?: string; estado?: string }> }) {
  const { base, estado } = await searchParams;
  const e = estado === "mild" || estado === "rekt" ? estado : "clean";
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-2xl font-bold">Exportar modelo (.glb)</h1>
      <ExportadorGlb base={baseValida(base)} estado={e} />
    </main>
  );
}
