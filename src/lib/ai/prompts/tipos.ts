export interface Prompt<V extends string> {
  id: string;
  version: number;
  maxTokens: number;
  /** undefined = valor por defecto de la API (B4). */
  temperature: number | undefined;
  /** Nombres de las variables `{{...}}` de `userTemplate`. */
  variables: readonly V[];
  /** Texto fijo: sin nombres, fechas ni nada interpolado (CLAUDE.md §8). */
  system: string;
  userTemplate: string;
}
