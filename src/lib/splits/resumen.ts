import { balancesNetos } from "./balances";
import { planDePagos, type Transferencia } from "./plan";
import type { GastoCalculable } from "./tipos";

export interface GrupoParaResumen {
  id: string;
  nombre: string;
  icono: string;
  gastos: readonly GastoCalculable[];
}

export interface ResumenDeGrupo {
  grupoId: string;
  nombre: string;
  icono: string;
  /** Lo que `yo` tiene que pagar según el plan más sencillo de ese grupo. */
  debes: Transferencia[];
  /** Lo que otros le pagan a `yo` según ese mismo plan. */
  teDeben: Transferencia[];
}

export interface ResumenPersona {
  debesCentavos: number;
  teDebenCentavos: number;
  /** Solo grupos donde `yo` paga o recibe algo, en el orden recibido. */
  porGrupo: ResumenDeGrupo[];
}

/**
 * Pantalla de inicio: cuánto debes y cuánto te deben en total, y qué pagos concretos te tocan, usando el plan
 * de pagos más sencillo de cada grupo. Los grupos nunca se compensan entre sí (cada uno es un tenant).
 */
export function resumenPersona(grupos: readonly GrupoParaResumen[], yo: string): ResumenPersona {
  let debesCentavos = 0;
  let teDebenCentavos = 0;
  const porGrupo: ResumenDeGrupo[] = [];
  for (const g of grupos) {
    const plan = planDePagos(balancesNetos(g.gastos));
    const debes = plan.filter((t) => t.deId === yo);
    const teDeben = plan.filter((t) => t.aId === yo);
    if (debes.length === 0 && teDeben.length === 0) continue;
    debesCentavos += debes.reduce((s, t) => s + t.centavos, 0);
    teDebenCentavos += teDeben.reduce((s, t) => s + t.centavos, 0);
    porGrupo.push({ grupoId: g.id, nombre: g.nombre, icono: g.icono, debes, teDeben });
  }
  return { debesCentavos, teDebenCentavos, porGrupo };
}
