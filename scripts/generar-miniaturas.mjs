// Genera public/personajes/{base}-{estado}.png desde el MISMO modelo 3D (/dev/personaje/captura).
// Uso: con la app corriendo en modo dev/preview (npm run dev), `npm run personajes:miniaturas`.
// Variables: BASE_URL (default http://localhost:3000), PW_CHROMIUM (ruta a Chromium si no es el de Playwright).
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASES = ["persona-sol", "persona-luna", "persona-nube", "oso", "zorro", "conejo", "rana", "gato", "buho"];
const ESTADOS = ["clean", "mild", "rekt"];
const URL_BASE = process.env.BASE_URL ?? "http://localhost:3000";

mkdirSync("public/personajes", { recursive: true });
const navegador = await chromium.launch({
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
});
const pagina = await navegador.newPage({ viewport: { width: 256, height: 256 }, deviceScaleFactor: 0.5 });
let n = 0;
for (const base of BASES) {
  for (const estado of ESTADOS) {
    await pagina.goto(`${URL_BASE}/dev/personaje/captura?base=${base}&estado=${estado}`, { waitUntil: "networkidle" });
    await pagina.addStyleTag({ content: "html,body{background:transparent!important}" });
    await pagina.waitForSelector("canvas");
    await pagina.waitForTimeout(700);
    await pagina.getByTestId("captura").screenshot({ path: `public/personajes/${base}-${estado}.png`, omitBackground: true });
    n++;
  }
}
await navegador.close();
process.stdout.write(`✔ ${n} miniaturas en public/personajes/\n`);
