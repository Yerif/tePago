"use client";

import { useEffect, useState } from "react";
import { Avatar, ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { XPBar } from "@/components/cozy/XPBar";
import { SkinSelector, type SkinOpcion } from "@/components/features/SkinSelector";
import { usePerfilesDemo } from "@/components/features/usePerfilesDemo";
import { usePersonajeVivo } from "@/components/features/usePersonajeVivo";
import { Personaje } from "@/components/personaje/Personaje";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apariencia, BASE_SLUGS, BASES, type BaseSlug } from "@/lib/game/apariencia";
import { BADGE_SLUGS, BADGES } from "@/lib/game/badges";
import { proximaMetaDeSkin } from "@/lib/game/metas";
import { validarNombre } from "@/lib/game/perfil";
import { badgesValidos, estaDesbloqueada, SKIN_SLUGS, SKINS, type SkinSlug } from "@/lib/game/skins";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { resumenPorPersona } from "@/lib/splits/resumen";
import { cn } from "@/lib/utils";

export interface PerfilYoProps {
  id: string;
  grupos: GrupoDemo[];
  ahoraIso: string;
  /** Todas las skins (metadatos): si están desbloqueadas se calcula aquí con el nivel y los badges vivos. */
  skins: Omit<SkinOpcion, "desbloqueada">[];
  badges: { slug: string; nombre: string; variant: "lemon" | "mint" | "rose" | "grass" | "lavender" | "neutral" }[];
}

const SEGUNDOS_DE_PRUEBA = 3;
const VARIANTE = { clean: "grass", mild: "lemon", rekt: "rose" } as const;
const skinSlug = (slug: string): SkinSlug => SKIN_SLUGS.find((s) => s === slug) ?? "clasico";

/**
 * La pestaña Yo, en el orden de lo que importa (PX-05): tu personaje (héroe 3D) con nombre, nivel, XP y la próxima meta →
 * elegir personaje → skins (las bloqueadas se pueden probar 3 s) → nombre → cómo te ve tu banda. Cambiar de personaje no
 * pierde nivel, XP, badges ni skins (CLAUDE.md §7, "Perfil editable").
 */
