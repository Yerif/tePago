import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/cozy/Pill";
import { ReiniciarDemo } from "@/components/features/ReiniciarDemo";
import { ResumenInicio } from "@/components/features/ResumenInicio";
import { crearGrupos, YO } from "@/lib/mock/datos";

export const metadata: Metadata = { title: "Inicio (demo) · Cuentas Conmigo" };
export const dynamic = "force-dynamic"; // las fechas de ejemplo son relativas a "ahora"

export default async function DemoIndexPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams;
  const ahora = new Date();
  const grupos = crearGrupos(ahora);
  const miembros = new Map(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m] as const)));
  const yo = u && miembros.has(u) ? u : YO;

  return (
    <main data-component="DemoIndexPage" className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <ResumenInicio key={yo} grupos={grupos} yo={yo} ahoraIso={ahora.toISOString()} />

      <details data-testid="herramientas-demo" className="rounded-3xl border-[2.5px] border-dashed border-border p-4">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold">🧪 Herramientas de prueba</summary>
        <div className="mt-3 flex flex-col gap-4">
          <Pill variant="lemon" className="self-start">
            Datos de ejemplo · sin Supabase
          </Pill>
          <p className="text-sm text-muted-foreground">
            Los pagos se guardan solo en este navegador, para probar los dos lados cambiando de persona. «Reiniciar» empieza de cero.
          </p>
          <nav aria-label="Probar como" className="flex flex-wrap gap-2">
            {[...miembros.values()].map((m) => (
              <Link key={m.id} href={`/dev/demo?u=${m.id}`} aria-current={m.id === yo ? "page" : undefined} data-testid={`inicio-probar-${m.id}`} className="inline-flex min-h-11 items-center">
                <Pill variant={m.id === yo ? "grass" : "neutral"}>{m.nombre}</Pill>
              </Link>
            ))}
          </nav>
          <ReiniciarDemo />
          <ul className="flex flex-col gap-1 text-sm underline">
            <li>
              <Link href="/dev/demo/ia" data-testid="demo-ia" className="inline-flex min-h-11 items-center">
                ✅ Revisar lo que se entendió (IA de ejemplo)
              </Link>
            </li>
            <li>
              <Link href="/dev/ui" data-testid="demo-ui" className="inline-flex min-h-11 items-center">
                🎨 Sistema de diseño
              </Link>
            </li>
            <li>
              <Link href="/dev/personaje" className="inline-flex min-h-11 items-center">
                🧸 Laboratorio del personaje
              </Link>
            </li>
          </ul>
        </div>
      </details>
    </main>
  );
}
