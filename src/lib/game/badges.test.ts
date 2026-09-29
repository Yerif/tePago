import { describe, expect, it } from "vitest";
import {
  BADGE_SLUGS,
  BADGES,
  claveMes,
  diferenciaBadges,
  evaluarBadges,
  type BadgesMerecidos,
  type DeudaBadge,
  type GastoBadge,
} from "./badges";

const ahora = new Date("2026-09-29T12:00:00Z");
const hace = (h: number) => new Date(ahora.getTime() - h * 3_600_000).toISOString();
const sumarHoras = (iso: string, h: number) => new Date(new Date(iso).getTime() + h * 3_600_000).toISOString();

/** Deuda de `userId` que nació hace `creadaHace` h y se saldó `saldadaTras` h después (null = sigue activa). */
const deuda = (userId: string, creadaHace: number, saldadaTras: number | null): DeudaBadge => {
  const creadaEn = hace(creadaHace);
  return { userId, creadaEn, saldadaEn: saldadaTras === null ? null : sumarHoras(creadaEn, saldadaTras) };
};
const varias = (n: number, ...args: Parameters<typeof deuda>) => Array.from({ length: n }, () => deuda(...args));
const gasto = (id: string, pagadoPor: string, totalCentavos: number, fecha: string): GastoBadge => ({ id, pagadoPor, totalCentavos, fecha });
const evaluar = (gastos: GastoBadge[] = [], deudas: DeudaBadge[] = []) => evaluarBadges({ gastos, deudas, ahora });

describe("catálogo (CLAUDE.md §7)", () => {
  it("tiene los 6 badges con sus nombres", () => {
    expect([...BADGE_SLUGS]).toEqual(["rayo", "generoso", "fantasma", "jardinero", "alcalde", "mecenas"]);
    expect(BADGES.rayo.nombre).toBe("Rayo ⚡");
    expect(BADGES.generoso.nombre).toBe("El Generoso 🌻");
    expect(BADGES.fantasma.nombre).toBe("El Fantasma 👻");
    expect(BADGES.jardinero.nombre).toBe("Jardinero 🌱");
    expect(BADGES.alcalde.nombre).toBe("Alcalde 🏅");
    expect(BADGES.mecenas.nombre).toBe("El Mecenas 🎩");
  });

  it("solo Fantasma, Generoso y Mecenas se pueden perder", () => {
    expect(BADGE_SLUGS.filter((s) => BADGES[s].revocable)).toEqual(["generoso", "fantasma", "mecenas"]);
  });
});

describe("claveMes", () => {
  it("usa el mes de México, no el UTC", () => {
    expect(claveMes("2026-10-01T03:00:00Z")).toBe("2026-09"); // 30 sep 21:00 en CDMX
    expect(claveMes("2026-10-01T06:00:00Z")).toBe("2026-10"); // 1 oct 00:00 en CDMX
    expect(claveMes("2026-10-01T03:00:00Z", "UTC")).toBe("2026-10");
  });
});

describe("rayo: 5 deudas saldadas en menos de 24 h", () => {
  it("5 sí, 4 no", () => {
    expect(evaluar([], varias(5, "ana", 100, 10)).rayo).toEqual(["ana"]);
    expect(evaluar([], varias(4, "ana", 100, 10)).rayo).toEqual([]);
  });

  it("borde: 23.99 h cuenta y 24 h exactas no", () => {
    expect(evaluar([], varias(5, "ana", 100, 23.99)).rayo).toEqual(["ana"]);
    expect(evaluar([], varias(5, "ana", 100, 24)).rayo).toEqual([]);
  });

  it("las deudas activas y las lentas no cuentan, y cada persona cuenta por separado", () => {
    const deudas = [...varias(4, "ana", 100, 5), deuda("ana", 100, 30), deuda("ana", 100, null), ...varias(5, "beto", 100, 1)];
    expect(evaluar([], deudas).rayo).toEqual(["beto"]);
  });
});

describe("jardinero (5) y alcalde (10): pagos a tiempo (≤ 72 h)", () => {
  it("5 pagos a tiempo dan Jardinero; 10 dan también Alcalde", () => {
    const cinco = evaluar([], varias(5, "ana", 200, 40));
    expect(cinco.jardinero).toEqual(["ana"]);
    expect(cinco.alcalde).toEqual([]);
    const diez = evaluar([], varias(10, "ana", 200, 40));
    expect(diez.jardinero).toEqual(["ana"]);
    expect(diez.alcalde).toEqual(["ana"]);
    expect(evaluar([], varias(9, "ana", 200, 40)).alcalde).toEqual([]);
  });

  it("borde: exactamente 72 h sigue siendo a tiempo; 72.01 h no", () => {
    expect(evaluar([], varias(5, "ana", 200, 72)).jardinero).toEqual(["ana"]);
    expect(evaluar([], varias(5, "ana", 200, 72.01)).jardinero).toEqual([]);
  });
});

