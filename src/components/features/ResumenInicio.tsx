"use client";

import { useEffect, useRef, useState } from "react";
import { BandejaPagos } from "@/components/features/BandejaPagos";
import { FilaCuenta } from "@/components/features/FilaCuenta";
import { Bienvenida } from "@/components/features/Bienvenida";
import { HeroPersonaje } from "@/components/features/HeroPersonaje";
import { HojaPago } from "@/components/features/HojaPago";
import { RevelacionPersonaje } from "@/components/features/RevelacionPersonaje";
import { ToastPago } from "@/components/features/ToastPago";
import { useBienvenidaDemo } from "@/components/features/useBienvenidaDemo";
import { usePagarPersona } from "@/components/features/usePagarPersona";
import { usePersonajeVivo } from "@/components/features/usePersonajeVivo";
import { useHidratado, useVistoDemo } from "@/components/features/useVistoDemo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apariencia } from "@/lib/game/apariencia";
import { caminoDeEstado, textoDelCamino } from "@/lib/game/camino";
import { xpAcumuladaParaNivel } from "@/lib/game/levels";
import { fraseDelPersonaje } from "@/lib/game/microcopy";
import { revelacion, sinDuplicarXp, type Revelacion } from "@/lib/game/revelacion";
import { SKIN_SLUGS, SKINS, type SkinSlug } from "@/lib/game/skins";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { avisosParaPagador } from "@/lib/splits/confirmacion";
import { formatoMXN } from "@/lib/splits/formato";
import { reservaDeCuenta, resumenPorPersona } from "@/lib/splits/resumen";
import { tiempoDesdeHoras } from "@/lib/tiempo";
import { cn } from "@/lib/utils";

export interface ResumenInicioProps {
  grupos: GrupoDemo[];
  /** Quién está mirando. */
  yo: string;
  /** Instante de la página (ISO): la antigüedad de las deudas se mide contra él. */
  ahoraIso: string;
  /** `?bienvenida=1`: muestra "Conoce a tu personaje" aunque ya se haya visto (herramientas de prueba y UAT). */
  forzarBienvenida?: boolean;
}

const FILAS_VISIBLES = 4;
const skinDe = (slug: string | undefined): SkinSlug => SKIN_SLUGS.find((s) => s === slug) ?? "clasico";

/**
 * Primera pantalla: "¿qué hago con mi dinero?". Cuánto debes, lo que tienes que resolver con pagos (siempre arriba), una
 * fila por persona a la que le debes y, plegado, lo que te deben. Pagar es una hoja de 2 toques con "Deshacer".
 */
