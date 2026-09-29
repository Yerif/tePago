import type { Categoria } from "@/lib/categorias";
import { BADGE_SLUGS, BADGES, type BadgeSlug } from "@/lib/game/badges";
import { estadoAvatar, situacionEnGrupo, type EstadoAvatar, type SituacionGrupo } from "@/lib/game/avatar";
import { progresoNivel } from "@/lib/game/levels";
import { repartirIgual } from "@/lib/splits/igual";
import type { GastoDemo, GrupoDemo, MiembroDemo } from "./tipos";

/** Datos de ejemplo para probar la UI sin Supabase. NUNCA se usan en producción. */
export const YO = "ana";

/** Los nombres salen del catálogo real (`lib/game/badges`); aquí solo se agrega el color de la pill. */
const VARIANTE_BADGE: Record<BadgeSlug, "lemon" | "mint" | "rose" | "grass" | "lavender"> = {
  rayo: "lemon",
  generoso: "mint",
  fantasma: "rose",
  jardinero: "grass",
  alcalde: "lavender",
  mecenas: "lavender",
};

export const BADGES_DEMO: Record<string, { nombre: string; variant: (typeof VARIANTE_BADGE)[BadgeSlug] }> = Object.fromEntries(
  BADGE_SLUGS.map((slug) => [slug, { nombre: BADGES[slug].nombre, variant: VARIANTE_BADGE[slug] }]),
);

type BaseMiembro = Pick<MiembroDemo, "id" | "nombre" | "usuario" | "emoji" | "badges"> & { xpTotal: number };

const BASE: Record<string, BaseMiembro> = {
  ana: { id: "ana", nombre: "Ana", usuario: "ana", emoji: "🐻", badges: ["jardinero"], xpTotal: 395 },
  ferni: { id: "ferni", nombre: "Ferni", usuario: "ferni", emoji: "🦊", badges: ["rayo", "generoso"], xpTotal: 940 },
  caro: { id: "caro", nombre: "Caro", usuario: "caro", emoji: "🐰", badges: [], xpTotal: 160 },
  beto: { id: "beto", nombre: "Beto", usuario: "beto", emoji: "🐸", badges: ["fantasma"], xpTotal: 30 },
  luis: { id: "luis", nombre: "Luis", usuario: "luis", emoji: "🦉", badges: ["alcalde"], xpTotal: 725 },
  mari: { id: "mari", nombre: "Mari", usuario: "mari", emoji: "🐱", badges: [], xpTotal: 240 },
};

/** Nivel y XP salen de la XP total; el estado, de las deudas: nada de esto está escrito a mano. */
function miembro(id: string, estado: EstadoAvatar): MiembroDemo {
  const { xpTotal, ...base } = BASE[id] as BaseMiembro;
  const p = progresoNivel(xpTotal);
  return { ...base, nivel: p.nivel, xp: p.xpEnNivel, xpSiguiente: p.xpSiguiente, estado };
}

interface EntradaGasto {
  id: string;
  descripcion: string;
  categoria: Categoria;
  totalCentavos: number;
  pagadoPor: string;
  participantes: string[];
  saldados?: string[];
  haceHoras: number;
}

/** Las partes salen de `repartirIgual`: el invariante Σ partes = total se cumple por construcción. */
function gasto(e: EntradaGasto, ahora: Date): GastoDemo {
  const partes = repartirIgual(e.totalCentavos, e.participantes, e.pagadoPor);
  return {
    id: e.id,
    descripcion: e.descripcion,
    categoria: e.categoria,
    totalCentavos: e.totalCentavos,
    pagadoPor: e.pagadoPor,
    fecha: new Date(ahora.getTime() - e.haceHoras * 3_600_000).toISOString(),
    partes: Object.entries(partes).map(([userId, centavos]) => ({
      userId,
      centavos,
      saldado: userId === e.pagadoPor || (e.saldados ?? []).includes(userId),
    })),
  };
}

/** Fechas relativas a `ahora` para que las deudas siempre "envejezcan" igual en la demo. */
export function crearGrupos(ahora: Date): GrupoDemo[] {
  const oaxaca = ["ana", "ferni", "caro", "beto"];
  const roomies = ["ana", "luis", "mari"];
  const definiciones = [
    {
      id: "oaxaca",
      nombre: "Viaje a Oaxaca",
      icono: "🌮",
      ids: oaxaca,
      gastos: [
        gasto({ id: "e1", descripcion: "Cena en Casa Oaxaca", categoria: "comida", totalCentavos: 124000, pagadoPor: "ferni", participantes: oaxaca, saldados: ["ana"], haceHoras: 20 }, ahora),
        gasto({ id: "e2", descripcion: "Mezcal y chelas", categoria: "fiesta", totalCentavos: 86050, pagadoPor: "caro", participantes: oaxaca, saldados: ["ferni", "ana"], haceHoras: 44 }, ahora),
        gasto({ id: "e3", descripcion: "Airbnb 3 noches", categoria: "hospedaje", totalCentavos: 480000, pagadoPor: "ana", participantes: oaxaca, saldados: ["ferni", "caro"], haceHoras: 120 }, ahora),
        gasto({ id: "e4", descripcion: "Taxi al aeropuerto", categoria: "transporte", totalCentavos: 38000, pagadoPor: "beto", participantes: ["ana", "beto", "ferni"], saldados: ["ana", "ferni"], haceHoras: 6 }, ahora),
      ],
    },
    {
      id: "roomies",
      nombre: "Roomies",
      icono: "🏠",
      ids: roomies,
      gastos: [
        gasto({ id: "r1", descripcion: "Renta de octubre", categoria: "hogar", totalCentavos: 900000, pagadoPor: "luis", participantes: roomies, saldados: ["ana"], haceHoras: 60 }, ahora),
        gasto({ id: "r2", descripcion: "Súper de la semana", categoria: "super", totalCentavos: 114590, pagadoPor: "ana", participantes: roomies, saldados: ["luis"], haceHoras: 30 }, ahora),
        gasto({ id: "r3", descripcion: "Luz", categoria: "hogar", totalCentavos: 48000, pagadoPor: "mari", participantes: roomies, saldados: ["ana", "luis"], haceHoras: 10 }, ahora),
      ],
    },
  ];

  // El avatar es global: mira la situación de cada persona en TODOS sus grupos.
  const situaciones: Record<string, SituacionGrupo[]> = {};
  for (const d of definiciones) {
    for (const id of d.ids) (situaciones[id] ??= []).push(situacionEnGrupo(d.gastos, id, ahora));
  }

  return definiciones.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    icono: d.icono,
    gastos: d.gastos,
    miembros: d.ids.map((id) => miembro(id, estadoAvatar(situaciones[id] ?? []))),
  }));
}
