# MOVIL — Avanzar el proyecto desde el celular

> Sin localhost no hace falta compilar nada en tu teléfono: **Vercel publica cada rama en una URL** que abres en el navegador del celular. Todo lo demás (Supabase, GitHub, Anthropic, Notion) tiene panel web que funciona en móvil.
> Los pasos de la interfaz de cada servicio cambian con el tiempo; si algún botón no está donde digo, busca el nombre entre comillas.

## 1. Ver la app en tu celular (10 min, lo que más desbloquea)

1. En el navegador del celular abre **vercel.com** e inicia sesión con GitHub.
2. **Add New… → Project** → importa `Yerif/tePago`. Deja el framework como Next.js. Plan **Hobby** (gratis; solo uso no comercial).
3. No hace falta ninguna variable de entorno todavía: la demo no usa Supabase. Pulsa **Deploy**.
4. Vercel crea una URL de **preview por cada rama y por cada PR**. La encuentras en Vercel → tu proyecto → **Deployments**, o en el PR de GitHub (comentario del bot de Vercel).
5. Abre la URL de la rama `feat/demo-mock` (o del PR correspondiente) y toca **"Ver demo con datos de ejemplo"**. Si la preview te pide iniciar sesión, usa tu cuenta de Vercel.

Notas:
- La rama de producción es `main`, que hoy solo tiene el commit inicial: su deploy de producción fallará o quedará vacío hasta que mergeemos `develop` → `main` (decisión de Yerif: solo cuando el PoC esté listo). **No afecta a los previews.**
- Para mandarle la app a alguien, usa la URL **estable de la rama** `develop` (Vercel → Deployments → rama `develop` → Domains), no la de un commit. Cómo preparar una ronda de pruebas con la banda: `docs/UAT.md`.
- `/dev/*` (demo y sistema de diseño) existe solo en previews y desarrollo. En producción da 404.
- Cada push a una rama genera un preview nuevo en ~1 minuto.

## 2. Qué probar en la demo

Abre `/dev/demo` y recorre (el guion para probar con otras personas, con tareas y criterios, está en `docs/UAT.md` §4):

| Pantalla | Qué revisar |
|---|---|
| Home de grupo (Oaxaca y Roomies) | Personaje con XP, estado del avatar, badges, saldos de la banda y gastos. Cambia de grupo con las pills de arriba. |
| Dividir ⚡ | Escribe solo el monto y toca Confirmar: ¿se siente más rápido que la calculadora? (meta ≤ 3 interacciones). Prueba quitar personas, cambiar quién pagó, `1000.01` entre 3 (el residuo lo absorbe el pagador) y un monto inválido como `12.345`. |
| Detalle del grupo | Desde el home, "Ver quién le debe a quién": deudas entre personas (¿se entienden?), balances y cada gasto desplegable con quién ya saldó. |
| Confirmar gasto ✅ | Elige uno de los 20 mensajes de ejemplo y revisa lo que se "entendió": corrige monto, quién pagó, entre quiénes y propina, y mira cómo cambia el reparto en vivo. Los avisos deben sonar cálidos, no regañones. |
| Yo 🐻 (perfil y skins) | Cambia de persona con "Probar como…" y mira qué skins se desbloquean (Explorador en nivel 5, Alcalde con su badge…). |
| `?debug=1` en cualquier ruta | Botón 🐞 con usuario, grupo, avatar, XP y última llamada a la IA; "Copiar reporte" para pegármelo. |
| Toggle 🌙/☀️ | Cambia de tema; debe recordarse al navegar y recargar. |
| `/dev/ui` | Botones, pills, cards y paleta en ambos temas. |

Cosas a mirar con ojo humano (lo que los tests no ven): tamaño de los botones al tocar con el dedo, textos que se cortan, si el humor del microcopy te convence, si el personaje se ve "cozy". Anótalo y pásamelo tal cual.

## 3. Cuentas y llaves (todo con panel web)

**Supabase** (supabase.com/dashboard)
1. Pausa el proyecto de la quiniela (Project Settings → **Pause project**): el free tier permite 2 activos.
2. **New project** → nombre `cuentas-conmigo`, región cercana (ej. US East o México si está disponible), contraseña de base de datos fuerte (guárdala en tu gestor de contraseñas).
3. Project Settings → **API**: ahí están `Project URL`, la llave `anon`/`publishable` y la `service_role`/`secret`.

**Anthropic** (console.anthropic.com)
1. Crea una **API key** dedicada a este proyecto.
2. En **Limits** (o Billing) fija un **límite de gasto mensual** (sugerido $10 USD). Es el freno de emergencia del único costo variable.

**Dónde poner las llaves**
- Vercel → tu proyecto → Settings → **Environment Variables**: agrega las 5 de `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`); `DEBUG` es opcional. Solo las dos `NEXT_PUBLIC_*` pueden ser visibles al cliente.
- **Marca solo el entorno "Production"** en las llaves reales (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`). Las previews muestran `/dev/*` y el panel de debug: no deben tener llaves reales (CLAUDE.md §9, regla 7).
- **Nunca me pegues una llave en el chat.** Dime "ya están" y yo trabajo sin verlas. `CRON_SECRET` la inventas tú: 32+ caracteres aleatorios.

## 4. GitHub desde el celular

- **App de GitHub** o el navegador: revisar y **mergear PRs a `develop`** (nunca a `main` hasta que el PoC esté listo).
- **Ajustes de repo** (proteger `main`/`develop`, "Automatically delete head branches"): la app móvil no los tiene; usa el navegador con "sitio de escritorio" en Settings → Branches y Settings → General.

## 5. Qué no se puede desde el celular (ni desde aquí)

- Probar de verdad Supabase local (`npx supabase start`) necesita Docker: los tickets de base de datos se validan contra tu proyecto de Supabase en la nube o en una computadora.
- Login con Google necesita configurar OAuth en Google Cloud Console (mejor en computadora); el magic link solo necesita Supabase.

## Checklist rápido

- [x] Vercel conectado y URL de preview abierta en el celular
- [x] Probada la demo (Home, Dividir, tema)
- [x] Todo lo anterior mergeado en `develop`
- [ ] PRs #18, #19, #20 y el de la auditoría revisados y mergeados a `develop`
- [ ] Decididas D1–D10 de `docs/AUDITORIA.md` (sobre todo D8: entorno de UAT-1)
- [ ] Proyecto de Supabase creado (quiniela pausada)
- [ ] API key de Anthropic con límite de gasto
- [ ] Llaves en Vercel solo en Production (sin compartirlas en el chat)
- [ ] `main` y `develop` protegidas; "Automatically delete head branches" activado
- [ ] Revisados los golden de `evals/` y reunidos ≥ 5 mensajes reales y ≥ 15 fotos de tickets (sin tarjetas ni caras)
