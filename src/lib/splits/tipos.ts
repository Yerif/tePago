export interface ParteGasto {
  userId: string;
  /** Centavos enteros. */
  centavos: number;
  saldado: boolean;
}

export interface GastoCalculable {
  id: string;
  pagadoPor: string;
  totalCentavos: number;
  partes: readonly ParteGasto[];
}
