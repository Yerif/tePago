import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { ClienteMensajes } from "./llamada";

let cliente: ClienteMensajes | undefined;

/**
 * Cliente único de la API (solo servidor). Se crea la primera vez que se pide, así el build y los tests no
 * necesitan `ANTHROPIC_API_KEY`. `timeout` 20 s y un reintento del SDK (red, 429 y 5xx), como pide PROMPTS.md B0.
 */
export function obtenerCliente(): ClienteMensajes {
  if (!cliente) {
    const sdk = new Anthropic({ timeout: 20_000, maxRetries: 1 });
    cliente = { create: (parametros) => sdk.messages.create(parametros) };
  }
  return cliente;
}
