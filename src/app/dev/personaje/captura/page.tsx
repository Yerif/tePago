import type { Metadata } from "next";
import { CapturaPersonaje } from "@/components/personaje/CapturaPersonaje";
import { ESTADOS_MINIATURA } from "@/lib/game/apariencia";

export const metadata: Metadata = { title: "Captura del personaje (dev)" };
export const dynamic = "force-dynamic";

export default async function CapturaPage({ searchParams }: { searchParams: Promise<{ base?: string; estado?: string }> }) {
  const { base, estado } = await searchParams;
  const e = ESTADOS_MINIATURA.find((x) => x === estado) ?? "clean";
  return (
    <main data-component="CapturaPage" className="p-0">
      <CapturaPersonaje base={base ?? ""} estado={e} />
    </main>
  );
}
