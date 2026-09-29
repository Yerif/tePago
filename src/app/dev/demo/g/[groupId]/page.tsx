import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { GrassDivider } from "@/components/cozy/GrassDivider";
import { Pill } from "@/components/cozy/Pill";
import { ThemeToggle } from "@/components/cozy/ThemeToggle";
import { XPBar } from "@/components/cozy/XPBar";
import { DebugDatos } from "@/components/dev/DebugDatos";
import { ExpenseCard } from "@/components/features/ExpenseCard";
import { FriendRow } from "@/components/features/FriendRow";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BADGES_DEMO, crearGrupos, YO } from "@/lib/mock/datos";
import { xpAcumuladaParaNivel } from "@/lib/game/levels";
import { balancesNetos } from "@/lib/splits/balances";
import { formatoMXN } from "@/lib/splits/formato";

export const metadata: Metadata = { title: "Home de grupo (demo)" };
export const dynamic = "force-dynamic";

const VARIANT_ESTADO = { clean: "grass", mild: "lemon", rekt: "rose" } as const;

export default async function HomeGrupoDemoPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const ahora = new Date();
  const grupos = crearGrupos(ahora);
  const grupo = grupos.find((g) => g.id === groupId);
  if (!grupo) notFound();

  const yo = grupo.miembros.find((m) => m.id === YO);
  if (!yo) notFound();
  const balances = balancesNetos(grupo.gastos);
  const miBalance = balances[YO] ?? 0;
  const nombreDe = (id: string) => grupo.miembros.find((m) => m.id === id)?.nombre ?? id;

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
            <Link key={g.id} href={`/dev/demo/g/${g.id}`} aria-current={g.id === grupo.id ? "page" : undefined}>
              <Pill variant={g.id === grupo.id ? "grass" : "neutral"}>
                {g.icono} {g.nombre}
              </Pill>
            </Link>
          ))}
        </nav>
        <GrassDivider />
      </header>

      <div className="flex flex-col gap-5 px-6">
        <Pill variant="lemon" className="self-start">
          Datos de ejemplo · sin Supabase
        </Pill>

        <Card className="flex flex-col items-center gap-4 text-center" data-testid="mi-personaje">
          <Avatar emoji={yo.emoji} estado={yo.estado} size="lg" />
          <div>
            <p className="font-display text-2xl font-bold">{yo.nombre}</p>
            <Pill variant={VARIANT_ESTADO[yo.estado]} className="mt-1">
              {ETIQUETA_ESTADO[yo.estado]}
            </Pill>
          </div>
          <XPBar nivel={yo.nivel} xp={yo.xp} xpSiguiente={yo.xpSiguiente} />
          {yo.badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {yo.badges.map((b) => (
                <Pill key={b} variant={BADGES_DEMO[b]?.variant ?? "neutral"}>
                  {BADGES_DEMO[b]?.nombre ?? b}
                </Pill>
              ))}
            </div>
          )}
          <p className="text-muted-foreground" data-testid="mi-balance">
            {miBalance === 0
              ? "¡Todo en orden! 🌻"
              : miBalance > 0
                ? `Te deben ${formatoMXN(miBalance)} en este grupo`
                : `Debes ${formatoMXN(-miBalance)} en este grupo 😬`}
          </p>
        </Card>

        <Button asChild size="lg" data-testid="ir-dividir">
          <Link href={`/dev/demo/dividir?g=${grupo.id}`}>Dividir un gasto ⚡</Link>
        </Button>

        <section>
          <h2 className="font-display text-xl font-bold">La banda</h2>
          <Card size="sm" className="mt-2">
            <ul className="divide-y-2 divide-border">
              {grupo.miembros.map((m) => (
                <FriendRow key={m.id} miembro={m} balanceCentavos={balances[m.id] ?? 0} esYo={m.id === YO} />
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold">Gastos recientes</h2>
          <div className="mt-2 flex flex-col gap-3">
            {[...grupo.gastos]
              .sort((a, b) => b.fecha.localeCompare(a.fecha))
              .map((g) => (
                <ExpenseCard key={g.id} gasto={g} pagador={nombreDe(g.pagadoPor)} ahora={ahora} />
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
