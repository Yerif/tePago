"use client";

import Link from "next/link";
import { usePagosDemo } from "@/components/features/usePagosDemo";
import { Pill } from "@/components/cozy/Pill";
import { Card } from "@/components/ui/Card";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { balancesNetos } from "@/lib/splits/balances";
import { paresConfirmados } from "@/lib/splits/confirmacion";
import { formatoMXN } from "@/lib/splits/formato";
import { aplicarPagos } from "@/lib/splits/pagos";

export interface ListaGruposProps {
  grupos: GrupoDemo[];
  /** Quién está mirando: de ahí sale "te deben / debes" en cada grupo. */
  yo: string;
  /** Ruta de un grupo: `${base}/${id}`. */
  base: string;
}

/** "Tus grupos": un grupo por tarjeta, con cuánto te deben o debes; primero los que necesitan algo de ti (el selector de tenant del demo). */
export function ListaGrupos({ grupos, yo, base }: ListaGruposProps) {
  const { registros } = usePagosDemo();
  // Los que necesitan algo de ti (debes) primero, luego los que te deben, al final los que están al corriente.
  const prioridad = (balance: number) => (balance < 0 ? 0 : balance > 0 ? 1 : 2);
  const conSaldo = grupos
    .map((g) => ({ g, balance: balancesNetos(aplicarPagos(g.gastos, paresConfirmados(registros, g.id)))[yo] ?? 0 }))
    .sort((a, b) => prioridad(a.balance) - prioridad(b.balance) || Math.abs(b.balance) - Math.abs(a.balance));

  return (
    <ul data-component="ListaGrupos" className="flex flex-col gap-3">
      {conSaldo.map(({ g, balance }) => (
        <li key={g.id}>
          <Link href={`${base}/${g.id}`} data-testid={`demo-grupo-${g.id}`} className="block rounded-card-sm">
            <Card size="sm" className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-3xl">
                  {g.icono}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{g.nombre}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {g.miembros.length} personas · {g.gastos.length} gastos
                  </p>
                </div>
              </div>
              {balance === 0 ? (
                <Pill variant="grass" className="self-start" data-testid="grupo-balance">
                  Al corriente ✨
                </Pill>
              ) : (
                <Pill variant={balance > 0 ? "grass" : "rose"} className="self-start" data-testid="grupo-balance">
                  {balance > 0 ? "Te deben" : "Debes"} {formatoMXN(Math.abs(balance))}
                </Pill>
              )}
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
