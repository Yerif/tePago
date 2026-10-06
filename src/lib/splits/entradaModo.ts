import { parsearMonto, parsearPorcentaje } from "./formato";
import { diferencia, repartirConAjustes, repartirPorMontos, repartirPorPartes, repartirPorPorcentajes } from "./modos";

export type ModoDividir = "igual" | "montos" | "porcentajes" | "partes" | "ajustes";

export interface EntradaModo {
  modo: ModoDividir;
  totalCentavos: number;
  /** Quiénes entran al gasto (en "igual", "partes" y "ajustes"; en "montos" y "porcentajes" también se captura por persona). */
  participantes: readonly string[];
  pagadorId: string;
  /** Lo escrito por persona, tal cual (monto, porcentaje, partes o ajuste). Vacío = sin capturar. */
  valores: Readonly<Record<string, string>>;
}

export interface SalidaModo {
  partes: Record<string, number> | null;
  sinAsignarCentavos: number;
  /** Lo que falta / sobra frente al objetivo, en la unidad del modo (centavos o puntos base). */
  faltan: number;
  sobran: number;
  puedeGuardar: boolean;
  /** Texto cálido para mostrar en vivo; null si todo va bien. */
  mensaje: string | null;
}

const VACIA: SalidaModo = { partes: null, sinAsignarCentavos: 0, faltan: 0, sobran: 0, puedeGuardar: false, mensaje: null };

function leer<T>(participantes: readonly string[], valores: Readonly<Record<string, string>>, parsear: (t: string) => T | null, vacio: T) {
  const fuera: Record<string, T> = {};
  let invalido = false;
  for (const id of participantes) {
    const texto = (valores[id] ?? "").trim();
    if (texto === "") fuera[id] = vacio;
    else {
      const v = parsear(texto);
      if (v === null) invalido = true;
      else fuera[id] = v;
    }
  }
  return { fuera, invalido };
}

const aEnteroNoNegativo = (t: string): number | null => (/^\d{1,3}$/.test(t) ? Number(t) : null);
const aAjuste = (t: string): number | null => {
  const negativo = t.startsWith("-") || t.startsWith("−");
  const monto = parsearMonto(negativo ? t.slice(1) : t.replace(/^\+/, ""));
  return monto === null ? null : negativo ? -monto : monto;
};

/**
 * Convierte lo que la persona escribe en cada modo en un reparto, más el estado en vivo
 * ("Faltan $X", "Te pasaste", "Llevan N %"). Nunca lanza: los errores salen como `mensaje`.
 * "Montos" nunca bloquea por faltar: lo que falta queda sin asignar con el pagador (CLAUDE.md §7).
 */
export function calcularModo(e: EntradaModo): SalidaModo {
  if (e.totalCentavos <= 0 || e.participantes.length === 0) return VACIA;
  const ids = e.participantes;

  if (e.modo === "montos") {
    const { fuera, invalido } = leer(ids, e.valores, parsearMonto, 0);
    if (invalido) return { ...VACIA, mensaje: "Revisa los montos: usa números como 120 o 99.50." };
    const asignado = Object.values(fuera).reduce((a, b) => a + b, 0);
    const { faltan, sobran } = diferencia(e.totalCentavos, asignado);
    if (sobran > 0) return { ...VACIA, sobran, mensaje: "Te pasaste del total." };
    const r = repartirPorMontos(e.totalCentavos, fuera);
    return { partes: r.partes, sinAsignarCentavos: r.sinAsignarCentavos, faltan, sobran: 0, puedeGuardar: asignado > 0, mensaje: null };
  }

  if (e.modo === "porcentajes") {
    const { fuera, invalido } = leer(ids, e.valores, parsearPorcentaje, 0);
    if (invalido) return { ...VACIA, mensaje: "Revisa los porcentajes: números de 0 a 100." };
    const asignado = Object.values(fuera).reduce((a, b) => a + b, 0);
    const { faltan, sobran } = diferencia(10_000, asignado);
    if (faltan > 0 || sobran > 0) return { ...VACIA, faltan, sobran, mensaje: sobran > 0 ? "Te pasaste del 100 %." : null };
    return { partes: repartirPorPorcentajes(e.totalCentavos, fuera, e.pagadorId).partes, sinAsignarCentavos: 0, faltan: 0, sobran: 0, puedeGuardar: true, mensaje: null };
  }

  if (e.modo === "partes") {
    const { fuera, invalido } = leer(ids, e.valores, aEnteroNoNegativo, 1);
    if (invalido) return { ...VACIA, mensaje: "Las partes son números enteros como 1, 2 o 3." };
    if (Object.values(fuera).every((p) => p === 0)) return { ...VACIA, mensaje: "Alguien debe llevar al menos 1 parte." };
    return { partes: repartirPorPartes(e.totalCentavos, fuera, e.pagadorId).partes, sinAsignarCentavos: 0, faltan: 0, sobran: 0, puedeGuardar: true, mensaje: null };
  }

  // ajustes
  const { fuera, invalido } = leer(ids, e.valores, aAjuste, 0);
  if (invalido) return { ...VACIA, mensaje: "Revisa los ajustes: usa +60, -30 o 0." };
  const conAjuste = Object.fromEntries(Object.entries(fuera).filter(([, a]) => a !== 0));
  try {
    const r = repartirConAjustes(e.totalCentavos, ids, conAjuste, e.pagadorId);
    return { partes: r.partes, sinAsignarCentavos: 0, faltan: 0, sobran: 0, puedeGuardar: true, mensaje: null };
  } catch {
    return { ...VACIA, mensaje: "Los ajustes no caben en el total." };
  }
}

/** Atajo "repartir lo que falta": el porcentaje que le tocaría a `destinoId` para llegar a 100 % (null si no se puede). */
export function completarPorcentajes(participantes: readonly string[], valores: Readonly<Record<string, string>>, destinoId: string): string | null {
  let otros = 0;
  for (const id of participantes) {
    if (id === destinoId) continue;
    const texto = (valores[id] ?? "").trim();
    if (texto === "") continue;
    const p = parsearPorcentaje(texto);
    if (p === null) return null;
    otros += p;
  }
  if (otros > 10_000) return null;
  const resto = 10_000 - otros;
  const entero = Math.floor(resto / 100);
  const dec = resto % 100;
  return dec === 0 ? String(entero) : `${entero}.${String(dec).padStart(2, "0").replace(/0$/, "")}`;
}
