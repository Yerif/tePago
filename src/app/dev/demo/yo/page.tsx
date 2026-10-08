import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { DebugDatos } from "@/components/dev/DebugDatos";
import { PerfilYo } from "@/components/features/PerfilYo";
import { SKIN_SLUGS, SKINS, requisitoSkin } from "@/lib/game/skins";
import { BADGES_DEMO, crearGrupos, YO } from "@/lib/mock/datos";
import type { MiembroDemo } from "@/lib/mock/tipos";
import { Chevron } from "@/components/ui/Chevron";

export const metadata: Metadata = { title: "Yo (demo)" };
export const dynamic = "force-dynamic";

export default async function YoDemoPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams;
  const ahora = new Date();
  const grupos = crearGrupos(ahora);
  const miembros = new Map<string, MiembroDemo>();
  for (const g of grupos) for (const m of g.miembros) miembros.set(m.id, m);
  const yo = miembros.get(u ?? "") ?? (miembros.get(YO) as MiembroDemo);

  return (
    <main data-component="YoDemoPage" className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <DebugDatos usuario={`${yo.nombre} (demo)`} estadoAvatar={yo.estado} />
      <PerfilYo
        key={yo.id}
        id={yo.id}
        grupos={grupos}
        ahoraIso={ahora.toISOString()}
        skins={SKIN_SLUGS.map((slug) => ({ slug, nombre: SKINS[slug].nombre, accesorio: SKINS[slug].accesorio, requisito: requisitoSkin(slug) }))}
        badges={yo.badges.map((b) => ({ slug: b, nombre: BADGES_DEMO[b]?.nombre ?? b, variant: BADGES_DEMO[b]?.variant ?? "neutral" }))}
      />

      <details data-testid="herramientas-demo" className="rounded-3xl border-[2.5px] border-dashed border-border p-4">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">
          🧪 Herramientas de prueba
          <Chevron />
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <Pill variant="lemon" className="self-start">
            Datos de ejemplo · sin Supabase
          </Pill>
      <nav aria-label="Probar como" className="flex flex-wrap gap-2">
            {[...miembros.values()].map((m) => (
              <Link key={m.id} href={`/dev/demo/yo?u=${m.id}`} aria-current={m.id === yo.id ? "page" : undefined} data-testid={`probar-${m.id}`} className="inline-flex min-h-11 items-center">
                <Pill variant={m.id === yo.id ? "grass" : "neutral"}>
                  <Avatar base={m.base} estado={m.estado} size="sm" compacto className="size-8 border-0 bg-transparent" /> {m.nombre}
                </Pill>
              </Link>
            ))}
          </nav>
        </div>
      </details>
    </main>
  );
}
