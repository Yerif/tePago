import type { Categoria } from "@/lib/categorias";
import { BADGE_SLUGS, BADGES, type BadgeSlug } from "@/lib/game/badges";
import { estadoAvatar, situacionEnGrupo, type EstadoAvatar, type SituacionGrupo } from "@/lib/game/avatar";
import { progresoNivel } from "@/lib/game/levels";
import { BASES } from "@/lib/game/apariencia";
import { badgesValidos, skinEfectiva } from "@/lib/game/skins";
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

type BaseMiembro = Pick<MiembroDemo, "id" | "nombre" | "usuario" | "base" | "badges"> & { xpTotal: number; skinElegida: string };

const BASE: Record<string, BaseMiembro> = {
  ana: { id: "ana", nombre: "Ana", usuario: "ana", base: "oso", badges: ["jardinero"], xpTotal: 395, skinElegida: "jardinero" },
  ferni: { id: "ferni", nombre: "Ferni", usuario: "ferni", base: "zorro", badges: ["rayo", "jardinero", "generoso"], xpTotal: 940, skinElegida: "explorador" },
  caro: { id: "caro", nombre: "Caro", usuario: "caro", base: "conejo", badges: [], xpTotal: 160, skinElegida: "clasico" },
  beto: { id: "beto", nombre: "Beto", usuario: "beto", base: "rana", badges: ["fantasma"], xpTotal: 30, skinElegida: "clasico" },
  luis: { id: "luis", nombre: "Luis", usuario: "luis", base: "persona-sol", badges: ["jardinero", "alcalde"], xpTotal: 725, skinElegida: "alcalde" },
  mari: { id: "mari", nombre: "Mari", usuario: "mari", base: "persona-luna", badges: [], xpTotal: 240, skinElegida: "clasico" },
  nico: { id: "nico", nombre: "Nico", usuario: "nico", base: "gato", badges: ["generoso", "mecenas"], xpTotal: 510, skinElegida: "explorador" },
  pau: { id: "pau", nombre: "Pau", usuario: "pau", base: "persona-nube", badges: ["jardinero"], xpTotal: 330, skinElegida: "jardinero" },
  rafa: { id: "rafa", nombre: "Rafa", usuario: "rafa", base: "buho", badges: ["fantasma"], xpTotal: 80, skinElegida: "clasico" },
  sofi: { id: "sofi", nombre: "Sofi", usuario: "sofi", base: "conejo", badges: [], xpTotal: 1500, skinElegida: "leyenda" },
  dani: { id: "dani", nombre: "Dani", usuario: "dani", base: "zorro", badges: ["rayo", "jardinero"], xpTotal: 200, skinElegida: "jardinero" },
};

/** Nivel y XP salen de la XP total; el estado, de las deudas: nada de esto está escrito a mano. */
function miembro(id: string, estado: EstadoAvatar): MiembroDemo {
  const { xpTotal, skinElegida, ...base } = BASE[id] as BaseMiembro;
  const p = progresoNivel(xpTotal);
  const skinActivo = skinEfectiva(skinElegida, { nivel: p.nivel, badges: badgesValidos(base.badges) });
  return { ...base, emoji: BASES[base.base].emoji, nivel: p.nivel, xp: p.xpEnNivel, xpSiguiente: p.xpSiguiente, estado, skinActivo };
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
  /** Reparto a mano (centavos por persona; debe sumar el total). Sin esto, el gasto se divide en partes iguales. */
  partesCentavos?: Record<string, number>;
}

