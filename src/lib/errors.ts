/** Códigos de error de toda la app: un solo catálogo (CLAUDE.md §12). */
export const ErrorCode = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  CONFLICT: "CONFLICT",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  RATE_LIMITED: "RATE_LIMITED",
  AI_INVALID_OUTPUT: "AI_INVALID_OUTPUT",
  AI_UNAVAILABLE: "AI_UNAVAILABLE",
  INTERNAL: "INTERNAL",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

interface DefinicionError {
  status: number;
  /** Mensaje seguro para mostrar; nunca incluye detalles internos. */
  message: string;
}

export const DEFINICIONES: Record<ErrorCode, DefinicionError> = {
  UNAUTHENTICATED: { status: 401, message: "Inicia sesión para continuar." },
  FORBIDDEN: { status: 403, message: "No tienes permiso para hacer esto." },
  NOT_FOUND: { status: 404, message: "No encontramos lo que buscas." },
  VALIDATION: { status: 400, message: "Hay datos que no son válidos. Revísalos e inténtalo otra vez." },
  CONFLICT: { status: 409, message: "Eso ya cambió. Actualiza e inténtalo otra vez." },
  PAYLOAD_TOO_LARGE: { status: 413, message: "El archivo es demasiado grande." },
  RATE_LIMITED: { status: 429, message: "Vas muy rápido. Espera un poco e inténtalo otra vez." },
  AI_INVALID_OUTPUT: { status: 502, message: "No pudimos leerlo. Captúralo a mano." },
  AI_UNAVAILABLE: { status: 503, message: "El asistente no está disponible. Captúralo a mano." },
  INTERNAL: { status: 500, message: "Algo salió mal de nuestro lado. Inténtalo otra vez." },
};

export interface AppErrorOptions {
  /** Reemplaza el mensaje por defecto; debe ser seguro para mostrarse. */
  message?: string;
  /** Solo para logs: nunca sale en la respuesta. */
  cause?: unknown;
  retryAfterSec?: number;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryAfterSec?: number;

  constructor(code: ErrorCode, opciones: AppErrorOptions = {}) {
    super(opciones.message ?? DEFINICIONES[code].message, { cause: opciones.cause });
    this.name = "AppError";
    this.code = code;
    this.status = DEFINICIONES[code].status;
    this.retryAfterSec = opciones.retryAfterSec;
  }
}

export interface ErrorBody {
  error: { code: ErrorCode; message: string; requestId: string };
}

export function generarRequestId(): string {
  return `req_${globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

/** Cualquier valor lanzado se vuelve un AppError; lo desconocido es INTERNAL sin filtrar su mensaje. */
export function normalizarError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  return new AppError(ErrorCode.INTERNAL, { cause: err });
}

export function errorBody(err: AppError, requestId: string): ErrorBody {
  return { error: { code: err.code, message: err.message, requestId } };
}

export function errorResponse(err: unknown, requestId: string): Response {
  const app = normalizarError(err);
  const headers: Record<string, string> = { "x-request-id": requestId };
  if (app.retryAfterSec !== undefined) headers["retry-after"] = String(Math.ceil(app.retryAfterSec));
  return Response.json(errorBody(app, requestId), { status: app.status, headers });
}
