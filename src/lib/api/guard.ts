import { z } from "zod";
import { AppError, ErrorCode, errorResponse, generarRequestId, normalizarError } from "@/lib/errors";
import { createLogger, type Logger } from "@/lib/logger";
import type { ConsumirLimite, ReglaLimite } from "./limitador";

/**
 * Plantilla obligatoria de toda API route (CLAUDE.md §0, regla 4). Orden fijo, y cada paso corta al fallar:
 *
 *   requestId → sesión (401) → Zod del body/query (400/413) → pertenencia al grupo (404) → rate limit (429) → handler
 *
 * La verificación de pertenencia ES el tenant check de la request: quien no es miembro recibe lo mismo que si el
 * grupo no existiera (404), para no revelar qué grupos hay. El rate limit va DESPUÉS, así un no-miembro no gasta cuota.
 * Las dependencias (sesión, membresía, límites) se inyectan: aquí no hay Supabase ni Next, solo la política.
 */
export interface DepsGuard {
  obtenerSesion: (request: Request) => Promise<{ userId: string } | null>;
  esMiembro: (userId: string, grupoId: string) => Promise<boolean>;
  consumirLimite: ConsumirLimite;
  /** Devuelve `CRON_SECRET`; se lee en cada llamada para no fijarlo en el arranque. */
  cronSecret?: () => string | undefined;
  log?: Logger;
  generarRequestId?: () => string;
  ahora?: () => number;
}

export type Params = Record<string, string>;
export type RutaNext = { params: Promise<Params> | Params };

export interface LimitesGuard {
  /** Nombre del endpoint: forma parte de la llave (p. ej. "smart-split"). */
  nombre: string;
  usuario?: ReglaLimite;
  /** Requiere `grupo` en las opciones. */
  grupo?: ReglaLimite;
  ip?: ReglaLimite;
}

export interface OpcionesGuard<B, Q> {
  body?: z.ZodType<B>;
  query?: z.ZodType<Q>;
  /** Cómo saber a qué grupo se refiere la request. Si se define, la pertenencia se verifica siempre. */
  grupo?: (entrada: { params: Params; body: B; query: Q }) => string | undefined;
  limites?: LimitesGuard;
  /** Tope del body en bytes (default 100 KB). */
  maxBytes?: number;
}

export interface ContextoGuard<B, Q> {
  request: Request;
  userId: string;
  groupId: string | null;
  body: B;
  query: Q;
  params: Params;
  requestId: string;
  log: Logger;
}

export interface ContextoCron {
  request: Request;
  requestId: string;
  log: Logger;
}

type Resultado = Response | unknown;
const MAX_BYTES_POR_DEFECTO = 100 * 1024;
/** Un id de grupo más largo que esto no puede ser válido: ni siquiera se le pregunta a la base de datos. */
const MAX_ID = 128;

/** IP del cliente. En Vercel `x-forwarded-for` lo fija la plataforma; se toma el primer valor. */
export function ipDe(request: Request): string {
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const reenviada = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || "desconocida";
}

/** Igualdad en tiempo constante (no se corta en el primer carácter distinto ni por longitud). */
export function igualesEnTiempoConstante(a: string, b: string): boolean {
  let diferencia = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diferencia |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diferencia === 0;
}

async function leerBody<B>(request: Request, schema: z.ZodType<B>, maxBytes: number): Promise<B> {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new AppError(ErrorCode.PAYLOAD_TOO_LARGE);
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > maxBytes) throw new AppError(ErrorCode.PAYLOAD_TOO_LARGE);
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch (cause) {
    throw new AppError(ErrorCode.VALIDATION, { cause });
  }
  const r = schema.safeParse(json);
  if (!r.success) throw new AppError(ErrorCode.VALIDATION, { cause: r.error });
  return r.data;
}

function leerQuery<Q>(request: Request, schema: z.ZodType<Q>): Q {
  const r = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!r.success) throw new AppError(ErrorCode.VALIDATION, { cause: r.error });
  return r.data;
}

function conRequestId(respuesta: Response, requestId: string): Response {
  const headers = new Headers(respuesta.headers);
  headers.set("x-request-id", requestId);
  return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers });
}

