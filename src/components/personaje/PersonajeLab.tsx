"use client";

import { useState } from "react";
import { Personaje } from "@/components/personaje/Personaje";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apariencia, BASE_SLUGS, BASES, type BaseSlug } from "@/lib/game/apariencia";
import type { EstadoAvatar } from "@/lib/game/avatar";
import { SKIN_SLUGS, SKINS, type SkinSlug } from "@/lib/game/skins";

const ESTADOS: EstadoAvatar[] = ["clean", "mild", "rekt"];
const ETIQUETA: Record<EstadoAvatar, string> = { clean: "Radiante", mild: "Apagado", rekt: "Deteriorado" };

/** Laboratorio del personaje (solo dev y previews): cambia base, estado, skin y nivel y mira el resultado. */
export function PersonajeLab() {
  const [base, setBase] = useState<BaseSlug>("oso");
  const [estado, setEstado] = useState<EstadoAvatar>("clean");
  const [skin, setSkin] = useState<SkinSlug>("clasico");
  const [nivel, setNivel] = useState(1);
  const a = apariencia({ base, estado, skin, nivel });

  return (
    <div data-component="PersonajeLab" className="flex flex-col gap-4">
      <Card className="flex justify-center">
        <Personaje apariencia={a} estado={estado} />
      </Card>

      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Estado</legend>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <Button key={e} size="md" variant={e === estado ? "grass" : "outline"} aria-pressed={e === estado} data-testid={`estado-${e}`} onClick={() => setEstado(e)}>
              {ETIQUETA[e]}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Personaje</legend>
        <div className="flex flex-wrap gap-2">
          {BASE_SLUGS.map((b) => (
            <Button key={b} size="md" variant={b === base ? "grass" : "outline"} aria-pressed={b === base} data-testid={`base-${b}`} onClick={() => setBase(b)}>
              {BASES[b].emoji} {BASES[b].nombre}
            </Button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-muted-foreground">Skin</legend>
        <div className="flex flex-wrap gap-2">
          {SKIN_SLUGS.map((s) => (
            <Button key={s} size="md" variant={s === skin ? "grass" : "outline"} aria-pressed={s === skin} data-testid={`skin-${s}`} onClick={() => setSkin(s)}>
              {SKINS[s].nombre}
            </Button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="nivel" className="mb-1 block text-sm text-muted-foreground">
          Nivel: <span data-testid="nivel-valor">{nivel}</span> {nivel >= 10 ? "(con aura ✨)" : ""}
        </label>
        <input id="nivel" type="range" min={1} max={12} value={nivel} onChange={(e) => setNivel(Number(e.target.value))} className="h-11 w-full" data-testid="nivel" />
      </div>
    </div>
  );
}
