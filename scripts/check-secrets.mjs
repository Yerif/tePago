// Revisa que ninguna llave quede en el bundle del cliente ni en el repo (CLAUDE.md §9). Uso: npm run build && npm run check:secrets
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SECRETOS = ["SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "CRON_SECRET"];
// Formas de llave que no deben aparecer en ningún lado.
const PATRONES = [
  { nombre: "llave de Anthropic", re: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { nombre: "llave secreta de Supabase", re: /sb_secret_[A-Za-z0-9_-]{20,}/ },
  { nombre: "bloque de llave privada", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

const hallazgos = [];
const reportar = (donde, que) => hallazgos.push(`${donde}: ${que}`);

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const ruta = join(dir, n);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

/** ¿Es un JWT de Supabase con rol service_role? (la llave "anon" también es JWT pero es pública por diseño) */
function esJwtServiceRole(texto) {
  for (const m of texto.matchAll(/eyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g)) {
    try {
      if (JSON.parse(Buffer.from(m[1], "base64url").toString()).role === "service_role") return true;
    } catch {
      /* no era un JWT legible */
    }
  }
  return false;
}

function revisar(donde, texto, { nombresProhibidos }) {
  for (const { nombre, re } of PATRONES) if (re.test(texto)) reportar(donde, nombre);
  if (esJwtServiceRole(texto)) reportar(donde, "JWT con rol service_role");
  if (nombresProhibidos) for (const s of SECRETOS) if (texto.includes(s)) reportar(donde, `menciona ${s} (no debe llegar al cliente)`);
  for (const s of SECRETOS) {
    const valor = process.env[s];
    if (valor && valor.length >= 8 && texto.includes(valor)) reportar(donde, `contiene el valor real de ${s}`);
  }
}

// 1) Bundle del cliente.
const estaticos = ".next/static";
if (!existsSync(estaticos)) {
  console.error("No hay .next/static: corre `npm run build` primero.");
  process.exit(2);
}
for (const f of archivos(estaticos)) if (/\.(js|css|html|json|map|txt)$/.test(f)) revisar(f, readFileSync(f, "utf8"), { nombresProhibidos: true });

// 2) Archivos versionados: ningún .env salvo .env.example, y sin llaves dentro.
const versionados = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
for (const f of versionados) {
  if (/(^|\/)\.env(\.|$)/.test(f) && !f.endsWith(".env.example")) reportar(f, "archivo .env versionado");
  if (/\.(png|webp|jpg|jpeg|ico|woff2?|lock)$/.test(f) || f === "package-lock.json" || f === "scripts/check-secrets.mjs" || !existsSync(f)) continue;
  revisar(f, readFileSync(f, "utf8"), { nombresProhibidos: false });
}

// 3) Higiene del repo y cabeceras de seguridad.
if (!/^\.env\*?$/m.test(readFileSync(".gitignore", "utf8")) && !/^\.env/m.test(readFileSync(".gitignore", "utf8"))) reportar(".gitignore", "no ignora los .env");
const config = readFileSync("next.config.ts", "utf8");
for (const cabecera of ["Content-Security-Policy", "X-Frame-Options", "Referrer-Policy", "X-Content-Type-Options"]) {
  if (!config.includes(cabecera)) reportar("next.config.ts", `falta la cabecera ${cabecera}`);
}
for (const v of Object.keys(process.env)) if (v.startsWith("NEXT_PUBLIC_") && SECRETOS.some((s) => v.includes(s))) reportar("entorno", `${v} usa NEXT_PUBLIC_ para un secreto`);

if (hallazgos.length > 0) {
  console.error(`✖ check:secrets: ${hallazgos.length} hallazgo(s)\n${hallazgos.map((h) => `  - ${h}`).join("\n")}`);
  process.exit(1);
}
console.log(`✔ check:secrets: sin hallazgos (${versionados.length} archivos versionados y el bundle del cliente revisados)`);
