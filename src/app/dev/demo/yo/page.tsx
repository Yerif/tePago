import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/cozy/Pill";
import { XPBar } from "@/components/cozy/XPBar";
import { DebugDatos } from "@/components/dev/DebugDatos";
import { SkinSelector } from "@/components/features/SkinSelector";
import { Card } from "@/components/ui/Card";
import { SKIN_SLUGS, SKINS, badgesValidos, estaDesbloqueada, requisitoSkin } from "@/lib/game/skins";
import { BADGES_DEMO, crearGrupos, YO } from "@/lib/mock/datos";
import type { MiembroDemo } from "@/lib/mock/tipos";

export const metadata: Metadata = { title: "Yo (demo)" };
export const dynamic = "force-dynamic";

export default async function YoDemoPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams;
  const miembros = new Map<string, MiembroDemo>();
  for (const g of crearGrupos(new Date())) for (const m of g.miembros) miembros.set(m.id, m);
  const yo = miembros.get(u ?? "") ?? (miembros.get(YO) as MiembroDemo);
  const progreso = { nivel: yo.nivel, badges: badgesValidos(yo.badges) };

  return (
    <main data-component="YoDemoPage" className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <DebugDatos usuario={`${yo.nombre} (demo)`} estadoAvatar={yo.estado} />
      <Link href="/dev/demo" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline">
        ← Demo
      </Link>
      <h1 className="font-display text-3xl font-bold">Yo 🌻</h1>
      <Pill variant="lemon" className="self-start">
        Datos de ejemplo · sin Supabase
      </Pill>

      <nav aria-label="Probar como" className="flex flex-wrap gap-2">
        {[...miembros.values()].map((m) => (
          <Link key={m.id} href={`/dev/demo/yo?u=${m.id}`} aria-current={m.id === yo.id ? "page" : undefined} data-testid={`probar-${m.id}`} className="inline-flex min-h-11 items-center">
            <Pill variant={m.id === yo.id ? "grass" : "neutral"}>
              {m.emoji} {m.nombre}
            </Pill>
          </Link>
        ))}
      </nav>

      <Card className="flex flex-col gap-4">
        <XPBar nivel={yo.nivel} xp={yo.xp} xpSiguiente={yo.xpSiguiente} />
        <div className="flex flex-wrap gap-2" data-testid="mis-badges">
          {yo.badges.length === 0 ? <span className="text-muted-foreground">Aún sin badges 🌱</span> : null}
          {yo.badges.map((b) => (
            <Pill key={b} variant={BADGES_DEMO[b]?.variant ?? "neutral"}>
              {BADGES_DEMO[b]?.nombre ?? b}
            </Pill>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-xl font-bold">Skins</h2>
        <SkinSelector
          key={yo.id}
          base={yo.base}
          nivel={yo.nivel}
          estado={yo.estado}
          activaInicial={yo.skinActivo}
          skins={SKIN_SLUGS.map((slug) => ({
            slug,
            nombre: SKINS[slug].nombre,
            accesorio: SKINS[slug].accesorio,
            desbloqueada: estaDesbloqueada(slug, progreso),
            requisito: requisitoSkin(slug),
          }))}
        />
      </Card>
    </main>
  );
}
