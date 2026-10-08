"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/cozy/Avatar";
import { avisosParaPagador, porConfirmar, porRevisar } from "@/lib/splits/confirmacion";
import { cn } from "@/lib/utils";
import { usePagosDemo } from "./usePagosDemo";
import { usePerfilesDemo } from "./usePerfilesDemo";

const BASE = "/dev/demo";

export interface NavInferiorProps {
  /** Persona por defecto cuando la URL no trae `?u=`. */
  yoPorDefecto: string;
  /** Personaje de cada persona del demo (`id → base`): el ícono de "Yo" es tu miniatura. */
  bases: Record<string, string>;
}

/** Barra inferior fija: Inicio · Dividir (al centro) · Grupos · Yo, con el número de pagos por resolver en Inicio. */
export function NavInferior({ yoPorDefecto, bases }: NavInferiorProps) {
  const pathname = usePathname();
  const yo = useSearchParams().get("u") ?? yoPorDefecto;
  const { registros } = usePagosDemo();
  const { perfiles } = usePerfilesDemo();
  const miBase = perfiles[yo]?.base ?? bases[yo];
  // Un gesto de pago que abarca varios grupos cuenta una sola vez (mismo lote).
  const lotes = (lista: readonly { loteId: string }[]) => new Set(lista.map((r) => r.loteId)).size;
  const pendientes = lotes(porConfirmar(registros, yo)) + lotes(porRevisar(registros, yo)) + lotes(avisosParaPagador(registros, yo));
  const q = `?u=${yo}`;

  const destinos = [
    { id: "inicio", etiqueta: "Inicio", icono: "🏠", href: `${BASE}${q}`, activo: pathname === BASE },
    { id: "dividir", etiqueta: "Dividir", icono: "➕", href: `${BASE}/dividir${q}`, activo: pathname.startsWith(`${BASE}/dividir`) },
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
              className={cn("relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[13px]", d.activo ? "font-bold text-grass-text" : "font-semibold text-muted-foreground")}
            >
              {/* Pestaña activa: barra arriba + fondo detrás del ícono + etiqueta en negritas (no depende solo del color).
                  Todas las pestañas, Dividir incluida, se ven igual: ninguna parece "siempre seleccionada". */}
              {d.activo && <span aria-hidden data-testid="nav-activa" className="absolute top-0 h-1 w-10 rounded-b-full bg-grass" />}
              <span aria-hidden className={cn("flex h-8 min-w-14 items-center justify-center rounded-full", d.activo && "bg-grass-soft")}>
                {d.id === "yo" && miBase ? (
                  <Avatar base={miBase} estado="clean" neutro compacto size="sm" className="size-8 border-2" />
                ) : d.id === "dividir" ? (
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M12 4v16M4 12h16" />
                  </svg>
                ) : (
                  <span className="text-2xl leading-none">{d.icono}</span>
                )}
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