export function PerfilYo({ id, grupos, ahoraIso, skins: skinsBase, badges }: PerfilYoProps) {
  const { cambiar } = usePerfilesDemo();
  const { yo, estadoYo: estado, progreso, xpTotal, vista, ahora } = usePersonajeVivo(grupos, id, ahoraIso);
  const nombreActual = yo?.nombre ?? "";
  const baseActual = (yo?.base ?? "persona-sol") as BaseSlug;
  const nivel = progreso.nivel;
  const badgesGanados = badgesValidos(badges.map((b) => b.slug));
  const skins: SkinOpcion[] = skinsBase.map((s) => ({ ...s, desbloqueada: estaDesbloqueada(s.slug as SkinSlug, { nivel, badges: badgesGanados }) }));

  const [skinActiva, setSkinActiva] = useState<string>(yo?.skinActivo ?? "clasico");
  const [probando, setProbando] = useState<string | null>(null);
  const [texto, setTexto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [salto, setSalto] = useState(0);

  // La prueba de una skin bloqueada es solo vista previa y se apaga sola a los 3 s.
  useEffect(() => {
    if (!probando) return;
    const t = setTimeout(() => setProbando(null), SEGUNDOS_DE_PRUEBA * 1000);
    return () => clearTimeout(t);
  }, [probando]);

  const skinMostrada = skinSlug(probando ?? skinActiva);
  const meta = proximaMetaDeSkin(xpTotal);
  const debesAhora = resumenPorPersona(vista, id, ahora).debes.length;

  function guardarNombre(e: React.FormEvent) {
    e.preventDefault();
    const r = validarNombre(texto ?? nombreActual);
    if (!r.ok) {
      setGuardado(null);
      return setError(r.error);
    }
    setError(null);
    cambiar(id, { nombre: r.nombre });
    setTexto(null);
    setGuardado(`¡Listo! Ahora te ven como «${r.nombre}» 🌻`);
  }

  function elegirBase(b: BaseSlug) {
    cambiar(id, { base: b });
    setSalto((n) => n + 1); // el héroe brinca: ves el cambio en el mismo lugar
    setGuardado(`¡Listo! Ahora eres ${BASES[b].nombre} ${BASES[b].emoji}`);
    setError(null);
  }

  return (
    <div data-component="PerfilYo" className="flex flex-col gap-5">
      <section aria-label="Tu personaje" className="flex flex-col items-center gap-2 text-center" data-testid="perfil-heroe">
        <Personaje className="h-48 w-48" apariencia={apariencia({ base: baseActual, estado, skin: skinMostrada, nivel })} estado={estado} celebrar={salto} />
        <h2 data-testid="perfil-nombre-actual" className="max-w-full truncate font-display text-2xl font-bold">
          {nombreActual}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Pill variant={VARIANTE[estado]}>{ETIQUETA_ESTADO[estado]}</Pill>
          <Pill variant="neutral" data-testid="skin-activa">
            {SKINS[skinMostrada].nombre}
            {probando ? " · vista previa" : ""}
          </Pill>
        </div>
        <XPBar className="max-w-xs" nivel={nivel} xp={progreso.xpEnNivel} xpSiguiente={progreso.xpSiguiente} />
        {meta ? (
          <p data-testid="perfil-meta" className="text-sm text-muted-foreground">
            Próxima meta: {meta.accesorio} {meta.nombre} (nivel {meta.nivelObjetivo}) · faltan {meta.xpFaltante} XP
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">¡Ya ganaste todas las skins de nivel! 👑</p>
        )}
      </section>

      <Card className="flex flex-col gap-2" data-testid="tu-camino">
        <h2 className="font-display text-xl font-bold">Tu camino</h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li data-testid="camino-nivel">
            ⚡ Nivel {nivel + 1}: faltan <strong>{progreso.xpSiguiente - progreso.xpEnNivel} XP</strong>
          </li>
          {meta && (
            <li data-testid="camino-skin">
              {meta.accesorio} {meta.nombre} (nivel {meta.nivelObjetivo}): faltan <strong>{meta.xpFaltante} XP</strong>
            </li>
          )}
          <li data-testid="camino-semana">
            🧹 Semana limpia (+25 XP): {debesAhora === 0 ? "¡vas bien, sin deudas!" : `salda tus ${debesAhora === 1 ? "1 deuda" : `${debesAhora} deudas`} y la semana cuenta`}
          </li>
        </ul>
        <h3 className="mt-2 font-semibold text-muted-foreground">Badges: cómo se ganan</h3>
        <ul className="flex flex-col gap-1 text-sm">
          {BADGE_SLUGS.map((slug) => {
            const ganado = badges.some((b) => b.slug === slug);
            return (
              <li key={slug} data-testid={`camino-badge-${slug}`} className="flex items-start gap-2">
                <span aria-hidden>{ganado ? "✅" : "▫️"}</span>
                <span>
                  <span className="font-semibold">{BADGES[slug].nombre}</span> · {BADGES[slug].descripcion}
                  {slug === "fantasma" ? " · se esfuma al pagar" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Tu personaje</h2>
        <p className="text-sm text-muted-foreground">No pierdes nivel, badges ni skins al cambiar.</p>
        <ul className="grid grid-cols-3 gap-2">
          {BASE_SLUGS.map((b) => (
            <li key={b}>
              <button
                type="button"
                aria-pressed={b === baseActual}
                data-testid={`perfil-base-${b}`}
                onClick={() => elegirBase(b)}
                className={cn(
                  "flex min-h-11 w-full flex-col items-center gap-1 rounded-2xl border-2 p-2 text-sm font-semibold",
                  b === baseActual ? "border-grass bg-grass-soft text-grass-text" : "border-border bg-card text-muted-foreground",
                )}
              >
                <Avatar base={b} estado="clean" neutro compacto size="md" />
                {BASES[b].nombre}
              </button>
            </li>
          ))}
        </ul>
        {guardado && (
          <Pill variant="grass" className="self-start" role="status" data-testid="perfil-guardado">
            {guardado}
          </Pill>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">Skins</h2>
        <SkinSelector skins={skins} activa={skinActiva} probando={probando} onElegir={setSkinActiva} onProbar={setProbando} />
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-display text-xl font-bold">Mi nombre</h2>
        <form onSubmit={guardarNombre} className="flex flex-col gap-2" noValidate>
          <label htmlFor="perfil-nombre" className="text-sm text-muted-foreground">
            Tu nombre
          </label>
          <div className="flex gap-2">
            <input
              id="perfil-nombre"
              data-testid="perfil-nombre"
              autoComplete="nickname"
              maxLength={40}
              value={texto ?? nombreActual}
              onChange={(e) => setTexto(e.target.value)}
              aria-invalid={error !== null}
              className="min-h-11 min-w-0 flex-1 rounded-2xl border-[2.5px] border-border bg-background px-4"
            />
            <Button type="submit" size="md" data-testid="perfil-guardar">
              Guardar
            </Button>
          </div>
          {error && (
            <p role="alert" data-testid="perfil-error" className="text-rose-text">
              {error}
            </p>
          )}
        </form>
      </Card>

      <Card className="flex flex-col gap-3" data-testid="perfil-banda">
        <h2 className="font-display text-xl font-bold">Así te ve tu banda</h2>
        <div className="flex items-center gap-3">
          <Avatar base={baseActual} estado={estado} accesorio={SKINS[skinSlug(skinActiva)].accesorio} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{nombreActual}</p>
            <p className="text-sm text-muted-foreground">Nivel {nivel}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" data-testid="mis-badges">
          {badges.length === 0 ? <span className="text-muted-foreground">Aún sin badges 🌱</span> : null}
          {badges.map((b) => (
            <Pill key={b.slug} variant={b.variant}>
              {b.nombre}
            </Pill>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Tu banda ve tu personaje, tu nivel, tus badges y tu saldo del grupo. Nada más.</p>
      </Card>
    </div>
  );
}