/** Las partes salen de `repartirIgual`: el invariante Σ partes = total se cumple por construcción. */
function gasto(e: EntradaGasto, ahora: Date): GastoDemo {
  const partes = e.partesCentavos ?? repartirIgual(e.totalCentavos, e.participantes, e.pagadoPor);
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
  const playa = ["ana", "nico", "pau", "rafa", "sofi", "dani"];
  const peda = ["ana", "nico", "dani", "rafa"];
  const oficina = ["ana", "sofi", "dani", "nico"];
  const cocina = ["ana", "sofi", "pau"];
  const abuela = ["ana", "caro", "ferni", "luis", "mari"];
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
        gasto({ id: "e5", descripcion: "Desayuno en el mercado", categoria: "comida", totalCentavos: 48000, pagadoPor: "caro", participantes: oaxaca, haceHoras: 30 }, ahora),
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
        gasto({ id: "r4", descripcion: "Internet y streaming", categoria: "hogar", totalCentavos: 60000, pagadoPor: "mari", participantes: roomies, haceHoras: 12 }, ahora),
        gasto({ id: "r5", descripcion: "Cena de cumple de Luis", categoria: "fiesta", totalCentavos: 120000, pagadoPor: "luis", participantes: roomies, haceHoras: 8 }, ahora),
      ],
    },
    {
      id: "playa",
      nombre: "Casa en la playa",
      icono: "🏖️",
      ids: playa,
      gastos: [
        gasto({ id: "p1", descripcion: "Renta de la casa (3 noches)", categoria: "hospedaje", totalCentavos: 900000, pagadoPor: "nico", participantes: playa, saldados: ["sofi", "dani"], haceHoras: 100 }, ahora),
        gasto({ id: "p2", descripcion: "Súper y bebidas", categoria: "super", totalCentavos: 360000, pagadoPor: "pau", participantes: playa, saldados: ["nico", "sofi"], haceHoras: 70 }, ahora),
        gasto({ id: "p3", descripcion: "Kayaks y snorkel", categoria: "entretenimiento", totalCentavos: 240000, pagadoPor: "rafa", participantes: ["ana", "rafa", "pau", "nico"], saldados: ["nico"], haceHoras: 50 }, ahora),
        gasto({ id: "p4", descripcion: "Gasolina y casetas", categoria: "transporte", totalCentavos: 150000, pagadoPor: "ana", participantes: ["ana", "sofi", "dani", "nico"], saldados: ["sofi"], haceHoras: 90 }, ahora),
        gasto({
          id: "p5",
          descripcion: "Cena de mariscos",
          categoria: "comida",
          totalCentavos: 420000,
          pagadoPor: "sofi",
          participantes: playa,
          partesCentavos: { ana: 80000, nico: 90000, pau: 60000, rafa: 70000, sofi: 70000, dani: 50000 },
          saldados: ["dani"],
          haceHoras: 30,
        }, ahora),
        gasto({ id: "p6", descripcion: "Paseo en lancha", categoria: "entretenimiento", totalCentavos: 80000, pagadoPor: "ana", participantes: playa, haceHoras: 10 }, ahora),
      ],
    },
    {
      id: "peda",
      nombre: "Peda del viernes",
      icono: "🍻",
      ids: peda,
      gastos: [
        gasto({ id: "v1", descripcion: "Chelas en La Roma", categoria: "fiesta", totalCentavos: 120000, pagadoPor: "rafa", participantes: peda, saldados: ["dani"], haceHoras: 20 }, ahora),
        gasto({ id: "v2", descripcion: "Uber de regreso", categoria: "transporte", totalCentavos: 36000, pagadoPor: "ana", participantes: ["ana", "nico", "dani"], saldados: ["nico"], haceHoras: 14 }, ahora),
        gasto({ id: "v3", descripcion: "Tacos de madrugada", categoria: "comida", totalCentavos: 48000, pagadoPor: "dani", participantes: peda, haceHoras: 12 }, ahora),
        gasto({
          id: "v4",
          descripcion: "Entrada al antro",
          categoria: "fiesta",
          totalCentavos: 100000,
          pagadoPor: "nico",
          participantes: peda,
          partesCentavos: { ana: 30000, nico: 30000, dani: 20000, rafa: 20000 },
          haceHoras: 15,
        }, ahora),
      ],
    },
    {
      id: "oficina",
      nombre: "Oficina",
      icono: "☕",
      ids: oficina,
      gastos: [
        gasto({ id: "o1", descripcion: "Cafés de la semana", categoria: "comida", totalCentavos: 64000, pagadoPor: "ana", participantes: oficina, saldados: ["sofi", "nico"], haceHoras: 130 }, ahora),
        gasto({ id: "o2", descripcion: "Comida de equipo", categoria: "comida", totalCentavos: 200000, pagadoPor: "ana", participantes: oficina, saldados: ["sofi"], haceHoras: 60 }, ahora),
        gasto({ id: "o3", descripcion: "Regalo para la jefa", categoria: "regalos", totalCentavos: 120000, pagadoPor: "sofi", participantes: oficina, saldados: ["ana", "nico"], haceHoras: 40 }, ahora),
        gasto({ id: "o4", descripcion: "Pastel de cumple", categoria: "fiesta", totalCentavos: 50000, pagadoPor: "nico", participantes: oficina, saldados: ["ana", "dani", "sofi"], haceHoras: 30 }, ahora),
        gasto({ id: "o5", descripcion: "Despedida de Dani", categoria: "fiesta", totalCentavos: 150000, pagadoPor: "nico", participantes: oficina, saldados: ["ana", "dani"], haceHoras: 18 }, ahora),
      ],
    },
    {
      id: "cocina",
      nombre: "Clases de cocina",
      icono: "👩‍🍳",
      ids: cocina,
      gastos: [
        gasto({ id: "k1", descripcion: "Inscripción al taller", categoria: "entretenimiento", totalCentavos: 150000, pagadoPor: "sofi", participantes: cocina, saldados: ["ana", "pau"], haceHoras: 200 }, ahora),
        gasto({ id: "k2", descripcion: "Ingredientes", categoria: "super", totalCentavos: 90000, pagadoPor: "ana", participantes: cocina, saldados: ["sofi", "pau"], haceHoras: 100 }, ahora),
      ],
    },
    {
      id: "abuela",
      nombre: "Cumple de la abuela",
      icono: "🎂",
      ids: abuela,
      gastos: [
        gasto({ id: "a1", descripcion: "Pastel y decoración", categoria: "fiesta", totalCentavos: 180000, pagadoPor: "caro", participantes: abuela, saldados: ["ferni", "luis", "mari"], haceHoras: 40 }, ahora),
        gasto({ id: "a2", descripcion: "Regalo (reloj)", categoria: "regalos", totalCentavos: 300000, pagadoPor: "ferni", participantes: abuela, saldados: ["caro", "luis", "mari"], haceHoras: 55 }, ahora),
        gasto({ id: "a3", descripcion: "Comida en el restaurante", categoria: "comida", totalCentavos: 480000, pagadoPor: "luis", participantes: abuela, saldados: ["caro", "ferni", "mari"], haceHoras: 25 }, ahora),
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