describe("fantasma: deuda activa de más de 7 días", () => {
  it("más de 168 h activa sí; exactamente 168 h no; saldada no", () => {
    expect(evaluar([], [deuda("beto", 200, null)]).fantasma).toEqual(["beto"]);
    expect(evaluar([], [deuda("beto", 168, null)]).fantasma).toEqual([]);
    expect(evaluar([], [deuda("beto", 200, 190)]).fantasma).toEqual([]);
  });

  it("una persona con varias deudas viejas aparece una vez; el resultado va ordenado", () => {
    const deudas = [deuda("caro", 300, null), deuda("beto", 200, null), deuda("beto", 250, null)];
    expect(evaluar([], deudas).fantasma).toEqual(["beto", "caro"]);
  });
});

describe("generoso: más gastos pagados este mes", () => {
  it("con empate en cantidad gana quien sumó más dinero, y el mes anterior no cuenta", () => {
    const gastos = [
      gasto("e1", "ferni", 124000, hace(20)),
      gasto("e2", "caro", 86050, hace(44)),
      gasto("e3", "ana", 480000, hace(120)),
      gasto("e4", "beto", 38000, hace(6)),
      gasto("e0", "beto", 999999, "2026-08-15T18:00:00Z"), // agosto
    ];
    expect(evaluar(gastos).generoso).toEqual(["ana"]);
  });

  it("la cantidad de gastos pesa más que el monto", () => {
    const gastos = [gasto("a", "ana", 5000, hace(5)), gasto("b", "ana", 5000, hace(10)), gasto("c", "ferni", 900000, hace(20))];
    expect(evaluar(gastos).generoso).toEqual(["ana"]);
  });

  it("si empatan en cantidad y en dinero, comparten el badge", () => {
    const gastos = [gasto("a", "ferni", 5000, hace(5)), gasto("b", "caro", 5000, hace(10))];
    expect(evaluar(gastos).generoso).toEqual(["caro", "ferni"]);
  });

  it("sin gastos este mes, nadie; el corte de mes es el de México", () => {
    expect(evaluar([gasto("a", "ana", 5000, "2026-08-31T20:00:00Z")]).generoso).toEqual([]);
    expect(evaluar([gasto("a", "ana", 5000, "2026-09-01T03:00:00Z")]).generoso).toEqual([]); // 31 ago 21:00 CDMX
    expect(evaluar([gasto("a", "ana", 5000, "2026-09-01T06:00:00Z")]).generoso).toEqual(["ana"]); // 1 sep 00:00 CDMX
    expect(evaluar([]).generoso).toEqual([]);
  });
});

describe("mecenas: pagó la cuenta más grande del grupo", () => {
  it("toma el gasto mayor de todo el historial", () => {
    const gastos = [gasto("e1", "ferni", 124000, hace(20)), gasto("e0", "beto", 999999, "2026-08-15T18:00:00Z"), gasto("e3", "ana", 480000, hace(120))];
    expect(evaluar(gastos).mecenas).toEqual(["beto"]);
  });

  it("los empates comparten el badge (una vez por persona) y sin gastos no hay nadie", () => {
    const gastos = [gasto("a", "caro", 5000, hace(5)), gasto("b", "ferni", 5000, hace(6)), gasto("c", "caro", 5000, hace(7))];
    expect(evaluar(gastos).mecenas).toEqual(["caro", "ferni"]);
    expect(evaluar([]).mecenas).toEqual([]);
    expect(evaluar([gasto("a", "ana", 0, hace(1))]).mecenas).toEqual([]);
  });
});

describe("evaluarBadges: entradas inválidas", () => {
  it("rechaza fechas que no se pueden leer", () => {
    expect(() => evaluar([], [{ userId: "a", creadaEn: "ayer", saldadaEn: null }])).toThrow(RangeError);
    expect(() => evaluar([], [{ userId: "a", creadaEn: hace(5), saldadaEn: "mañana" }])).toThrow(RangeError);
  });
});

describe("diferenciaBadges: lo que el job debe escribir", () => {
  const vacio: BadgesMerecidos = { rayo: [], generoso: [], fantasma: [], jardinero: [], alcalde: [], mecenas: [] };

  it("otorga lo merecido que aún no está activo", () => {
    const r = diferenciaBadges([{ userId: "ana", slug: "rayo" }], { ...vacio, rayo: ["ana", "beto"], jardinero: ["ana"] });
    expect(r.otorgar).toEqual([
      { userId: "beto", slug: "rayo" },
      { userId: "ana", slug: "jardinero" },
    ]);
    expect(r.revocar).toEqual([]);
  });

  it("revoca solo los badges revocables que ya no se merecen", () => {
    const activos = [
      { userId: "ana", slug: "fantasma" as const },
      { userId: "ana", slug: "rayo" as const },
      { userId: "beto", slug: "generoso" as const },
      { userId: "caro", slug: "mecenas" as const },
    ];
    const r = diferenciaBadges(activos, { ...vacio, generoso: ["beto"], mecenas: ["ferni"] });
    expect(r.revocar).toEqual([
      { userId: "ana", slug: "fantasma" },
      { userId: "caro", slug: "mecenas" },
    ]);
    expect(r.otorgar).toEqual([{ userId: "ferni", slug: "mecenas" }]);
  });

  it("sin cambios no hace nada", () => {
    expect(diferenciaBadges([{ userId: "ana", slug: "alcalde" }], { ...vacio, alcalde: ["ana"] })).toEqual({ otorgar: [], revocar: [] });
  });
});