export function ResumenInicio({ grupos: gruposBase, yo, ahoraIso, forzarBienvenida = false }: ResumenInicioProps) {
  const { grupos, vista, ahora, estadoYo, estadoDe, miembro, yo: yoMiembro, xpTotal, progreso } = usePersonajeVivo(gruposBase, yo, ahoraIso);
  const nombres = Object.fromEntries(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m.nombre])));
  const { registros, toast, error, reaccion, pagar, deshacer, cancelarA, cerrarToast } = usePagarPersona(grupos, yo, nombres);
  const [hoja, setHoja] = useState<string | null>(null);
  const [verTodas, setVerTodas] = useState(false);

  const resumen = resumenPorPersona(vista, yo, ahora);

  // "Si pagas a X pasas a Y": las personas con un pago ya en camino se dan por pagadas.
  const enCamino = resumen.debes.filter((c) => reservaDeCuenta(c, registros, yo).disponibleCentavos < c.centavos).map((c) => c.personaId);
  const camino = caminoDeEstado(vista, yo, ahora, resumen.debes, enCamino);
  const lineasCamino = textoDelCamino(camino, (id) => nombres[id] ?? id);

  // La recompensa llega al abrir la app: compara con lo último que viste (PX-04).
  const hidratado = useHidratado();
  const { visto, marcar } = useVistoDemo();
  const [revelada, setRevelada] = useState<Revelacion | null>(null);
  const [festejos, setFestejos] = useState(0);
  const revisado = useRef(false);
  useEffect(() => {
    if (!hidratado || revisado.current || !yoMiembro) return;
    revisado.current = true;
    const referencia = visto[yo] ?? { estado: yoMiembro.estado, xpTotal: xpAcumuladaParaNivel(yoMiembro.nivel) + yoMiembro.xp };
    const r = revelacion(referencia, { estado: estadoYo, xpTotal });
    if (r) {
      // Un evento, un aviso: la XP que ya dice "X confirmó tu pago" no se repite en la revelación (el festejo sí ocurre).
      const xpAvisada = avisosParaPagador(registros, yo).filter((a) => a.estado === "confirmado").reduce((suma, a) => suma + a.xp, 0);
      setRevelada(sinDuplicarXp(r, xpAvisada));
      if (r.festejar) setFestejos((n) => n + 1);
    }
    marcar(yo, { estado: estadoYo, xpTotal });
  }, [hidratado]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bienvenida "Conoce a tu personaje": una sola vez por persona. No se muestra a navegadores automatizados (pruebas E2E)
  // salvo que se pida con `?bienvenida=1` (también desde "Herramientas de prueba").
  const { vista: vistaBienvenida, marcar: marcarBienvenida } = useBienvenidaDemo();
  const [bienvenidaCerrada, setBienvenidaCerrada] = useState(false);
  const mostrarBienvenida = hidratado && !bienvenidaCerrada && yoMiembro && (forzarBienvenida || (!vistaBienvenida[yo] && !navigator.webdriver));

  const filas = verTodas ? resumen.debes : resumen.debes.slice(0, FILAS_VISIBLES);
  const cuentaHoja = hoja ? resumen.debes.find((c) => c.personaId === hoja) : undefined;
  const reservaHoja = cuentaHoja ? reservaDeCuenta(cuentaHoja, registros, yo) : null;

  return (
    <section data-component="ResumenInicio" aria-label="Tus cuentas" className="flex flex-col gap-4">
      {yoMiembro && (
        <HeroPersonaje
          nombre={yoMiembro.nombre}
          apariencia={apariencia({ base: yoMiembro.base, estado: estadoYo, skin: yoMiembro.skinActivo, nivel: progreso.nivel })}
          estado={estadoYo}
          nivel={progreso.nivel}
          xp={progreso.xpEnNivel}
          xpSiguiente={progreso.xpSiguiente}
          celebrar={festejos}
          frase={reaccion ?? fraseDelPersonaje(estadoYo, resumen.debes.length > 0)}
          camino={lineasCamino}
        />
      )}
      {mostrarBienvenida && yoMiembro && (
        <Bienvenida
          nombre={yoMiembro.nombre}
          base={yoMiembro.base}
          hrefYo={`/dev/demo/yo?u=${yo}`}
          onCerrar={() => {
            setBienvenidaCerrada(true);
            marcarBienvenida(yo);
          }}
        />
      )}
      {revelada && <RevelacionPersonaje revelacion={revelada} onCerrar={() => setRevelada(null)} />}

      <Card className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Debes</p>
        <p data-testid="inicio-debes" className={cn("font-display text-4xl font-bold", resumen.debesCentavos > 0 ? "text-rose-text" : "text-foreground")}>
          {formatoMXN(resumen.debesCentavos)}
        </p>
        {resumen.debes.length > 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="inicio-resumen-texto">
            a {resumen.debes.length === 1 ? "1 persona" : `${resumen.debes.length} personas`} · la más vieja {tiempoDesdeHoras(resumen.masViejaHoras ?? 0)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">¡Todo en orden! 🌻</p>
        )}
      </Card>

      <BandejaPagos grupos={grupos} yo={yo} />

      {error && (
        <p role="alert" data-testid="inicio-error" className="text-rose-text">
          {error}
        </p>
      )}

      {resumen.debes.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-xl font-bold">Te toca pagar</h2>
          <ul className="flex flex-col gap-2" data-testid="inicio-te-toca">
            {filas.map((c) => {
              const m = miembro(c.personaId);
              return (
                <FilaCuenta
                  key={c.personaId}
                  cuenta={c}
                  nombre={m?.nombre ?? c.personaId}
                  base={m?.base ?? "persona-sol"}
                  estado={estadoDe(c.personaId)}
                  accesorio={SKINS[skinDe(m?.skinActivo)].accesorio}
                  reserva={reservaDeCuenta(c, registros, yo)}
                  onPagar={() => setHoja(c.personaId)}
                  onCancelar={() => cancelarA(c.personaId)}
                />
              );
            })}
          </ul>
          {resumen.debes.length > FILAS_VISIBLES && (
            <Button variant="ghost" size="md" className="self-start" data-testid="inicio-ver-todas" onClick={() => setVerTodas((v) => !v)}>
              {verTodas ? "Ver menos ▴" : `Ver las ${resumen.debes.length} personas ▾`}
            </Button>
          )}
        </div>
      )}

      {resumen.teDeben.length > 0 && (
        <details className="flex flex-col gap-2" data-testid="inicio-te-deben-lista">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between font-display text-xl font-bold">
            <span>Te van a pagar</span>
            <span data-testid="inicio-te-deben" className="text-grass-text">
              {formatoMXN(resumen.teDebenCentavos)}
            </span>
          </summary>
          <ul className="mt-2 flex flex-col gap-2">
            {resumen.teDeben.map((c) => {
              const m = miembro(c.personaId);
              return <FilaCuenta key={c.personaId} cuenta={c} nombre={m?.nombre ?? c.personaId} base={m?.base ?? "persona-sol"} estado={estadoDe(c.personaId)} accesorio={SKINS[skinDe(m?.skinActivo)].accesorio} reserva={null} />;
            })}
          </ul>
        </details>
      )}
      {resumen.teDeben.length === 0 && <span className="sr-only" data-testid="inicio-te-deben">{formatoMXN(0)}</span>}

      {cuentaHoja && reservaHoja && reservaHoja.disponibleCentavos > 0 && (
        <HojaPago
          titulo={`Pagarle a ${miembro(cuentaHoja.personaId)?.nombre ?? cuentaHoja.personaId}`}
          detalle={reservaHoja.disponibles.map((d) => `${grupos.find((g) => g.id === d.grupoId)?.icono ?? ""} ${grupos.find((g) => g.id === d.grupoId)?.nombre ?? d.grupoId}: ${formatoMXN(d.centavos)}`)}
          totalCentavos={reservaHoja.disponibleCentavos}
          onCerrar={() => setHoja(null)}
          onConfirmar={(centavos) => {
            if (pagar(cuentaHoja.personaId, reservaHoja.disponibles, centavos)) setHoja(null);
          }}
        />
      )}
      {toast && <ToastPago texto={toast.texto} onDeshacer={deshacer} onCerrar={cerrarToast} />}
    </section>
  );
}
