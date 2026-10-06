import { aplicarPagos, type Pago } from "@/lib/splits/pagos";
import type { GastoCalculable } from "@/lib/splits/tipos";
import { estadoAvatar, ETIQUETA_ESTADO, situacionEnGrupo, type EstadoAvatar } from "./avatar";

type GastoConFecha = GastoCalculable & { fecha: string };

export interface GrupoConGastos {
  id: string;
  gastos: readonly GastoConFecha[];
}

/** Lo que `yo` le debe a una persona, por grupo (deudas directas, como en las filas del Inicio). */
export interface CuentaPorPagar {
  personaId: string;
  porGrupo: readonly { grupoId: string; centavos: number }[];
}

export interface CaminoDeEstado {
  /** Estado de hoy (con los pagos confirmados). */
  actual: EstadoAvatar;
  /** Estado si se confirman los pagos que ya están en camino (pendientes o en disputa). Igual a `actual` si no hay. */
  alConfirmar: EstadoAvatar;
  /** El primer grupo de pagos (en el orden recibido) que mejora el estado, y a cuál estado lleva; null si ya no hay mejora posible. */
  siguiente: { personas: string[]; estado: EstadoAvatar } | null;
  /** Estado si se paga todo lo que falta. */
  todo: EstadoAvatar;
}

const RANGO: Record<EstadoAvatar, number> = { clean: 0, mild: 1, rekt: 2 };

/**
 * "Si pagas a X pasas a Y": simula pagar por completo a las personas de `cuentas` (de la más urgente a la menos) y dice
 * cuál es el primer pago que mejora el estado del personaje y cuál es el estado final. Las personas en `enCamino` (ya
 * pagadas pero por confirmar) se dan por pagadas y no se vuelven a pedir. No modifica nada: es solo para el mensaje del
 * héroe del Inicio (CLAUDE.md §7).
 */
export function caminoDeEstado(
  grupos: readonly GrupoConGastos[],
  yo: string,
  ahora: Date,
  cuentas: readonly CuentaPorPagar[],
  enCamino: readonly string[] = [],
): CaminoDeEstado {
  const estadoCon = (pagos: readonly (Pago & { grupoId: string })[]): EstadoAvatar =>
    estadoAvatar(
      grupos.map((g) =>
        situacionEnGrupo(
          aplicarPagos(
            g.gastos,
            pagos.filter((p) => p.grupoId === g.id),
          ),
          yo,
          ahora,
        ),
      ),
    );
  const pagosA = (c: CuentaPorPagar) => c.porGrupo.map((g) => ({ grupoId: g.grupoId, deudorId: yo, acreedorId: c.personaId, centavos: g.centavos }));

  const actual = estadoCon([]);
  const pagosEnCamino = cuentas.filter((c) => enCamino.includes(c.personaId)).flatMap(pagosA);
  const alConfirmar = estadoCon(pagosEnCamino);

  let acumulados = pagosEnCamino;
  const pendientes = cuentas.filter((c) => !enCamino.includes(c.personaId));
  let siguiente: CaminoDeEstado["siguiente"] = null;
  const personas: string[] = [];
  for (const c of pendientes) {
    acumulados = [...acumulados, ...pagosA(c)];
    personas.push(c.personaId);
    const estado = estadoCon(acumulados);
    if (siguiente === null && RANGO[estado] < RANGO[alConfirmar]) siguiente = { personas: [...personas], estado };
  }
  return { actual, alConfirmar, siguiente, todo: estadoCon(acumulados) };
}

/** "Nico", "Nico y Pau", "Nico, Pau y Ferni"; con más de 3, "Nico, Pau y 5 más" para que la línea quepa. */
const unir = (nombres: readonly string[]): string => {
  if (nombres.length <= 1) return nombres[0] ?? "";
  if (nombres.length > 3) return `${nombres.slice(0, 2).join(", ")} y ${nombres.length - 2} más`;
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
};

/**
 * Las líneas que acompañan al héroe del Inicio: lo que pasa cuando se confirmen los pagos en camino y el siguiente
 * pago que cambia el clima ("Paga a Nico y Pau → Nublado · Todo → Radiante"). Vacío si no hay nada que decir.
 */
export function textoDelCamino(camino: CaminoDeEstado, nombreDe: (personaId: string) => string): string[] {
  const lineas: string[] = [];
  if (camino.alConfirmar !== camino.actual) lineas.push(`Cuando confirmen tus pagos pasarás a «${ETIQUETA_ESTADO[camino.alConfirmar]}» ⏳`);
  if (camino.siguiente) {
    const paga = `Paga a ${unir(camino.siguiente.personas.map(nombreDe))} → «${ETIQUETA_ESTADO[camino.siguiente.estado]}»`;
    lineas.push(camino.todo !== camino.siguiente.estado ? `${paga} · Todo → «${ETIQUETA_ESTADO[camino.todo]}»` : paga);
  }
  return lineas;
}
