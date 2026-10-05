import type { Metadata } from "next";
import Link from "next/link";
import { DividirRapido } from "@/components/features/DividirRapido";
import { crearGrupos, YO } from "@/lib/mock/datos";

export const metadata: Metadata = { title: "Dividir (demo)" };
export const dynamic = "force-dynamic";

export default async function DividirDemoPage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const { g } = await searchParams;
  const grupos = crearGrupos(new Date());
  const inicial = grupos.find((x) => x.id === g)?.id ?? grupos[0]?.id ?? "";

  return (
    <main data-component="DividirDemoPage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Link href="/dev/demo" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline">
        ← Demo
      </Link>
      <h1 className="font-display text-3xl font-bold">Dividir ⚡</h1>
      <DividirRapido
        yo={YO}
        grupoInicial={inicial}
        grupos={grupos.map(({ id, nombre, icono, miembros }) => ({
          id,
          nombre,
          icono,
          miembros: miembros.map(({ id: mid, nombre: mn, base, estado }) => ({ id: mid, nombre: mn, base, estado })),
        }))}
      />
    </main>
  );
}
