"use client";

import { useState } from "react";
import { Avatar, ETIQUETA_ESTADO } from "@/components/cozy/Avatar";
import { Pill } from "@/components/cozy/Pill";
import { BandejaPagos } from "@/components/features/BandejaPagos";
import { FilaCuenta } from "@/components/features/FilaCuenta";
import { HojaPago } from "@/components/features/HojaPago";
import { ToastPago } from "@/components/features/ToastPago";
import { usePagarPersona } from "@/components/features/usePagarPersona";
import { usePersonajeVivo } from "@/components/features/usePersonajeVivo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { GrupoDemo } from "@/lib/mock/tipos";
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
}

const FILAS_VISIBLES = 4;

/**
 * Primera pantalla: "¿qué hago con mi dinero?". Cuánto debes, lo que tienes que resolver con pagos (siempre arriba), una
 * fila por persona a la que le debes y, plegado, lo que te deben. Pagar es una hoja de 2 toques con "Deshacer".
 */
export function ResumenInicio({ grupos: gruposBase, yo, ahoraIso }: ResumenInicioProps) {
  const { grupos, vista, ahora, estadoYo, estadoDe, miembro, yo: yoMiembro } = usePersonajeVivo(gruposBase, yo, ahoraIso);
  const nombres = Object.fromEntries(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m.nombre])));
  const { registros, toast, error, pagar, deshacer, cancelarA, cerrarToast } = usePagarPersona(grupos, yo, nombres);
  const [hoja, setHoja] = useState<string | null>(null);
  const [verTodas, setVerTodas] = useState(false);

  const resumen = resumenPorPersona(vista, yo, ahora);

  const filas = verTodas ? resumen.debes : resumen.debes.slice(0, FILAS_VISIBLES);
  const cuentaHoja = hoja ? resumen.debes.find((c) => c.personaId === hoja) : undefined;
  const reservaHoja = cuentaHoja ? reservaDeCuenta(cuentaHoja, registros, yo) : null;

  return (
    <section data-component="ResumenInicio" aria-label="Tus cuentas" className="flex flex-col gap-4">
      <header className="flex items-center gap-3">
        {yoMiembro && <Avatar base={yoMiembro.base} estado={estadoYo} size="md" compacto />}
        <div>
          <h1 className="font-display text-2xl font-bold">Hola, {yoMiembro?.nombre} 👋</h1>
          <Pill variant={estadoYo === "clean" ? "grass" : estadoYo === "mild" ? "lemon" : "rose"} data-testid="inicio-estado">
            {ETIQUETA_ESTADO[estadoYo]}
          </Pill>
        </div>
      </header>

      <Card className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Debes</p>
        <p data-testid="inicio-debes" className={cn("font-display text-4xl font-bold", resumen.debesCentavos > 0 ? "text-rose-text" : "text-foreground")}>
          {formatoMXN(resumen.debesCentavos)}
        </p>
        {resumen.debes.length > 0 ? (
          <p className="text-sm text-muted-foreground" data-testid="inicio-resumen-texto">
            a {resumen.debes.length === 1 ? "1 persona" : `${resumen.debes.length} personas`} · la más vieja {tiempoDesdeHoras(resumen.masViejaHoras ?? 0)}
            {estadoYo !== "clean" ? " · al pagar, tu personaje se recupera 🌱" : ""}
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
              return <FilaCuenta key={c.personaId} cuenta={c} nombre={m?.nombre ?? c.personaId} base={m?.base ?? "persona-sol"} estado={estadoDe(c.personaId)} reserva={null} />;
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
