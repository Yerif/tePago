"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatoMXN, parsearMonto } from "@/lib/splits/formato";
import { cn } from "@/lib/utils";
import type { PersonaLite } from "./ModoPorPersona";

export interface RenglonProducto {
  id: number;
  nombre: string;
  centavos: number;
  quienes: string[];
}

export interface ModoProductoProps {
  personas: PersonaLite[];
  renglones: RenglonProducto[];
  onCambio: (renglones: RenglonProducto[]) => void;
}

/** Captura rápida de productos: nombre, precio y quiénes lo consumieron. Lo demás se divide entre todos. */
export function ModoProducto({ personas, renglones, onCambio }: ModoProductoProps) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [quienes, setQuienes] = useState<string[]>([]);

  const centavos = parsearMonto(precio);
  const puede = centavos !== null && centavos > 0 && quienes.length > 0;

  function agregar() {
    if (!puede) return;
    const id = renglones.reduce((m, r) => Math.max(m, r.id), 0) + 1;
    onCambio([...renglones, { id, nombre: nombre.trim() || `Producto ${id}`, centavos, quienes }]);
    setNombre("");
    setPrecio("");
    setQuienes([]);
  }

  return (
    <fieldset data-component="ModoProducto" className="flex flex-col gap-3">
      <legend className="mb-1 text-sm text-muted-foreground">Agrega lo que no todos pidieron. Lo demás se divide entre todos.</legend>
      {renglones.length > 0 && (
        <ul data-testid="producto-lista" className="flex flex-col gap-1">
          {renglones.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-2xl border-2 border-border px-3 py-1 text-sm">
              <span className="min-w-0 truncate">
                {r.nombre} · {formatoMXN(r.centavos)} <span className="text-muted-foreground">({r.quienes.map((q) => personas.find((p) => p.id === q)?.nombre ?? q).join(", ")})</span>
              </span>
              <button
                type="button"
                aria-label={`Quitar ${r.nombre}`}
                data-testid={`producto-quitar-${r.id}`}
                className="min-h-11 min-w-11 text-muted-foreground"
                onClick={() => onCambio(renglones.filter((x) => x.id !== r.id))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          aria-label="Producto"
          data-testid="producto-nombre"
          placeholder="Chelas, postre…"
          maxLength={40}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-2xl border-[2.5px] border-border bg-background px-3 py-2"
        />
        <input
          aria-label="Precio"
          data-testid="producto-precio"
          inputMode="decimal"
          placeholder="0.00"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="min-h-11 w-28 rounded-2xl border-[2.5px] border-border bg-background px-3 py-2 text-right font-display font-bold"
        />
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quiénes lo consumieron">
        {personas.map((p) => {
          const dentro = quienes.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={dentro}
              data-testid={`producto-quien-${p.id}`}
              onClick={() => setQuienes((q) => (q.includes(p.id) ? q.filter((x) => x !== p.id) : [...q, p.id]))}
              className={cn(
                "min-h-11 rounded-full border-2 px-4 py-1 text-sm font-semibold",
                dentro ? "border-grass bg-grass-soft text-grass-text" : "border-border bg-card text-muted-foreground",
              )}
            >
              {p.nombre}
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="sm" disabled={!puede} onClick={agregar} data-testid="producto-agregar" className="self-start">
        Agregar producto
      </Button>
    </fieldset>
  );
}
