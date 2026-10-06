import Link from "next/link";
import { Pill } from "@/components/cozy/Pill";
import { Card } from "@/components/ui/Card";
import type { GrupoDemo } from "@/lib/mock/tipos";
import { formatoMXN } from "@/lib/splits/formato";
import { resumenPersona } from "@/lib/splits/resumen";

export interface ResumenInicioProps {
  grupos: GrupoDemo[];
  /** Quién está mirando. */
  yo: string;
  /** Ruta de un grupo: `${base}/${id}/detalle`. */
  base: string;
}

/** Lo primero que se ve: cuánto debes, cuánto te deben y el pago más sencillo de cada grupo, a un toque de pagar. */
export function ResumenInicio({ grupos, yo, base }: ResumenInicioProps) {
  const resumen = resumenPersona(grupos, yo);
  const nombres = Object.fromEntries(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m.nombre])));
  const enOrden = resumen.porGrupo.length === 0;
  const liga = (grupoId: string) => `${base}/${grupoId}/detalle?u=${yo}#como-pagarse`;

  return (
    <section data-component="ResumenInicio" aria-label="Tus cuentas" className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Card size="sm" className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Debes</p>
          <p data-testid="inicio-debes" className="font-display text-2xl font-bold text-rose-text">
            {formatoMXN(resumen.debesCentavos)}
          </p>
        </Card>
        <Card size="sm" className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Te deben</p>
          <p data-testid="inicio-te-deben" className="font-display text-2xl font-bold text-grass-text">
            {formatoMXN(resumen.teDebenCentavos)}
          </p>
        </Card>
      </div>

      {enOrden ? (
        <Pill variant="grass" className="self-start" data-testid="inicio-en-orden">
          ¡Todo en orden! 🌻
        </Pill>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">La forma más sencilla de quedar a mano en cada grupo:</p>
          <ul className="flex flex-col gap-2">
            {resumen.porGrupo.flatMap((g) => [
              ...g.debes.map((t) => (
                <li key={`d-${g.grupoId}-${t.aId}`}>
                  <Link href={liga(g.grupoId)} data-testid={`inicio-pagar-${g.grupoId}-${t.aId}`} className="block rounded-card-sm">
                    <Card size="sm" className="flex items-center gap-3">
                      <span aria-hidden className="text-2xl">
                        {g.icono}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">Págale a {nombres[t.aId] ?? t.aId} 😬</p>
                        <p className="text-sm text-muted-foreground">{g.nombre}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-rose-text">{formatoMXN(t.centavos)}</p>
                        <p className="text-sm text-muted-foreground">Pagar ›</p>
                      </div>
                    </Card>
                  </Link>
                </li>
              )),
              ...g.teDeben.map((t) => (
                <li key={`c-${g.grupoId}-${t.deId}`}>
                  <Link href={liga(g.grupoId)} data-testid={`inicio-cobro-${g.grupoId}-${t.deId}`} className="block rounded-card-sm">
                    <Card size="sm" className="flex items-center gap-3">
                      <span aria-hidden className="text-2xl">
                        {g.icono}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{nombres[t.deId] ?? t.deId} te paga</p>
                        <p className="text-sm text-muted-foreground">{g.nombre}</p>
                      </div>
                      <p className="font-display font-bold text-grass-text">{formatoMXN(t.centavos)}</p>
                    </Card>
                  </Link>
                </li>
              )),
            ])}
          </ul>
        </>
      )}
    </section>
  );
}
