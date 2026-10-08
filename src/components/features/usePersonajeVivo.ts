"use client";

import { useMemo } from "react";
import { estadoAvatar, situacionEnGrupo, type EstadoAvatar } from "@/lib/game/avatar";
import { progresoNivel, xpAcumuladaParaNivel } from "@/lib/game/levels";
import type { GrupoDemo, MiembroDemo } from "@/lib/mock/tipos";
import { paresConfirmados, xpPorPagosConfirmados } from "@/lib/splits/confirmacion";
import { aplicarPagos } from "@/lib/splits/pagos";
import { usePagosDemo } from "./usePagosDemo";
import { xpDeGastosGuardados } from "@/lib/mock/gastosGuardados";
import { useGastosDemo, useGruposConGastos } from "./useGastosDemo";
import { useGruposConPerfiles } from "./usePerfilesDemo";

/**
 * Una sola fuente de verdad del personaje en el demo (PX-01): el nombre y el personaje que cada quien eligió, el estado
 * derivado de los pagos CONFIRMADOS y el nivel/XP con lo ganado al confirmarse los pagos. Todas las pantallas leen de aquí
 * para que cuenten la misma historia.
 */
export function usePersonajeVivo(gruposBase: GrupoDemo[], yoId: string, ahoraIso: string) {
  const grupos = useGruposConGastos(useGruposConPerfiles(gruposBase));
  const { guardados } = useGastosDemo();
  const { registros } = usePagosDemo();
  const ahora = useMemo(() => new Date(ahoraIso), [ahoraIso]);

  // Solo los pagos CONFIRMADOS saldan deudas, cambian balances y personaje.
  const vista = useMemo(() => grupos.map((g) => ({ ...g, gastos: aplicarPagos(g.gastos, paresConfirmados(registros, g.id)) })), [grupos, registros]);

  const estadoDe = (id: string): EstadoAvatar =>
    estadoAvatar(vista.filter((g) => g.miembros.some((m) => m.id === id)).map((g) => situacionEnGrupo(g.gastos, id, ahora)));
  const miembro = (id: string): MiembroDemo | undefined => grupos.flatMap((g) => g.miembros).find((m) => m.id === id);

  const yo = miembro(yoId);
  const xpGanada = xpPorPagosConfirmados(registros, yoId) + xpDeGastosGuardados(guardados, yoId);
  const xpTotal = yo ? xpAcumuladaParaNivel(yo.nivel) + yo.xp + xpGanada : xpGanada;
  const progreso = progresoNivel(xpTotal);

  return { grupos, vista, registros, ahora, estadoDe, miembro, yo, estadoYo: estadoDe(yoId), xpGanada, xpTotal, progreso };
}
