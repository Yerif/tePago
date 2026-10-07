import type { Metadata } from "next";
import { DividirRapido } from "@/components/features/DividirRapido";
import { EscribirGasto } from "@/components/features/EscribirGasto";
import { crearGrupos, YO } from "@/lib/mock/datos";

export const metadata: Metadata = { title: "Dividir (demo)" };
export const dynamic = "force-dynamic";

export default async function DividirDemoPage({ searchParams }: { searchParams: Promise<{ g?: string; u?: string }> }) {
  const { g, u } = await searchParams;
  const grupos = crearGrupos(new Date());
  const yo = grupos.some((x) => x.miembros.some((m) => m.id === u)) ? (u as string) : YO;
  const inicial = grupos.find((x) => x.id === g)?.id ?? grupos[0]?.id ?? "";

  return (
    <main data-component="DividirDemoPage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-3xl font-bold">Dividir ⚡</h1>
      <DividirRapido
        yo={yo}
        grupoInicial={inicial}
        grupos={grupos.map(({ id, nombre, icono, miembros }) => ({
          id,
          nombre,
          icono,
          miembros: miembros.map(({ id: mid, nombre: mn, base, estado }) => ({ id: mid, nombre: mn, base, estado })),
        }))}
      />
      <EscribirGasto yo={yo} />
    </main>
  );
}
