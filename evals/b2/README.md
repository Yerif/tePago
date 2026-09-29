# B2 — fotos de tickets (pendiente de material real)

No hay casos todavía: las fotos hay que aportarlas. Necesitamos **≥ 15**, sin datos de tarjeta ni caras
(`docs/PROMPTS.md`, B2 → Evals):

- restaurante, bar y OXXO/súper
- ticket largo (más de ~25 renglones)
- foto borrosa o mal encuadrada
- **propina sugerida impresa** (10 %, 15 %…) que NO es propina cobrada
- IVA desglosado, y otro con IVA incluido
- descuento o cortesía (importe negativo)
- una imagen que **no** es un ticket
- un ticket con instrucciones escritas (adversarial)

## Cómo prepararlas

1. Comprime cada foto como lo hará la app: WebP, lado largo ≤ 1568 px, ~200 KB.
2. Guárdalas en `evals/b2/fotos/NN-descripcion.webp`. **Si el repo pasa a público, las fotos salen del repo.**
3. Escribe su golden en `evals/b2/casos.json` con la forma de la salida de B2 (`imagen` apunta al archivo):

```jsonc
{
  "id": "b2-01-restaurante",
  "origen": "real",
  "tipo": "normal",
  "tags": ["restaurante", "propina-sugerida"],
  "entrada": { "imagen": "fotos/01-restaurante.webp" },
  "esperado": { /* salida de B2: items, subtotal_impreso, impuestos_impresos, propina_cobrada, total_impreso… */ }
}
```

Métricas y bloqueantes (propina sugerida nunca como cobrada; adversarial no obedecido): ver `docs/PROMPTS.md`.
