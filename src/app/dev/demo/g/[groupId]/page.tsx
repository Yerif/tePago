import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GrassDivider } from "@/components/cozy/GrassDivider";
import { Pill } from "@/components/cozy/Pill";
import { ThemeToggle } from "@/components/cozy/ThemeToggle";
import { DebugDatos } from "@/components/dev/DebugDatos";
import { HomeGrupoVivo } from "@/components/features/HomeGrupoVivo";
import { crearGrupos, YO } from "@/lib/mock/datos";
import { xpAcumuladaParaNivel } from "@/lib/game/levels";

export const metadata: Metadata = { title: "Home de grupo (demo)" };
export const dynamic = "force-dynamic";

export default async function HomeGrupoDemoPage({ params, searchParams }: { params: Promise<{ groupId: string }>; searchParams: Promise<{ u?: string }> }) {
  const [{ groupId }, { u }] = await Promise.all([params, searchParams]);
  const ahora = new Date();
  const grupos = crearGrupos(ahora);
  const grupo = grupos.find((g) => g.id === groupId);
  if (!grupo) notFound();

  const yo = grupo.miembros.find((m) => m.id === u) ?? grupo.miembros.find((m) => m.id === YO);
  if (!yo) notFound();

  return (
    <main data-component="HomeGrupoDemoPage" className="mx-auto flex max-w-md flex-col gap-5 pb-10">
      <DebugDatos
        usuario={`${yo.nombre} (demo)`}
        grupo={grupo.nombre}
        estadoAvatar={yo.estado}
        xp={{ total: xpAcumuladaParaNivel(yo.nivel) + yo.xp, nivel: yo.nivel }}
        ia={{
          prompt: "B1@v1 (ejemplo)",
          latenciaMs: 812,
          respuesta: '{"descripcion":"Tacos","total":"850","pagado_por":"m2"}',
          ts: ahora.toISOString(),
        }}
      />
      <header className="overflow-hidden bg-water-soft">
        <div className="flex items-start justify-between px-6 pt-5">
          <div>
            <p className="text-sm text-muted-foreground">
              <span className="dark:hidden">☁️ ☁️</span>
              <span className="hidden dark:inline">🌙 ✨ ⭐</span>
            </p>
            <h1 className="font-display text-3xl font-bold" data-testid="grupo-nombre">
              {grupo.icono} {grupo.nombre}
            </h1>
          </div>
          <ThemeToggle />
        </div>
        <nav aria-label="Grupos" className="flex flex-wrap gap-2 px-6 pt-3 pb-4">
          {grupos.map((g) => (
            <Link key={g.id} href={`/dev/demo/g/${g.id}?u=${yo.id}`} aria-current={g.id === grupo.id ? "page" : undefined} className="inline-flex min-h-11 items-center">
              <Pill variant={g.id === grupo.id ? "grass" : "neutral"}>
                {g.icono} {g.nombre}
              </Pill>
            </Link>
          ))}
        </nav>
        <GrassDivider />
      </header>

      <HomeGrupoVivo grupos={grupos} grupoId={grupo.id} yo={yo.id} ahoraIso={ahora.toISOString()} />
    </main>
  );
}
