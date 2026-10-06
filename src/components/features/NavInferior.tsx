"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { avisosParaPagador, porConfirmar, porRevisar } from "@/lib/splits/confirmacion";
import { cn } from "@/lib/utils";
import { usePagosDemo } from "./usePagosDemo";

const BASE = "/dev/demo";

export interface NavInferiorProps {
  /** Persona por defecto cuando la URL no trae `?u=`. */
  yoPorDefecto: string;
}

/** Barra inferior fija: Inicio · Dividir (al centro) · Grupos · Yo, con el número de pagos por resolver en Inicio. */
export function NavInferior({ yoPorDefecto }: NavInferiorProps) {
  const pathname = usePathname();
  const yo = useSearchParams().get("u") ?? yoPorDefecto;
  const { registros } = usePagosDemo();
  // Un gesto de pago que abarca varios grupos cuenta una sola vez (mismo lote).
  const lotes = (lista: readonly { loteId: string }[]) => new Set(lista.map((r) => r.loteId)).size;
  const pendientes = lotes(porConfirmar(registros, yo)) + lotes(porRevisar(registros, yo)) + lotes(avisosParaPagador(registros, yo));
  const q = `?u=${yo}`;

  const destinos = [
    { id: "inicio", etiqueta: "Inicio", icono: "🏠", href: `${BASE}${q}`, activo: pathname === BASE },
    { id: "dividir", etiqueta: "Dividir", icono: "➕", href: `${BASE}/dividir${q}`, activo: pathname.startsWith(`${BASE}/dividir`), destacado: true },
    { id: "grupos", etiqueta: "Grupos", icono: "👥", href: `${BASE}/grupos${q}`, activo: pathname.startsWith(`${BASE}/grupos`) || pathname.startsWith(`${BASE}/g/`) },
    { id: "yo", etiqueta: "Yo", icono: "🐻", href: `${BASE}/yo${q}`, activo: pathname.startsWith(`${BASE}/yo`) },
  ];

  return (
    <nav data-component="NavInferior" aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 border-t-[2.5px] border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {destinos.map((d) => (
          <li key={d.id} className="flex-1">
            <Link
              href={d.href}
              data-testid={`nav-${d.id}`}
              aria-current={d.activo ? "page" : undefined}
              className={cn("relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold", d.activo ? "text-grass-text" : "text-muted-foreground")}
            >
              <span aria-hidden className={cn("text-2xl", d.destacado && "rounded-full border-2 border-grass bg-grass-soft px-3 py-0.5")}>
                {d.icono}
              </span>
              {d.etiqueta}
              {d.id === "inicio" && pendientes > 0 && (
                <span data-testid="nav-pendientes" aria-label={`${pendientes} pagos por resolver`} className="absolute top-1 right-[22%] min-w-5 rounded-full bg-rose px-1 text-center text-xs font-bold text-on-accent">
                  {pendientes}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
