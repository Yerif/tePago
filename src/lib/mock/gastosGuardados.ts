import { contarDelDia, xpPorRegistrarGasto } from "@/lib/game/xp";
import type { GastoDemo, GrupoDemo } from "./tipos";

/** Un gasto que alguien registró en Dividir durante el demo (solo dev/preview). Con Supabase serán filas de `expenses` + `expense_shares`. */
export interface GastoGuardado {
  id: string;
  grupoId: string;
  descripcion: string;
  totalCentavos: number;
  pagadoPor: string;
  /** Quién lo registró: a esa persona se le da la XP (anti-farming D5). */
  creadoPor: string;
  fechaIso: string;
  partes: { userId: string; centavos: number }[];
  /** Lo que "Montos" no asignó: queda con el pagador, nadie lo debe. */
  sinAsignarCentavos: number;
  xp: number;
}

export interface EntradaGastoGuardado {
  grupoId: string;
  descripcion: string;
  totalCentavos: number;
  pagadoPor: string;
  creadoPor: string;
  partes: Readonly<Record<string, number>>;
  sinAsignarCentavos: number;
  ahora: Date;
}

/** Crea el registro y calcula su XP con la regla D5 (≥ 2 personas y máximo 5 gastos con XP al día por quien registra). */
export function crearGastoGuardado(entrada: EntradaGastoGuardado, previos: readonly GastoGuardado[]): GastoGuardado {
  const partes = Object.entries(entrada.partes).map(([userId, centavos]) => ({ userId, centavos }));
  const conXpHoy = previos.filter((g) => g.creadoPor === entrada.creadoPor && g.xp > 0).map((g) => g.fechaIso);
  const xp = xpPorRegistrarGasto({ participantes: Math.max(1, partes.length), gastosConXpHoy: contarDelDia(conXpHoy, entrada.ahora) });
  return {
    id: `gasto-${entrada.ahora.getTime()}-${previos.length + 1}`,
    grupoId: entrada.grupoId,
    descripcion: entrada.descripcion.trim() || "Gasto",
    totalCentavos: entrada.totalCentavos,
    pagadoPor: entrada.pagadoPor,
    creadoPor: entrada.creadoPor,
    fechaIso: entrada.ahora.toISOString(),
    partes,
    sinAsignarCentavos: entrada.sinAsignarCentavos,
    xp,
  };
}

/** Los mismos grupos con los gastos guardados agregados (sin tocar los originales). */
export function aplicarGastosGuardados<G extends Pick<GrupoDemo, "id" | "gastos">>(grupos: readonly G[], guardados: readonly GastoGuardado[]): G[] {
  if (guardados.length === 0) return grupos as G[];
  return grupos.map((g) => {
    const propios = guardados.filter((x) => x.grupoId === g.id);
    if (propios.length === 0) return g;
    const nuevos: GastoDemo[] = propios.map((x) => ({
      id: x.id,
      descripcion: x.descripcion,
      categoria: "otros",
      fecha: x.fechaIso,
      totalCentavos: x.totalCentavos,
      pagadoPor: x.pagadoPor,
      partes: x.partes.map((p) => ({ userId: p.userId, centavos: p.centavos, saldado: p.userId === x.pagadoPor })),
    }));
    return { ...g, gastos: [...g.gastos, ...nuevos] };
  });
}

/** La XP que `personaId` ganó registrando gastos. */
export function xpDeGastosGuardados(guardados: readonly GastoGuardado[], personaId: string): number {
  return guardados.filter((g) => g.creadoPor === personaId).reduce((suma, g) => suma + g.xp, 0);
}

/** Lee lo guardado con tolerancia: ignora entradas dañadas en lugar de romper la pantalla. */
export function limpiarGastosGuardados(datos: unknown): GastoGuardado[] {
  if (!Array.isArray(datos)) return [];
  const entero = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
  const limpios: GastoGuardado[] = [];
  for (const d of datos) {
    if (typeof d !== "object" || d === null) continue;
    const g = d as Record<string, unknown>;
    if (![g.id, g.grupoId, g.descripcion, g.pagadoPor, g.creadoPor, g.fechaIso].every((v) => typeof v === "string" && v !== "")) continue;
    if (!entero(g.totalCentavos) || !entero(g.sinAsignarCentavos) || !entero(g.xp) || !Array.isArray(g.partes)) continue;
    const partes = g.partes.filter((p): p is { userId: string; centavos: number } => typeof p === "object" && p !== null && typeof (p as { userId?: unknown }).userId === "string" && entero((p as { centavos?: unknown }).centavos));
    if (partes.length === 0) continue;
    limpios.push({
      id: g.id as string,
      grupoId: g.grupoId as string,
      descripcion: g.descripcion as string,
      totalCentavos: g.totalCentavos,
      pagadoPor: g.pagadoPor as string,
      creadoPor: g.creadoPor as string,
      fechaIso: g.fechaIso as string,
      partes: partes.map((p) => ({ userId: p.userId, centavos: p.centavos })),
      sinAsignarCentavos: g.sinAsignarCentavos,
      xp: g.xp,
    });
  }
  return limpios;
}
