"use client";

import { useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getDebug, subscribeDebug, type DatosDebug } from "@/lib/debug";

const VACIO: DatosDebug = {};

export interface DebugPanelProps {
  /** Lo decide el servidor (`esEntornoDev`): en producción el panel no se pinta nunca. */
  habilitado: boolean;
}

/** Panel de depuración: aparece con `?debug=1` y solo fuera de producción (CLAUDE.md §12). */
export function DebugPanel({ habilitado }: DebugPanelProps) {
  const activo = useSearchParams().get("debug") === "1";
  const datos = useSyncExternalStore(subscribeDebug, getDebug, () => VACIO);
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);

  if (!habilitado || !activo) return null;

  async function copiarReporte() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ url: window.location.href, ...datos }, null, 2));
      setCopiado("si");
    } catch {
      setCopiado("no");
    }
  }

  return (
    <div data-component="DebugPanel" className="fixed right-4 bottom-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {abierto && (
        <Card size="sm" className="max-h-[70vh] w-80 max-w-full overflow-auto text-sm" data-testid="debug-contenido">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="text-muted-foreground">Usuario</dt>
            <dd data-testid="debug-usuario">{datos.usuario ?? "—"}</dd>
            <dt className="text-muted-foreground">Grupo</dt>
            <dd data-testid="debug-grupo">{datos.grupo ?? "—"}</dd>
            <dt className="text-muted-foreground">Avatar</dt>
            <dd data-testid="debug-avatar">{datos.estadoAvatar ?? "—"}</dd>
            <dt className="text-muted-foreground">XP</dt>
            <dd data-testid="debug-xp">{datos.xp ? `${datos.xp.total} (nivel ${datos.xp.nivel})` : "—"}</dd>
            <dt className="text-muted-foreground">3D</dt>
            <dd data-testid="debug-personaje">
              {datos.personaje
                ? datos.personaje.modo === "2d"
                  ? "sin WebGL (2D)"
                  : `1.er cuadro ${datos.personaje.primerCuadroMs} ms · ${datos.personaje.fpsMediana} fps (p5 ${datos.personaje.fpsP5}) · ${datos.personaje.drawCalls} draw calls · ${datos.personaje.triangulos} tris`
                : "—"}
            </dd>
            <dt className="text-muted-foreground">IA</dt>
            <dd data-testid="debug-ia">{datos.ia ? `${datos.ia.prompt} · ${datos.ia.latenciaMs} ms` : "sin llamadas"}</dd>
          </dl>
          {datos.ia && (
            <pre data-testid="debug-ia-respuesta" className="mt-2 max-h-40 overflow-auto rounded-2xl bg-muted p-2 text-xs break-words whitespace-pre-wrap">
              {datos.ia.respuesta}
            </pre>
          )}
          <Button size="sm" variant="outline" className="mt-3" data-testid="debug-copiar" onClick={copiarReporte}>
            Copiar reporte
          </Button>
          {copiado && (
            <p className="mt-1 text-xs text-muted-foreground" role="status">
              {copiado === "si" ? "Copiado ✔" : "No se pudo copiar"}
            </p>
          )}
        </Card>
      )}
      <Button size="sm" variant="peach" aria-expanded={abierto} data-testid="debug-toggle" onClick={() => setAbierto((v) => !v)}>
        🐞 Debug
      </Button>
    </div>
  );
}
