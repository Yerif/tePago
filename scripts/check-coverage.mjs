// 100 % obligatorio en lo que maneja dinero (CLAUDE.md §7).
// Los umbrales de Vitest no se aplican en la versión instalada, así que se verifican aquí.
import { readFileSync } from "node:fs";

const OBLIGATORIOS = ["/src/lib/splits/", "/src/lib/tiempo.ts"];
const resumen = JSON.parse(readFileSync("coverage/coverage-summary.json", "utf8"));

const archivos = Object.entries(resumen).filter(([ruta]) => OBLIGATORIOS.some((o) => ruta.includes(o)));
if (archivos.length === 0) {
  process.stderr.write("check-coverage: no se encontró ningún archivo obligatorio en el reporte\n");
  process.exit(1);
}

const fallos = [];
for (const [ruta, m] of archivos) {
  for (const metrica of ["lines", "branches", "functions", "statements"]) {
    if (m[metrica].pct !== 100) fallos.push(`${ruta.split("/src/")[1]} · ${metrica} ${m[metrica].pct}%`);
  }
}
if (fallos.length > 0) {
  process.stderr.write(`check-coverage: falta cobertura al 100 %:\n  ${fallos.join("\n  ")}\n`);
  process.exit(1);
}
process.stdout.write(`check-coverage: ${archivos.length} archivos al 100 % ✔\n`);
