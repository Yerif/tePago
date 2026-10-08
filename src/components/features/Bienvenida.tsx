"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { rutaMiniatura } from "@/lib/game/apariencia";
import { ETIQUETA_ESTADO, type EstadoAvatar } from "@/lib/game/avatar";
import { cn } from "@/lib/utils";

export interface BienvenidaProps {
  nombre: string;
  base: string;
  /** A dónde lleva "Elegir mi personaje" (la pestaña Yo de esta persona). */
  hrefYo: string;
  /** Cierra la bienvenida (y se recuerda que ya se vio). */
  onCerrar: () => void;
}

const ESTADOS: EstadoAvatar[] = ["clean", "mild", "rekt"];

/**
 * "Conoce a tu personaje" (PX-11): 3 pasos, omitibles, una sola vez. Explica que el personaje cambia según cómo pagas, que
 * pagar rápido da XP y skins, y qué ve el grupo de ti (CLAUDE.md §7, "Reputación pública"). Nunca estorba el camino de Dividir.
 */
export function Bienvenida({ nombre, base, hrefYo, onCerrar }: BienvenidaProps) {
  const [paso, setPaso] = useState(0);
  const ultimo = paso === 2;
  return (
    <div data-component="Bienvenida" className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onCerrar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bienvenida-titulo"
        data-testid="bienvenida"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-t-3xl border-[2.5px] border-b-0 border-border bg-card p-5 pb-8 sm:rounded-3xl sm:border-b-[2.5px]"
      >
        <p className="text-sm text-muted-foreground" data-testid="bienvenida-paso">
          Conoce a tu personaje · {paso + 1} de 3
        </p>
        {paso === 0 && (
          <>
            <h2 id="bienvenida-titulo" className="font-display text-2xl font-bold">
              Hola, {nombre} 🌻 Este es tu personaje
            </h2>
            <p>Cambia según cómo pagas: brilla cuando estás al día y se nubla si dejas pasar los pagos. Siempre se recupera.</p>
            <ul className="flex justify-around gap-2">
              {ESTADOS.map((e) => (
                <li key={e} className="flex flex-col items-center gap-1 text-center text-sm font-semibold">
                  <Image src={rutaMiniatura(base, e)} alt="" width={256} height={256} unoptimized className="size-20 object-contain" />
                  {ETIQUETA_ESTADO[e]}
                </li>
              ))}
            </ul>
          </>
        )}
        {paso === 1 && (
          <>
            <h2 id="bienvenida-titulo" className="font-display text-2xl font-bold">
              Paga rápido y gana ⚡
            </h2>
            <ul className="flex flex-col gap-2">
              <li>⚡ XP cada vez que saldas una deuda (más si lo haces rápido).</li>
              <li>🆙 Subes de nivel y desbloqueas skins: 👒 Jardinero, 🧭 Explorador, 👑 Leyenda…</li>
              <li>☁️ Si te atrasas, tu personaje se nubla; con un pago vuelve a brillar.</li>
            </ul>
          </>
        )}
        {paso === 2 && (
          <>
            <h2 id="bienvenida-titulo" className="font-display text-2xl font-bold">
              Tu grupo te ve a ti, con cariño 🫶
            </h2>
            <p>Tu grupo ve tu personaje, tu nivel, tus badges y tu saldo. Nada más.</p>
            <p className="text-sm text-muted-foreground">La broma es del personaje, nunca de ti: si está nublado, un pago lo arregla.</p>
          </>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {ultimo ? (
            <>
              <Button size="lg" data-testid="bienvenida-empezar" onClick={onCerrar}>
                ¡Empezar!
              </Button>
              <Link href={hrefYo} onClick={onCerrar} data-testid="bienvenida-elegir" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                Elegir mi personaje
              </Link>
            </>
          ) : (
            <Button size="lg" data-testid="bienvenida-siguiente" onClick={() => setPaso((p) => p + 1)}>
              Siguiente
            </Button>
          )}
          {!ultimo && (
            <Button variant="ghost" size="md" data-testid="bienvenida-saltar" onClick={onCerrar}>
              Saltar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
