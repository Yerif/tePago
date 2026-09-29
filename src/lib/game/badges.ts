/**
 * Los 6 badges (CLAUDE.md §7) y sus evaluadores. TS puro: recibe los hechos de UN grupo y devuelve quién
 * merece cada badge. El job de servidor (ticket aparte) los compara con lo guardado en `user_badges`
 * usando `diferenciaBadges` y escribe con la función `security definer`; el cliente nunca los escribe.
 */
export const BADGE_SLUGS = ["rayo", "generoso", "fantasma", "jardinero", "alcalde", "mecenas"] as const;
export type BadgeSlug = (typeof BADGE_SLUGS)[number];

export interface DefinicionBadge {
  nombre: string;
  descripcion: string;
  /** Se puede perder (Fantasma al saldar, Generoso cada mes, Mecenas si alguien paga más). Los demás son permanentes. */
  revocable: boolean;
}

export const BADGES: Record<BadgeSlug, DefinicionBadge> = {
  rayo: { nombre: "Rayo ⚡", descripcion: "5 deudas saldadas en menos de 24 h", revocable: false },
  generoso: { nombre: "El Generoso 🌻", descripcion: "Quien más gastos pagó en el grupo este mes", revocable: true },
  fantasma: { nombre: "El Fantasma 👻", descripcion: "Una deuda activa de más de 7 días", revocable: true },
  jardinero: { nombre: "Jardinero 🌱", descripcion: "5 pagos a tiempo", revocable: false },
  alcalde: { nombre: "Alcalde 🏅", descripcion: "10 pagos a tiempo", revocable: false },
  mecenas: { nombre: "El Mecenas 🎩", descripcion: "Pagó la cuenta más grande del grupo", revocable: true },
};

export const HORAS_RAYO = 24;
/** "A tiempo" = saldada antes de que la deuda pase a `rekt` (72 h, igual que el estado del avatar). */
export const HORAS_A_TIEMPO = 72;
export const HORAS_FANTASMA = 7 * 24;
export const PAGOS_RAYO = 5;
export const PAGOS_JARDINERO = 5;
export const PAGOS_ALCALDE = 10;
export const ZONA_HORARIA = "America/Mexico_City";

export interface GastoBadge {
  id: string;
  pagadoPor: string;
  totalCentavos: number;
  /** Fecha ISO de creación del gasto. */
  fecha: string;
}

/** La parte de un gasto que `userId` le debe a quien pagó (nunca la del propio pagador). */
export interface DeudaBadge {
  userId: string;
  /** Cuándo nació la deuda (fecha del gasto). */
  creadaEn: string;
  /** Cuándo se saldó; null si sigue activa. */
  saldadaEn: string | null;
}

export interface EntradaBadges {
  gastos: readonly GastoBadge[];
  deudas: readonly DeudaBadge[];
  ahora: Date;
  zonaHoraria?: string;
}

export type BadgesMerecidos = Record<BadgeSlug, string[]>;

function horasEntre(desde: string, hasta: string | Date): number {
  const inicio = new Date(desde).getTime();
  const fin = (typeof hasta === "string" ? new Date(hasta) : hasta).getTime();
  if (Number.isNaN(inicio) || Number.isNaN(fin)) throw new RangeError("Fecha inválida");
  return (fin - inicio) / 3_600_000;
}

