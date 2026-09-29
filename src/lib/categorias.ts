/** Catálogo único de categorías de gasto (CLAUDE.md §7): UI, DB e IA usan esta lista. */
export const CATEGORIAS = [
  "comida",
  "super",
  "fiesta",
  "transporte",
  "hospedaje",
  "entretenimiento",
  "hogar",
  "regalos",
  "otros",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const EMOJI_CATEGORIA: Record<Categoria, string> = {
  comida: "🌮",
  super: "🛒",
  fiesta: "🍻",
  transporte: "🚗",
  hospedaje: "🏡",
  entretenimiento: "🎟️",
  hogar: "🧺",
  regalos: "🎁",
  otros: "📦",
};
