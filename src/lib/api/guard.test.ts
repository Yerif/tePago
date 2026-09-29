import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AppError, ErrorCode } from "@/lib/errors";
import type { LogEntry } from "@/lib/logger";
import { createLogger } from "@/lib/logger";
import { crearGuard, igualesEnTiempoConstante, ipDe, type DepsGuard } from "./guard";
import { crearLimitadorEnMemoria } from "./limitador";

const GRUPO = "g-1";

/** Entorno de prueba: sesión y membresías falsas, límite en memoria y registro del orden de las llamadas. */
function armar(extra: Partial<DepsGuard> = {}, opciones: { sesion?: string | null; miembros?: Record<string, string[]> } = {}) {
  const orden: string[] = [];
  const logs: LogEntry[] = [];
  const miembros = opciones.miembros ?? { ana: [GRUPO] };
  const limitador = crearLimitadorEnMemoria(() => 0);
  const deps: DepsGuard = {
    obtenerSesion: async () => {
      orden.push("sesion");
      const id = opciones.sesion === undefined ? "ana" : opciones.sesion;
      return id === null ? null : { userId: id };
    },
    esMiembro: async (u, g) => {
      orden.push("miembro");
      return miembros[u]?.includes(g) ?? false;
    },
    consumirLimite: async (llave, regla) => {
      orden.push(`limite:${llave}`);
      return limitador(llave, regla);
    },
    cronSecret: () => "secreto-cron",
    log: createLogger("tenant", { sink: (e) => logs.push(e), debugConfig: () => "*" }),
    generarRequestId: () => "req_test",
    ahora: () => 0,
    ...extra,
  };
  return { ...crearGuard(deps), orden, logs, deps };
}

const post = (cuerpo: unknown, headers: Record<string, string> = {}) =>
  new Request("https://cc.test/api/x", { method: "POST", body: typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo), headers });
const get = (url = "https://cc.test/api/x", headers: Record<string, string> = {}) => new Request(url, { headers });
const cuerpoDe = async (r: Response) => r.json();

const Body = z.object({ groupId: z.string(), monto: z.number() });