export function crearGuard(deps: DepsGuard) {
  const ahora = deps.ahora ?? Date.now;
  const nuevoId = deps.generarRequestId ?? generarRequestId;
  const logBase = deps.log ?? createLogger("tenant");

  /** Ciclo común: request id, logs, mapeo de errores. `cuerpo` hace el trabajo y devuelve lo que responderá. */
  async function ejecutar(request: Request, cuerpo: (requestId: string, log: Logger) => Promise<Resultado>): Promise<Response> {
    const requestId = nuevoId();
    const log = logBase.child({ requestId, metodo: request.method, ruta: new URL(request.url).pathname });
    const inicio = ahora();
    try {
      const resultado = await cuerpo(requestId, log);
      const respuesta = resultado instanceof Response ? resultado : resultado === undefined ? new Response(null, { status: 204 }) : Response.json(resultado);
      log.info("api", { status: respuesta.status, ms: ahora() - inicio });
      return conRequestId(respuesta, requestId);
    } catch (e) {
      const app = normalizarError(e);
      if (app.code === ErrorCode.INTERNAL) log.error("api_error", { error: app.cause ?? e, ms: ahora() - inicio });
      else log.warn("api_rechazada", { codigo: app.code, ms: ahora() - inicio });
      return errorResponse(app, requestId);
    }
  }

  function withGuard<B = undefined, Q = undefined>(
    opciones: OpcionesGuard<B, Q>,
    handler: (ctx: ContextoGuard<B, Q>) => Promise<Resultado>,
  ): (request: Request, ruta?: RutaNext) => Promise<Response> {
    if (opciones.limites?.grupo && !opciones.grupo) throw new Error("limites.grupo requiere la opción `grupo`");

    return (request, ruta) =>
      ejecutar(request, async (requestId, log) => {
        // 1. Sesión
        const sesion = await deps.obtenerSesion(request);
        if (!sesion) throw new AppError(ErrorCode.UNAUTHENTICATED);

        // 2. Validación
        const params = (await ruta?.params) ?? {};
        const body = (opciones.body ? await leerBody(request, opciones.body, opciones.maxBytes ?? MAX_BYTES_POR_DEFECTO) : undefined) as B;
        const query = (opciones.query ? leerQuery(request, opciones.query) : undefined) as Q;

        // 3. Pertenencia al grupo (el tenant check)
        let groupId: string | null = null;
        if (opciones.grupo) {
          const id = opciones.grupo({ params, body, query });
          if (!id || id.length > MAX_ID) throw new AppError(ErrorCode.VALIDATION);
          if (!(await deps.esMiembro(sesion.userId, id))) {
            log.warn("no_miembro", { grupo: id });
            throw new AppError(ErrorCode.NOT_FOUND);
          }
          groupId = id;
        }

        // 4. Rate limit (por usuario, por grupo y por IP, según se pida)
        const l = opciones.limites;
        if (l) {
          const reglas: [string, ReglaLimite][] = [];
          if (l.usuario) reglas.push([`${l.nombre}:usuario:${sesion.userId}`, l.usuario]);
          if (l.grupo && groupId) reglas.push([`${l.nombre}:grupo:${groupId}`, l.grupo]);
          if (l.ip) reglas.push([`${l.nombre}:ip:${ipDe(request)}`, l.ip]);
          for (const [llave, regla] of reglas) {
            const r = await deps.consumirLimite(llave, regla);
            if (!r.permitido) throw new AppError(ErrorCode.RATE_LIMITED, { retryAfterSec: r.reintentarEnSeg });
          }
        }

        // 5. Handler
        return handler({ request, userId: sesion.userId, groupId, body, query, params, requestId, log });
      });
  }

  /** Para `/api/cron/*`: solo Vercel Cron, con `Authorization: Bearer ${CRON_SECRET}` (CLAUDE.md §9). */
  function withCronGuard(handler: (ctx: ContextoCron) => Promise<Resultado>): (request: Request) => Promise<Response> {
    return (request) =>
      ejecutar(request, async (requestId, log) => {
        const secreto = deps.cronSecret?.();
        if (!secreto) {
          log.error("cron_sin_secreto", {});
          throw new AppError(ErrorCode.UNAUTHENTICATED);
        }
        const recibido = request.headers.get("authorization") ?? "";
        if (!igualesEnTiempoConstante(recibido, `Bearer ${secreto}`)) throw new AppError(ErrorCode.UNAUTHENTICATED);
        return handler({ request, requestId, log });
      });
  }

  return { withGuard, withCronGuard };
}
