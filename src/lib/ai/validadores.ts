import { parsearMonto, parsearPorcentaje } from "@/lib/splits/formato";
import type { AjusteT, RepartoT } from "./schemas/comun";
import type { B1SalidaT } from "./schemas/b1";
import type { B2SalidaT } from "./schemas/b2";
import type { B3SalidaT } from "./schemas/b3";
import type { B4SalidaT } from "./schemas/b4";

/**
 * Reglas que structured outputs no garantiza (PROMPTS.md B0). La salida de la IA es un dato no confiable
 * (CLAUDE.md §0, regla 8). Un problema nombra el campo y la regla, NUNCA el valor: así el texto del usuario
 * no vuelve a entrar al prompt del retry como instrucción.
 */
export interface Problema {
  ruta: string;
  regla: string;
}

export const MONTO_RE = /^\d{1,7}(\.\d{1,2})?$/;
const MONEDA_RE = /^[A-Z]{3}$/;
const PELIGROSO_RE = /https?:|www\.|[<>]|\p{Cc}/iu;

export function textoLibreSeguro(texto: string): boolean {
  return !PELIGROSO_RE.test(texto);
}

class Colector {
  readonly problemas: Problema[] = [];

  add(ruta: string, regla: string): void {
    this.problemas.push({ ruta, regla });
  }

  monto(ruta: string, valor: string | null): void {
    if (valor !== null && !MONTO_RE.test(valor)) this.add(ruta, "formato de monto");
  }

  texto(ruta: string, valor: string, max: number): void {
    if ([...valor].length > max) this.add(ruta, `longitud máxima ${max}`);
    if (!textoLibreSeguro(valor)) this.add(ruta, "texto no permitido (enlaces, < >, control)");
  }

  entero(ruta: string, valor: number, min: number, max: number): void {
    if (!Number.isInteger(valor) || valor < min || valor > max) this.add(ruta, `entero entre ${min} y ${max}`);
  }

  moneda(valor: string): void {
    if (!MONEDA_RE.test(valor)) this.add("moneda", "código de 3 letras mayúsculas");
  }

  alias(ruta: string, valor: string, validos: ReadonlySet<string>): void {
    if (!validos.has(valor)) this.add(ruta, "alias inexistente");
  }

  reparto(ruta: string, reparto: RepartoT, personas: ReadonlySet<string>): void {
    if (reparto.length === 0) this.add(ruta, "reparto vacío");
    const vistos = new Set<string>();
    reparto.forEach((r, i) => {
      this.alias(`${ruta}[${i}].persona`, r.persona, personas);
      this.entero(`${ruta}[${i}].partes`, r.partes, 1, 99);
      if (vistos.has(r.persona)) this.add(`${ruta}[${i}].persona`, "persona repetida");
      vistos.add(r.persona);
    });
  }

  ajuste(ruta: string, ajuste: AjusteT | null): void {
    if (ajuste === null) return;
    if (ajuste.tipo === "monto") {
      this.monto(`${ruta}.valor`, ajuste.valor);
      return;
    }
    const bp = parsearPorcentaje(ajuste.valor);
    if (bp === null || bp === 0) this.add(`${ruta}.valor`, "porcentaje mayor que 0 y hasta 100");
  }

  noReconocidos(nombres: readonly string[]): void {
    if (nombres.length > 10) this.add("no_reconocidos", "máximo 10 nombres");
    nombres.forEach((n, i) => this.texto(`no_reconocidos[${i}]`, n, 30));
  }
}

export interface ContextoB1 {
  /** Alias de los miembros enviados en el prompt (m1, m2…). */
  miembros: readonly string[];
}

export function validarB1(s: B1SalidaT, ctx: ContextoB1): Problema[] {
  const c = new Colector();
  const miembros = new Set(ctx.miembros);
  c.texto("descripcion", s.descripcion, 60);
  c.moneda(s.moneda);
  c.monto("total", s.total);
  if (s.pagado_por !== null) c.alias("pagado_por", s.pagado_por, miembros);
  if (s.items.length > 30) c.add("items", "máximo 30 items");
  s.items.forEach((it, i) => {
    const ruta = `items[${i}]`;
    c.texto(`${ruta}.nombre`, it.nombre, 60);
    c.entero(`${ruta}.cantidad`, it.cantidad, 1, 99);
    c.monto(`${ruta}.precio_unitario`, it.precio_unitario);
    c.monto(`${ruta}.importe`, it.importe);
    if (it.precio_unitario === null && it.importe === null) {
      c.add(ruta, "necesita precio_unitario o importe");
    } else if (it.precio_unitario !== null && it.importe !== null) {
      const precio = parsearMonto(it.precio_unitario);
      const importe = parsearMonto(it.importe);
      if (precio !== null && importe !== null && precio * it.cantidad !== importe) {
        c.add(ruta, "precio × cantidad no coincide con importe");
      }
    }
    c.reparto(`${ruta}.reparto`, it.reparto, miembros);
  });
  if (s.resto_entre !== null) {
    const vistos = new Set<string>();
    s.resto_entre.forEach((a, i) => {
      c.alias(`resto_entre[${i}]`, a, miembros);
      if (vistos.has(a)) c.add(`resto_entre[${i}]`, "persona repetida");
      vistos.add(a);
    });
  }
  c.ajuste("propina", s.propina);
  c.ajuste("impuestos", s.impuestos);
  c.noReconocidos(s.no_reconocidos);
  if (s.advertencias.includes("no_es_gasto") && (s.items.length > 0 || s.total !== null)) {
    c.add("advertencias", "no_es_gasto exige items vacíos y total null");
  }
  return c.problemas;
}