describe("orden fijo: sesión → validación → pertenencia → rate limit → handler", () => {
  it("camino feliz: llama al handler con el contexto y devuelve su JSON con x-request-id", async () => {
    const { withGuard, orden } = armar();
    const handler = vi.fn(async (ctx) => ({ ok: true, user: ctx.userId, grupo: ctx.groupId, monto: ctx.body.monto }));
    const ruta = withGuard(
      { body: Body, grupo: ({ body }) => body.groupId, limites: { nombre: "x", usuario: { limite: 5, ventanaSeg: 60 } } },
      handler,
    );
    const res = await ruta(post({ groupId: GRUPO, monto: 5 }));
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toBe("req_test");
    expect(await cuerpoDe(res)).toEqual({ ok: true, user: "ana", grupo: GRUPO, monto: 5 });
    expect(orden).toEqual(["sesion", "miembro", "limite:x:usuario:ana"]);
  });

  it("sin sesión: 401 antes de validar, de consultar membresía o de gastar cuota", async () => {
    const { withGuard, orden } = armar({}, { sesion: null });
    const handler = vi.fn();
    const res = await withGuard({ body: Body, grupo: ({ body }) => body.groupId, limites: { nombre: "x", usuario: { limite: 5, ventanaSeg: 60 } } }, handler)(post("no es json"));
    expect(res.status).toBe(401);
    expect(await cuerpoDe(res)).toEqual({ error: { code: "UNAUTHENTICATED", message: expect.any(String), requestId: "req_test" } });
    expect(orden).toEqual(["sesion"]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("body inválido: 400 antes de consultar membresía y sin gastar cuota", async () => {
    const { withGuard, orden } = armar();
    const handler = vi.fn();
    const ruta = withGuard({ body: Body, grupo: ({ body }) => body.groupId, limites: { nombre: "x", usuario: { limite: 5, ventanaSeg: 60 } } }, handler);
    for (const malo of ["no es json", { groupId: GRUPO }, { groupId: GRUPO, monto: "5" }]) {
      const res = await ruta(post(malo));
      expect(res.status).toBe(400);
      expect((await cuerpoDe(res)).error.code).toBe("VALIDATION");
    }
    expect(orden).toEqual(["sesion", "sesion", "sesion"]);
    expect(handler).not.toHaveBeenCalled();
  });

  it("no miembro: 404 idéntico a un grupo que no existe, sin gastar cuota ni llegar al handler", async () => {
    const { withGuard, orden, logs } = armar({}, { miembros: { ana: ["otro"] } });
    const handler = vi.fn();
    const ruta = withGuard({ body: Body, grupo: ({ body }) => body.groupId, limites: { nombre: "x", usuario: { limite: 5, ventanaSeg: 60 } } }, handler);
    const ajeno = await ruta(post({ groupId: GRUPO, monto: 1 }));
    const inexistente = await ruta(post({ groupId: "no-existe", monto: 1 }));
    expect(ajeno.status).toBe(404);
    expect(await cuerpoDe(ajeno)).toEqual(await cuerpoDe(inexistente)); // mismo cuerpo: no se distingue
    expect(orden.filter((o) => o.startsWith("limite"))).toEqual([]);
    expect(handler).not.toHaveBeenCalled();
    expect(logs.some((l) => l.msg === "no_miembro")).toBe(true); // queda rastro para nosotros, no para el cliente
  });
});

describe("validación", () => {
  it("query: la valida con su schema", async () => {
    const { withGuard } = armar();
    const ruta = withGuard({ query: z.object({ n: z.coerce.number().int().min(1) }) }, async ({ query }) => ({ n: query.n }));
    expect(await cuerpoDe(await ruta(get("https://cc.test/api/x?n=3")))).toEqual({ n: 3 });
    expect((await ruta(get("https://cc.test/api/x?n=0"))).status).toBe(400);
    expect((await ruta(get("https://cc.test/api/x"))).status).toBe(400);
  });

  it("body demasiado grande: 413 por content-length y por tamaño real", async () => {
    const { withGuard } = armar();
    const handler = vi.fn();
    const ruta = withGuard({ body: z.object({ t: z.string() }), maxBytes: 100 }, handler);
    const declarado = await ruta(post({ t: "x" }, { "content-length": "5000" }));
    const real = await ruta(post({ t: "x".repeat(200) }));
    const multibyte = await ruta(post({ t: "ñ".repeat(60) })); // 60 caracteres = 120 bytes
    for (const res of [declarado, real, multibyte]) expect(res.status).toBe(413);
    expect(handler).not.toHaveBeenCalled();
    expect((await ruta(post({ t: "ok" }))).status).toBe(204);
  });

  it("los errores de validación no filtran el detalle ni el valor recibido", async () => {
    const { withGuard } = armar();
    const res = await withGuard({ body: z.object({ pass: z.string().min(30) }) }, vi.fn())(post({ pass: "SECRETO-corto" }));
    expect(JSON.stringify(await cuerpoDe(res))).not.toMatch(/SECRETO|min|too_small/);
  });
});

describe("grupo", () => {
  it("se toma de los params de la ruta (que en Next 15 llegan como Promise)", async () => {
    const { withGuard } = armar();
    const ruta = withGuard({ grupo: ({ params }) => params.groupId }, async ({ groupId }) => ({ groupId }));
    expect(await cuerpoDe(await ruta(get(), { params: Promise.resolve({ groupId: GRUPO }) }))).toEqual({ groupId: GRUPO });
    expect(await cuerpoDe(await ruta(get(), { params: { groupId: GRUPO } }))).toEqual({ groupId: GRUPO });
  });

  it("sin id de grupo, o con uno absurdamente largo, es 400 sin preguntar a la base de datos", async () => {
    const { withGuard, orden } = armar();
    const ruta = withGuard({ grupo: ({ params }) => params.groupId }, vi.fn());
    expect((await ruta(get())).status).toBe(400);
    expect((await ruta(get(), { params: { groupId: "x".repeat(129) } })).status).toBe(400);
    expect(orden).not.toContain("miembro");
  });

  it("sin la opción `grupo` no hay grupo ni consulta de membresía", async () => {
    const { withGuard, orden } = armar();
    const res = await withGuard({}, async ({ groupId }) => ({ groupId }))(get());
    expect(await cuerpoDe(res)).toEqual({ groupId: null });
    expect(orden).toEqual(["sesion"]);
  });

  it("limites.grupo sin `grupo` es un error de configuración inmediato", () => {
    const { withGuard } = armar();
    expect(() => withGuard({ limites: { nombre: "x", grupo: { limite: 1, ventanaSeg: 60 } } }, vi.fn())).toThrow(/grupo/);
  });
});

describe("rate limit", () => {
  const limites = { nombre: "smart-split", usuario: { limite: 2, ventanaSeg: 3600 }, grupo: { limite: 3, ventanaSeg: 3600 }, ip: { limite: 2, ventanaSeg: 3600 } };

  it("bloquea al pasar el límite con 429 y Retry-After", async () => {
    const { withGuard } = armar();
    const ruta = withGuard({ limites: { nombre: "x", usuario: { limite: 2, ventanaSeg: 3600 } } }, async () => ({ ok: 1 }));
    expect((await ruta(get())).status).toBe(200);
    expect((await ruta(get())).status).toBe(200);
    const res = await ruta(get());
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("3600");
    expect((await cuerpoDe(res)).error.code).toBe("RATE_LIMITED");
  });

  it("cuenta por usuario, por grupo (compartido entre miembros) y por IP, cada uno con su llave", async () => {
    const miembros = { ana: [GRUPO], beto: [GRUPO], caro: [GRUPO] };
    const sesiones = ["ana", "ana", "beto", "beto", "caro"];
    let i = 0;
    const { withGuard, orden } = armar({ obtenerSesion: async () => ({ userId: sesiones[i++] as string }) }, { miembros });
    const ruta = withGuard({ grupo: ({ params }) => params.groupId, limites: { ...limites, usuario: { limite: 5, ventanaSeg: 3600 }, ip: { limite: 99, ventanaSeg: 3600 } } }, async () => ({ ok: 1 }));
    const r = { params: { groupId: GRUPO } };
    const estados = [];
    for (let n = 0; n < 5; n++) estados.push((await ruta(get(), r)).status);
    // límite de grupo = 3: la 4ª y 5ª llamadas (de cualquier miembro) se bloquean
    expect(estados).toEqual([200, 200, 200, 429, 429]);
    expect(orden).toContain("limite:smart-split:usuario:ana");
    expect(orden).toContain("limite:smart-split:grupo:g-1");
    expect(orden).toContain("limite:smart-split:ip:99.9.9.9".replace("99.9.9.9", "desconocida"));
  });

  it("la IP viene de x-real-ip o del primer x-forwarded-for", async () => {
    expect(ipDe(get("https://cc.test/", { "x-real-ip": " 1.2.3.4 " }))).toBe("1.2.3.4");
    expect(ipDe(get("https://cc.test/", { "x-forwarded-for": "5.6.7.8, 10.0.0.1" }))).toBe("5.6.7.8");
    expect(ipDe(get())).toBe("desconocida");
    expect(ipDe(get("https://cc.test/", { "x-forwarded-for": " , 10.0.0.1" }))).toBe("desconocida");

    const { withGuard } = armar();
    const ruta = withGuard({ limites: { nombre: "unirse", ip: { limite: 1, ventanaSeg: 3600 } } }, async () => ({ ok: 1 }));
    expect((await ruta(get("https://cc.test/", { "x-real-ip": "1.1.1.1" }))).status).toBe(200);
    expect((await ruta(get("https://cc.test/", { "x-real-ip": "1.1.1.1" }))).status).toBe(429);
    expect((await ruta(get("https://cc.test/", { "x-real-ip": "2.2.2.2" }))).status).toBe(200); // otra IP, otra cuota
  });

  it("si un límite falla no se siguen consumiendo los siguientes", async () => {
    const { withGuard, orden } = armar({ consumirLimite: async (llave) => (orden.push(`limite:${llave}`), { permitido: false, reintentarEnSeg: 7 }) });
    const res = await withGuard({ limites: { nombre: "x", usuario: { limite: 1, ventanaSeg: 1 }, ip: { limite: 1, ventanaSeg: 1 } } }, vi.fn())(get());
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
    expect(orden.filter((o) => o.startsWith("limite"))).toHaveLength(1);
  });
});

describe("handler y errores", () => {
  it("un AppError del handler se responde con su código", async () => {
    const { withGuard } = armar();
    const res = await withGuard({}, async () => {
      throw new AppError(ErrorCode.CONFLICT);
    })(get());
    expect(res.status).toBe(409);
  });

  it("un error inesperado es 500 genérico: no filtra el mensaje y queda en el log con el requestId", async () => {
    const { withGuard, logs } = armar();
    const res = await withGuard({}, async () => {
      throw new Error("password=hunter2 en la fila 3");
    })(get());
    expect(res.status).toBe(500);
    expect(JSON.stringify(await cuerpoDe(res))).not.toContain("hunter2");
    const log = logs.find((l) => l.msg === "api_error");
    expect(log).toMatchObject({ level: "error", requestId: "req_test" });
  });

  it("un AppError INTERNAL lanzado a propósito también es 500 y queda en el log como error", async () => {
    const { withGuard, logs } = armar();
    const res = await withGuard({}, async () => {
      throw new AppError(ErrorCode.INTERNAL);
    })(get());
    expect(res.status).toBe(500);
    expect(logs.find((l) => l.msg === "api_error")).toMatchObject({ level: "error", requestId: "req_test" });
  });

  it("si falla una dependencia (sesión o membresía) también es 500 genérico", async () => {
    const caida = armar({ obtenerSesion: async () => Promise.reject(new Error("supabase caído")) });
    expect((await caida.withGuard({}, vi.fn())(get())).status).toBe(500);
    const sinDb = armar({ esMiembro: async () => Promise.reject(new Error("db")) });
    expect((await sinDb.withGuard({ grupo: () => GRUPO }, vi.fn())(get())).status).toBe(500);
  });

  it("puede devolver un Response propio (se le agrega x-request-id) o nada (204)", async () => {
    const { withGuard } = armar();
    const propio = await withGuard({}, async () => new Response("hola", { status: 201, headers: { "x-otro": "1" } }))(get());
    expect(propio.status).toBe(201);
    expect(propio.headers.get("x-otro")).toBe("1");
    expect(propio.headers.get("x-request-id")).toBe("req_test");
    expect(await propio.text()).toBe("hola");
    const nada = await withGuard({}, async () => undefined)(get());
    expect(nada.status).toBe(204);
  });

  it("registra cada request sin body ni datos del usuario", async () => {
    const { withGuard, logs } = armar();
    await withGuard({ body: Body }, async () => ({ ok: 1 }))(post({ groupId: "secreto-grupo", monto: 123456 }));
    const linea = logs.find((l) => l.msg === "api");
    expect(linea).toMatchObject({ status: 200, requestId: "req_test", metodo: "POST", ruta: "/api/x" });
    expect(JSON.stringify(logs)).not.toMatch(/secreto-grupo|123456/);
  });

  it("genera su propio requestId y usa el reloj real si no se le inyectan", async () => {
    const { withGuard, deps } = armar({ generarRequestId: undefined, ahora: undefined, log: undefined });
    void deps;
    const res = await withGuard({}, async () => ({ ok: 1 }))(get());
    expect(res.headers.get("x-request-id")).toMatch(/^req_[0-9a-f]{16}$/);
  });
});

describe("withCronGuard", () => {
  const ok = { authorization: "Bearer secreto-cron" };

  it("con el secreto correcto ejecuta el handler", async () => {
    const { withCronGuard } = armar();
    const res = await withCronGuard(async () => ({ hecho: true }))(get("https://cc.test/api/cron/x", ok));
    expect(res.status).toBe(200);
    expect(await cuerpoDe(res)).toEqual({ hecho: true });
  });

  it("sin header, con otro secreto o sin el prefijo Bearer: 401 y el handler no corre", async () => {
    const { withCronGuard } = armar();
    const handler = vi.fn();
    const ruta = withCronGuard(handler);
    const intentos: Record<string, string>[] = [{}, { authorization: "Bearer otro" }, { authorization: "secreto-cron" }, { authorization: "bearer secreto-cron" }, { authorization: "Bearer  secreto-cron" }];
    for (const headers of intentos) {
      expect((await ruta(get("https://cc.test/api/cron/x", headers))).status, JSON.stringify(headers)).toBe(401);
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it("si CRON_SECRET no está configurado nadie entra (ni con header vacío) y se avisa en el log", async () => {
    for (const cronSecret of [undefined, () => undefined, () => ""]) {
      const { withCronGuard, logs } = armar({ cronSecret });
      const handler = vi.fn();
      const res = await withCronGuard(handler)(get("https://cc.test/api/cron/x", { authorization: "Bearer " }));
      expect(res.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
      expect(logs.some((l) => l.msg === "cron_sin_secreto")).toBe(true);
    }
  });
});

describe("igualesEnTiempoConstante", () => {
  it("compara valor y longitud", () => {
    expect(igualesEnTiempoConstante("abc", "abc")).toBe(true);
    expect(igualesEnTiempoConstante("", "")).toBe(true);
    expect(igualesEnTiempoConstante("abc", "abd")).toBe(false);
    expect(igualesEnTiempoConstante("abc", "abcd")).toBe(false);
    expect(igualesEnTiempoConstante("abcd", "abc")).toBe(false);
    expect(igualesEnTiempoConstante("", "a")).toBe(false);
  });
});
