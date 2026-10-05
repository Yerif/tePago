import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { Pill } from "@/components/cozy/Pill";
import { ConfirmarGasto } from "@/components/features/ConfirmarGasto";
import { borradorDesdeB1 } from "@/lib/ai/aBorrador";
import { avisosDeB1 } from "@/lib/ai/avisos";
import { CasoB1 } from "@/lib/ai/evals";
import casosJson from "../../../../../evals/b1/casos.json";

export const metadata: Metadata = { title: "Confirmar gasto (demo)" };

const BASES_EJEMPLO = ["oso", "zorro", "conejo", "rana"];
const casos = z.array(CasoB1).parse(casosJson).filter((c) => c.tipo === "normal" && c.esperado);

export default async function ConfirmarDemoPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const caso = casos.find((x) => x.id === c) ?? casos[0];
  if (!caso?.esperado) return null;

  const miembros = caso.entrada.miembros.map((m, i) => ({ id: m.alias, nombre: m.nombre, base: BASES_EJEMPLO[i] ?? "gato", estado: "clean" as const }));
  const alias = Object.fromEntries(miembros.map((m) => [m.id, m.id]));

  return (
    <main data-component="ConfirmarDemoPage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Link href="/dev/demo" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline">
        ← Demo
      </Link>
      <h1 className="font-display text-3xl font-bold">Confirmar gasto ✅</h1>
      <Pill variant="lemon" className="self-start">
        Ejemplos de prueba · sin llamadas a la API
      </Pill>
      <p className="text-sm text-muted-foreground">
        Elige un mensaje: la pantalla muestra cómo se revisa lo que se entendió antes de guardar. Cada ejemplo sale de los casos de <code>evals/</code>.
      </p>

      <nav aria-label="Ejemplos" className="flex flex-wrap gap-2">
        {casos.map((x, i) => (
          <Link key={x.id} href={`/dev/demo/ia?c=${x.id}`} aria-current={x.id === caso.id ? "page" : undefined} data-testid={`ejemplo-${x.id}`} className="inline-flex min-h-11 min-w-11 items-center justify-center">
            <Pill variant={x.id === caso.id ? "grass" : "neutral"}>{i + 1}</Pill>
          </Link>
        ))}
      </nav>

      <ConfirmarGasto
        key={caso.id}
        miembros={miembros}
        quienEscribeId="m1"
        textoOriginal={caso.entrada.texto}
        borradorInicial={borradorDesdeB1(caso.esperado, alias)}
        avisos={avisosDeB1(caso.esperado)}
      />
    </main>
  );
}
