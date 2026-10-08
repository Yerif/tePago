# evals/ — datasets para los prompts de runtime

> Loop 3 (`docs/LOOPS.md`): ningún prompt de `src/lib/ai/prompts/` cambia sin medir contra estos casos. Prompts y métricas: `docs/PROMPTS.md` (Parte B).
> Sin dataset no hay loop, hay superstición.

| Carpeta | Prompt | Casos | Qué evalúa |
|---|---|---:|---|
| `b1/` | Texto libre → borrador de gasto | 24 (20 normales + 4 adversariales) | total, pagado_por, resto_entre, renglones, repartos, advertencias, cero montos inventados |
| `b2/` | Foto de ticket → renglones | **0 — faltan fotos** | ver `b2/README.md` |
| `b3/` | Asignación de renglones | 16 (14 + 2 adversariales) | asignaciones, sin_asignar, pagado_por, propina |
| `b4/` | Resumen semanal | 11 semanas (1 adversarial) | reglas automáticas (longitud, sin enlaces, cifras fieles); el tono lo revisa Yerif |
| `b5/` | Categorización | 45 | accuracy |

## Formato de un caso

```jsonc
{
  "id": "b1-05-cena-detalle",     // único; prefijo del prompt
  "origen": "sintetico",          // "real" si viene de un mensaje del grupo
  "tipo": "normal",               // "normal" → trae `esperado`; "adversarial" → trae `criterios`
  "tags": ["items", "propina"],   // sirven para filtrar y para los tests de cobertura del dataset
  "entrada": { ... },             // exactamente lo que recibe el prompt (miembros con alias m1, m2…)
  "esperado": { ... },            // golden con la MISMA forma que la salida del prompt
  "criterios": [ ... ]            // solo adversariales: igual | distinto | contiene | no_aparece | asignacion
}
```

- `m1` es siempre quien escribe. Los nombres de los casos son ficticios.
- Las advertencias esperadas deben estar **todas** en la salida (que traiga de más no se penaliza).
- Los montos se escriben como texto (`"1240.50"`), igual que en la salida real.

## Cómo se puntúa

`src/lib/ai/evals.ts` (TS puro, 100 % cubierto): `puntuarB1`, `puntuarB3`, `montosInventados` y `cumpleCriterio`.
El runner (Promptfoo, ticket aparte) solo llama a estas funciones. Umbrales iniciales en `docs/PROMPTS.md`, sección Evals de cada prompt.

## Lo que garantizan los tests (`npm run test`)

`src/lib/ai/evals.test.ts` falla si:
- un caso no cumple el formato, o hay ids repetidos;
- el dataset baja de los mínimos de PROMPTS.md (≥ 15 en B1 y B3, ≥ 3 adversariales en B1, ≥ 2 que no son gasto, ≥ 2 con personas fuera del grupo, ≥ 10 semanas en B4, ≥ 30 en B5 con las 9 categorías);
- un `esperado` **no pasa el mismo validador que usará producción**, o trae un monto que no está en el texto;
- un criterio apunta a un campo o renglón que no existe.

## Agregar casos reales (lo más valioso)

Los casos actuales son **sintéticos**: sirven para arrancar, pero los reales de tu grupo pesan más. Para agregar uno:
1. Copia un mensaje real (quita datos sensibles y usa alias `m1…`).
2. Añade el caso al `casos.json` que corresponda con `"origen": "real"` y su golden.
3. Corre `npm run test`: si el golden no cumple las reglas, el test te dice cuál.

> Los golden los escribió Claude a partir de las reglas de los prompts. **Conviene que los revises**: si alguno no coincide con lo que tú esperarías, se corrige el caso o se sube la versión del prompt.
