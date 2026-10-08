"use client";

import Link from "next/link";
import { Pill } from "@/components/cozy/Pill";
import { ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { XPBar } from "@/components/cozy/XPBar";
import { ExpenseCard } from "@/components/features/ExpenseCard";
import { FriendRow } from "@/components/features/FriendRow";
import { usePersonajeVivo } from "@/components/features/usePersonajeVivo";
import { Personaje } from "@/components/personaje/Personaje";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apariencia } from "@/lib/game/apariencia";
import { BADGES_DEMO } from "@/lib/mock/datos";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { balancesNetos } from "@/lib/splits/balances";
import { formatoMXN } from "@/lib/splits/formato";

const VARIANT_ESTADO = { clean: "grass", mild: "lemon", rekt: "rose" } as const;

export interface HomeGrupoVivoProps {
  grupos: GrupoDemo[];
  grupoId: string;
  yo: string;
  ahoraIso: string;
}

/**
 * Cuerpo del Home del grupo: tu personaje, el grupo y los gastos, con los mismos datos vivos que el resto de la app
 * (nombre y personaje elegidos, estado, nivel y XP según los pagos confirmados).
 */
export function HomeGrupoVivo({ grupos: gruposBase, grupoId, yo, ahoraIso }: HomeGrupoVivoProps) {
  const { grupos, vista, ahora, estadoDe, estadoYo, progreso, yo: yoMiembro } = usePersonajeVivo(gruposBase, yo, ahoraIso);
  const grupo = grupos.find((g) => g.id === grupoId);
  const grupoVista = vista.find((g) => g.id === grupoId);
  if (!grupo || !grupoVista || !yoMiembro) return null;

  const balances = balancesNetos(grupoVista.gastos);
  const miBalance = balances[yo] ?? 0;
  const nombreDe = (id: string) => grupo.miembros.find((m) => m.id === id)?.nombre ?? id;

  return (
    <div data-component="HomeGrupoVivo" className="flex flex-col gap-5 px-6">
      <Pill variant="lemon" className="self-start">
        Datos de ejemplo · sin Supabase
      </Pill>

      <Card className="flex flex-col items-center gap-4 text-center" data-testid="mi-personaje">
        <Personaje apariencia={apariencia({ base: yoMiembro.base, estado: estadoYo, skin: yoMiembro.skinActivo, nivel: progreso.nivel })} estado={estadoYo} />
        <div>
          <p className="font-display text-2xl font-bold">{yoMiembro.nombre}</p>
          <Pill variant={VARIANT_ESTADO[estadoYo]} className="mt-1" data-testid="mi-estado">
            {ETIQUETA_ESTADO[estadoYo]}
          </Pill>
        </div>
        <XPBar nivel={progreso.nivel} xp={progreso.xpEnNivel} xpSiguiente={progreso.xpSiguiente} />
        {yoMiembro.badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {yoMiembro.badges.map((b) => (
              <Pill key={b} variant={BADGES_DEMO[b]?.variant ?? "neutral"}>
                {BADGES_DEMO[b]?.nombre ?? b}
              </Pill>
            ))}
          </div>
        )}
        <p className="text-muted-foreground" data-testid="mi-balance">
          {miBalance === 0 ? "¡Todo en orden! 🌻" : miBalance > 0 ? `Te deben ${formatoMXN(miBalance)} en este grupo` : `Debes ${formatoMXN(-miBalance)} en este grupo 😬`}
        </p>
      </Card>

      <Link href={`/dev/demo/dividir?g=${grupo.id}&u=${yo}`} data-testid="ir-dividir" className={buttonVariants({ size: "lg" })}>
        Dividir un gasto ⚡
      </Link>

      <section>
        <h2 className="font-display text-xl font-bold">El grupo</h2>
        <Card size="sm" className="mt-2">
          <ul className="divide-y-2 divide-border">
            {grupo.miembros.map((m) => (
              <FriendRow key={m.id} miembro={{ ...m, estado: estadoDe(m.id) }} balanceCentavos={balances[m.id] ?? 0} esYo={m.id === yo} />
            ))}
          </ul>
        </Card>
      </section>

      <Link href={`/dev/demo/g/${grupo.id}/detalle?u=${yo}`} data-testid="ver-detalle" className="inline-flex min-h-11 items-center justify-center font-semibold underline">
        Ver quién le debe a quién →
      </Link>

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
  );
}
