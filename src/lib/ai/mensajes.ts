import { B1 } from "./prompts/b1";
import { B3 } from "./prompts/b3";
import { B4 } from "./prompts/b4";
import { B5 } from "./prompts/b5";
import { renderUsuario } from "./prompts/render";
import { limpiarCampo, limpiarParaPrompt } from "./sanitizar";

/**
 * Armadores del turno de usuario. Todo dato variable pasa por `limpiarParaPrompt`/`limpiarCampo` antes de
 * entrar a la plantilla, y a Anthropic solo viajan alias, nombres visibles y @usuario: nunca ids ni emails.
 */
export interface MiembroPrompt {
  /** m1, m2… (m1 es siempre quien escribe). */
  alias: string;
  nombre: string;
  usuario: string;
}

export interface RenglonPrompt {
  /** i1, i2… */
  alias: string;
  cantidad: number;
  nombre: string;
  /** Monto como texto, ej. "180.00". */
  importe: string;
}

function lineasMiembros(miembros: readonly MiembroPrompt[]): string {
  return miembros
    .map((m, i) => {
      const base = `${limpiarCampo(m.alias, 4)} | ${limpiarCampo(m.nombre, 40)} (@${limpiarCampo(m.usuario, 30)})`;
      return i === 0 ? `${base} | quien escribe` : base;
    })
    .join("\n");
}

export function mensajeB1(entrada: { miembros: readonly MiembroPrompt[]; texto: string }): string {
  return renderUsuario(B1, { miembros: lineasMiembros(entrada.miembros), texto: limpiarParaPrompt(entrada.texto, 500) });
}

export function mensajeB3(entrada: {
  miembros: readonly MiembroPrompt[];
  items: readonly RenglonPrompt[];
  texto: string;
}): string {
  const items = entrada.items
    .map((r) => `${limpiarCampo(r.alias, 4)} | ${r.cantidad} × ${limpiarCampo(r.nombre, 60)} | ${limpiarCampo(r.importe, 12)}`)
    .join("\n");
  return renderUsuario(B3, {
    miembros: lineasMiembros(entrada.miembros),
    items,
    texto: limpiarParaPrompt(entrada.texto, 500),
  });
}

export function mensajeB5(entrada: { descripcion: string; items: readonly string[] }): string {
  const items = entrada.items.slice(0, 15).map((n) => limpiarCampo(n, 40)).filter(Boolean);
  return renderUsuario(B5, {
    descripcion: limpiarParaPrompt(entrada.descripcion, 100),
    items: items.length > 0 ? items.join(", ") : "(sin detalle)",
  });
}

/** Datos agregados de la semana, ya formateados por el servidor: el modelo no calcula ni formatea (B4). */
export interface DatosSemana {
  nombre: string;
  semana: string;
  nivel: number;
  subio_de_nivel: boolean;
  xp_ganada: number;
  estado_personaje: "radiante" | "apagado" | "deteriorado";
  gastos_registrados: number;
  deudas_saldadas: number;
  saldadas: { a: string; monto: string; en: string }[];
  deudas_pendientes: number;
  pendientes: { a: string; monto: string; desde: string }[];
  te_deben: { quien: string; monto: string }[];
  badges_nuevos: string[];
  badges_perdidos: string[];
  destacados: string[];
}

/** JSON con las llaves en orden fijo y todo texto limpio; es lo que recibe el modelo y contra lo que se validan las cifras. */
export function serializarDatosSemana(d: DatosSemana): string {
  const t = (s: string) => limpiarCampo(s, 80);
  return JSON.stringify({
    nombre: t(d.nombre),
    semana: t(d.semana),
    nivel: d.nivel,
    subio_de_nivel: d.subio_de_nivel,
    xp_ganada: d.xp_ganada,
    estado_personaje: d.estado_personaje,
    gastos_registrados: d.gastos_registrados,
    deudas_saldadas: d.deudas_saldadas,
    saldadas: d.saldadas.map((x) => ({ a: t(x.a), monto: t(x.monto), en: t(x.en) })),
    deudas_pendientes: d.deudas_pendientes,
    pendientes: d.pendientes.map((x) => ({ a: t(x.a), monto: t(x.monto), desde: t(x.desde) })),
    te_deben: d.te_deben.map((x) => ({ quien: t(x.quien), monto: t(x.monto) })),
    badges_nuevos: d.badges_nuevos.map(t),
    badges_perdidos: d.badges_perdidos.map(t),
    destacados: d.destacados.map(t),
  });
}

export function mensajeB4(datosSerializados: string): string {
  return renderUsuario(B4, { datos: datosSerializados });
}
