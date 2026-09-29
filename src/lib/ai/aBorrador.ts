import type { Ajuste } from "@/lib/splits/itemizado";
import type { BorradorGasto } from "@/lib/splits/borrador";
import { parsearMonto, parsearPorcentaje } from "@/lib/splits/formato";
import type { AjusteT } from "./schemas/comun";
import type { B1SalidaT } from "./schemas/b1";

/**
 * Traduce la salida de B1 (ya validada) al borrador que la persona revisa: alias → ids reales, montos → centavos.
 * Lanza si algo que el validador debió impedir llega aquí (alias desconocido o monto ilegible).
 */
export function borradorDesdeB1(s: B1SalidaT, aliasAUserId: Readonly<Record<string, string>>): BorradorGasto {
  const usuario = (alias: string): string => {
    const id = aliasAUserId[alias];
    if (id === undefined) throw new RangeError("Alias desconocido en la salida de la IA");
    return id;
  };
  const monto = (texto: string): number => {
    const c = parsearMonto(texto);
    if (c === null) throw new RangeError("Monto ilegible en la salida de la IA");
    return c;
  };
  const opcional = (texto: string | null): number | null => (texto === null ? null : monto(texto));
  const ajuste = (a: AjusteT | null): Ajuste | null => {
    if (a === null) return null;
    if (a.tipo === "monto") return { tipo: "monto", centavos: monto(a.valor) };
    const puntosBase = parsearPorcentaje(a.valor);
    if (puntosBase === null) throw new RangeError("Porcentaje ilegible en la salida de la IA");
    return { tipo: "porcentaje", puntosBase };
  };

  return {
    descripcion: s.descripcion,
    categoria: s.categoria,
    moneda: s.moneda,
    totalCentavos: opcional(s.total),
    pagadorId: s.pagado_por === null ? null : usuario(s.pagado_por),
    renglones: s.items.map((it) => ({
      nombre: it.nombre,
      cantidad: it.cantidad,
      precioUnitarioCentavos: opcional(it.precio_unitario),
      importeCentavos: opcional(it.importe),
      reparto: it.reparto.map((r) => ({ userId: usuario(r.persona), partes: r.partes })),
    })),
    restoEntre: s.resto_entre === null ? null : s.resto_entre.map(usuario),
    propina: ajuste(s.propina),
    impuestos: ajuste(s.impuestos),
  };
}