export function validarB2(s: B2SalidaT): Problema[] {
  const c = new Colector();
  c.texto("descripcion", s.descripcion, 60);
  c.moneda(s.moneda);
  if (s.items.length > 40) c.add("items", "máximo 40 renglones");
  s.items.forEach((it, i) => {
    const ruta = `items[${i}]`;
    c.texto(`${ruta}.nombre`, it.nombre, 60);
    c.entero(`${ruta}.cantidad`, it.cantidad, 1, 99);
    c.monto(`${ruta}.precio_unitario`, it.precio_unitario);
    c.monto(`${ruta}.importe`, it.importe);
  });
  c.monto("subtotal_impreso", s.subtotal_impreso);
  c.monto("propina_cobrada", s.propina_cobrada);
  c.monto("total_impreso", s.total_impreso);
  if (s.impuestos_impresos.length > 5) c.add("impuestos_impresos", "máximo 5 renglones");
  s.impuestos_impresos.forEach((m, i) => c.monto(`impuestos_impresos[${i}]`, m));
  if ((s.advertencias.includes("no_es_ticket") || s.advertencias.includes("ilegible")) && s.items.length > 0) {
    c.add("advertencias", "no_es_ticket e ilegible exigen items vacíos");
  }
  return c.problemas;
}

export interface ContextoB3 {
  miembros: readonly string[];
  /** Alias de los renglones enviados en el prompt (i1, i2…). */
  items: readonly string[];
}

export function validarB3(s: B3SalidaT, ctx: ContextoB3): Problema[] {
  const c = new Colector();
  const miembros = new Set(ctx.miembros);
  const items = new Set(ctx.items);
  const cubiertos = new Map<string, number>();
  const cubrir = (alias: string) => cubiertos.set(alias, (cubiertos.get(alias) ?? 0) + 1);

  s.asignaciones.forEach((a, i) => {
    c.alias(`asignaciones[${i}].item`, a.item, items);
    c.reparto(`asignaciones[${i}].reparto`, a.reparto, miembros);
    cubrir(a.item);
  });
  s.sin_asignar.forEach((alias, i) => {
    c.alias(`sin_asignar[${i}]`, alias, items);
    cubrir(alias);
  });
  for (const alias of ctx.items) {
    const veces = cubiertos.get(alias) ?? 0;
    if (veces === 0) c.add("asignaciones", "un renglón no aparece en asignaciones ni en sin_asignar");
    if (veces > 1) c.add("asignaciones", "un renglón aparece más de una vez");
  }
  if (s.pagado_por !== null) c.alias("pagado_por", s.pagado_por, miembros);
  c.ajuste("propina", s.propina);
  c.noReconocidos(s.no_reconocidos);
  return c.problemas;
}

const NUMERO_RE = /\d[\d,]*(?:\.\d+)?/g;
const MARKDOWN_RE = /[*`[\]#_~]/;

/** Los números de un texto, como tokens completos ("1,240.50", "3"). */
export function numerosDe(texto: string): string[] {
  return texto.match(NUMERO_RE) ?? [];
}

/** `datos` son los DatosSemana serializados que recibió el modelo: todo número de la salida debe estar ahí. */
export function validarB4(s: B4SalidaT, datosSerializados: string): Problema[] {
  const c = new Colector();
  c.texto("titulo", s.titulo, 60);
  c.texto("cuerpo", s.cuerpo, 500);
  for (const campo of ["titulo", "cuerpo"] as const) {
    if (MARKDOWN_RE.test(s[campo])) c.add(campo, "sin markdown ni hashtags");
  }
  const segmentos = [...new Intl.Segmenter("es", { granularity: "grapheme" }).segment(s.emoji)];
  if (segmentos.length !== 1 || !/\p{Extended_Pictographic}/u.test(s.emoji)) c.add("emoji", "un solo emoji");
  const permitidos = new Set(numerosDe(datosSerializados));
  for (const campo of ["titulo", "cuerpo"] as const) {
    if (numerosDe(s[campo]).some((n) => !permitidos.has(n))) c.add(campo, "cifra que no aparece en los datos");
  }
  return c.problemas;
}