/** "2026-09" para una fecha ISO, en la zona horaria del grupo (el mes de "El Generoso" es el de México, no el UTC). */
export function claveMes(fechaIso: string, zonaHoraria: string = ZONA_HORARIA): string {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: zonaHoraria, year: "numeric", month: "2-digit" }).formatToParts(new Date(fechaIso));
  const { year, month } = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${year}-${month}`;
}

function conteoPor<T>(items: readonly T[], clave: (t: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(clave(it), (m.get(clave(it)) ?? 0) + 1);
  return m;
}

/** Quienes tienen al menos `minimo` deudas que cumplen `cuenta`. */
function conAlMenos(deudas: readonly DeudaBadge[], minimo: number, cuenta: (d: DeudaBadge & { horas: number }) => boolean): string[] {
  const saldadas = deudas.flatMap((d) => (d.saldadaEn === null ? [] : [{ ...d, horas: horasEntre(d.creadaEn, d.saldadaEn) }])).filter(cuenta);
  return [...conteoPor(saldadas, (d) => d.userId)].filter(([, n]) => n >= minimo).map(([id]) => id).sort();
}

/**
 * Empates (decisión de producto, ajustable):
 * - Generoso: gana quien más gastos pagó este mes; si hay empate, quien sumó más dinero; si aun así
 *   empatan, comparten el badge. Nadie lo tiene si el mes no lleva gastos.
 * - Mecenas: quien pagó el gasto de mayor monto de todo el historial del grupo; los empates comparten el badge.
 */
export function evaluarBadges({ gastos, deudas, ahora, zonaHoraria = ZONA_HORARIA }: EntradaBadges): BadgesMerecidos {
  const mes = claveMes(ahora.toISOString(), zonaHoraria);
  const delMes = gastos.filter((g) => claveMes(g.fecha, zonaHoraria) === mes);
  const porPagador = new Map<string, { n: number; total: number }>();
  for (const g of delMes) {
    const actual = porPagador.get(g.pagadoPor) ?? { n: 0, total: 0 };
    porPagador.set(g.pagadoPor, { n: actual.n + 1, total: actual.total + g.totalCentavos });
  }
  const maxN = Math.max(0, ...[...porPagador.values()].map((v) => v.n));
  const empatadosN = [...porPagador].filter(([, v]) => v.n === maxN);
  const maxTotal = Math.max(0, ...empatadosN.map(([, v]) => v.total));
  const generoso = maxN === 0 ? [] : empatadosN.filter(([, v]) => v.total === maxTotal).map(([id]) => id).sort();

  const mayor = Math.max(0, ...gastos.map((g) => g.totalCentavos));
  const mecenas = mayor === 0 ? [] : [...new Set(gastos.filter((g) => g.totalCentavos === mayor).map((g) => g.pagadoPor))].sort();

  const fantasma = [
    ...new Set(deudas.filter((d) => d.saldadaEn === null && horasEntre(d.creadaEn, ahora) > HORAS_FANTASMA).map((d) => d.userId)),
  ].sort();

  return {
    rayo: conAlMenos(deudas, PAGOS_RAYO, (d) => d.horas < HORAS_RAYO),
    generoso,
    fantasma,
    jardinero: conAlMenos(deudas, PAGOS_JARDINERO, (d) => d.horas <= HORAS_A_TIEMPO),
    alcalde: conAlMenos(deudas, PAGOS_ALCALDE, (d) => d.horas <= HORAS_A_TIEMPO),
    mecenas,
  };
}

export interface BadgeOtorgado {
  userId: string;
  slug: BadgeSlug;
}

export interface CambiosBadges {
  otorgar: BadgeOtorgado[];
  revocar: BadgeOtorgado[];
}

/**
 * Lo que el job debe escribir: otorga lo merecido que aún no está activo y revoca lo activo que ya no se
 * merece, pero SOLO en badges revocables (los permanentes nunca se quitan aunque los datos cambien).
 */
export function diferenciaBadges(activos: readonly BadgeOtorgado[], merecidos: BadgesMerecidos): CambiosBadges {
  const llave = (b: BadgeOtorgado) => `${b.slug}:${b.userId}`;
  const activas = new Set(activos.map(llave));
  const deseados = BADGE_SLUGS.flatMap((slug) => merecidos[slug].map((userId) => ({ userId, slug })));
  const deseadas = new Set(deseados.map(llave));
  return {
    otorgar: deseados.filter((b) => !activas.has(llave(b))),
    revocar: activos.filter((b) => BADGES[b.slug].revocable && !deseadas.has(llave(b))),
  };
}
