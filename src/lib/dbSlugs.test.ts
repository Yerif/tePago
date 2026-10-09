import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BASE_SLUGS } from "@/lib/game/apariencia";
import { BADGE_SLUGS } from "@/lib/game/badges";
import { SKIN_SLUGS } from "@/lib/game/skins";
import { CATEGORIAS } from "@/lib/categorias";

/** Las listas cerradas del esquema SQL deben coincidir con las constantes de TypeScript (CLAUDE.md §6: catálogos en `lib/`). */
const migracion = readFileSync(join(process.cwd(), "supabase/migrations/20261009000000_esquema_inicial.sql"), "utf8");

function listasDe(columna: string): string[][] {
  const re = new RegExp(`check \\(${columna} in \\(([^)]*)\\)`, "g");
  return [...migracion.matchAll(re)].map((m) => [...(m[1] ?? "").matchAll(/'([^']+)'/g)].map((x) => x[1] ?? ""));
}

describe("esquema SQL ↔ constantes de lib/", () => {
  it.each([
    ["avatar_base", BASE_SLUGS],
    ["skin_activo", SKIN_SLUGS],
    ["skin_slug", SKIN_SLUGS],
    ["badge_slug", BADGE_SLUGS],
    ["categoria", CATEGORIAS],
  ] as const)("%s coincide", (columna, esperado) => {
    const listas = listasDe(columna);
    expect(listas.length).toBeGreaterThan(0);
    for (const l of listas) expect(l).toEqual([...esperado]);
  });
});
