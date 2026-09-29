import type { Categoria } from "@/lib/categorias";
import { repartirIgual } from "@/lib/splits/igual";
import type { GastoDemo, GrupoDemo, MiembroDemo } from "./tipos";

/** Datos de ejemplo para probar la UI sin Supabase. NUNCA se usan en producción. */
export const YO = "ana";

export const BADGES_DEMO: Record<string, { nombre: string; variant: "lemon" | "mint" | "rose" | "grass" | "lavender" }> = {
  rayo: { nombre: "Rayo ⚡", variant: "lemon" },
  generoso: { nombre: "El Generoso 🌻", variant: "mint" },
  fantasma: { nombre: "El Fantasma 👻", variant: "rose" },
  jardinero: { nombre: "Jardinero 🌱", variant: "grass" },
  alcalde: { nombre: "Alcalde 🏅", variant: "lavender" },
};

const MIEMBROS: Record<string, MiembroDemo> = {
  ana: { id: "ana", nombre: "Ana", usuario: "ana", emoji: "🐻", nivel: 3, xp: 120, xpSiguiente: 250, estado: "clean", badges: ["jardinero"] },
  ferni: { id: "ferni", nombre: "Ferni", usuario: "ferni", emoji: "🦊", nivel: 5, xp: 90, xpSiguiente: 400, estado: "clean", badges: ["rayo", "generoso"] },
  caro: { id: "caro", nombre: "Caro", usuario: "caro", emoji: "🐰", nivel: 2, xp: 60, xpSiguiente: 175, estado: "mild", badges: [] },
  beto: { id: "beto", nombre: "Beto", usuario: "beto", emoji: "🐸", nivel: 1, xp: 30, xpSiguiente: 100, estado: "rekt", badges: ["fantasma"] },
  luis: { id: "luis", nombre: "Luis", usuario: "luis", emoji: "🦉", nivel: 4, xp: 200, xpSiguiente: 325, estado: "clean", badges: ["alcalde"] },
  mari: { id: "mari", nombre: "Mari", usuario: "mari", emoji: "🐱", nivel: 2, xp: 140, xpSiguiente: 175, estado: "rekt", badges: [] },
};

function miembros(...ids: string[]): MiembroDemo[] {
  return ids.map((id) => ({ ...(MIEMBROS[id] as MiembroDemo) }));
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
  return [
    {
      id: "oaxaca",
      nombre: "Viaje a Oaxaca",
      icono: "🌮",
      miembros: miembros(...oaxaca),
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
      miembros: miembros(...roomies),
      gastos: [
        gasto({ id: "r1", descripcion: "Renta de octubre", categoria: "hogar", totalCentavos: 900000, pagadoPor: "luis", participantes: roomies, saldados: ["ana"], haceHoras: 60 }, ahora),
        gasto({ id: "r2", descripcion: "Súper de la semana", categoria: "super", totalCentavos: 114590, pagadoPor: "ana", participantes: roomies, saldados: ["luis"], haceHoras: 30 }, ahora),
        gasto({ id: "r3", descripcion: "Luz", categoria: "hogar", totalCentavos: 48000, pagadoPor: "mari", participantes: roomies, saldados: ["ana", "luis"], haceHoras: 10 }, ahora),
      ],
    },
  ];
}
