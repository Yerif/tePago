export const NAMESPACES = ["split", "game", "ai", "db", "tenant"] as const;
export type Namespace = (typeof NAMESPACES)[number];
export type Level = "debug" | "info" | "warn" | "error";
export type LogFields = Record<string, unknown>;

export interface LogEntry {
  ts: string;
  level: Level;
  ns: Namespace;
  msg: string;
  [campo: string]: unknown;
}

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  /** Logger nuevo que agrega estos campos a cada línea (p. ej. `requestId`). */
  child(fields: LogFields): Logger;
}

export interface LoggerOptions {
  /** Destino de las líneas; por defecto, la consola. Inyectable para tests. */
  sink?: (entry: LogEntry) => void;
  /** Valor de `debug` (ej. "split,ai" o "*"); por defecto, localStorage / `process.env.DEBUG`. */
  debugConfig?: () => string | null | undefined;
  now?: () => Date;
}

const SENSIBLE = /key|token|secret|password|authorization|cookie|apikey|bearer|image|imagen/i;
const MAX_STRING = 200;
const MAX_DEPTH = 4;

/** Nunca se loguean secretos, imágenes ni el texto completo del usuario (CLAUDE.md §8 y §12). */
export function sanitizar(valor: unknown, depth = 0): unknown {
  if (typeof valor === "string") {
    return valor.length > MAX_STRING ? `${valor.slice(0, MAX_STRING)}…[${valor.length} chars]` : valor;
  }
  if (valor === null || typeof valor !== "object") return valor;
  if (depth >= MAX_DEPTH) return "[profundo]";
  if (valor instanceof Error) return { name: valor.name, message: sanitizar(valor.message, depth + 1) };
  if (Array.isArray(valor)) return valor.slice(0, 20).map((v) => sanitizar(v, depth + 1));
  const salida: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(valor)) {
    salida[k] = SENSIBLE.test(k) ? "[redactado]" : sanitizar(v, depth + 1);
  }
  return salida;
}

/** `config` es una lista separada por comas de namespaces, o "*" para todos. */
export function namespaceActivo(ns: Namespace, config: string | null | undefined): boolean {
  if (!config) return false;
  const activos = config.split(",").map((s) => s.trim());
  return activos.includes("*") || activos.includes(ns);
}

function leerConfigDebug(): string | null | undefined {
  if (typeof window !== "undefined") {
    try {
      return window.localStorage.getItem("debug");
    } catch {
      return null;
    }
  }
  return process.env.DEBUG;
}

function escribirEnConsola(entry: LogEntry): void {
  const { ts, level, ns, msg, ...campos } = entry;
  if (typeof window !== "undefined") {
    console[level](`[${ns}]`, msg, campos);
    return;
  }
  const linea = JSON.stringify({ ts, level, ns, msg, ...campos });
  if (level === "error") console.error(linea);
  else if (level === "warn") console.warn(linea);
  else console.info(linea);
}

export function createLogger(ns: Namespace, opciones: LoggerOptions = {}, base: LogFields = {}): Logger {
  const sink = opciones.sink ?? escribirEnConsola;
  const config = opciones.debugConfig ?? leerConfigDebug;
  const now = opciones.now ?? (() => new Date());

  const emitir = (level: Level, msg: string, fields?: LogFields): void => {
    if (level === "debug" && !namespaceActivo(ns, config())) return;
    const extra = sanitizar({ ...base, ...fields }) as LogFields;
    sink({ ...extra, ts: now().toISOString(), level, ns, msg });
  };

  return {
    debug: (msg, fields) => emitir("debug", msg, fields),
    info: (msg, fields) => emitir("info", msg, fields),
    warn: (msg, fields) => emitir("warn", msg, fields),
    error: (msg, fields) => emitir("error", msg, fields),
    child: (fields) => createLogger(ns, opciones, { ...base, ...fields }),
  };
}
