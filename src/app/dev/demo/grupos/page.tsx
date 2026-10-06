import type { Metadata } from "next";
import { ListaGrupos } from "@/components/features/ListaGrupos";
import { crearGrupos, YO } from "@/lib/mock/datos";

export const metadata: Metadata = { title: "Grupos (demo)" };
export const dynamic = "force-dynamic";

export default async function GruposDemoPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams;
  const grupos = crearGrupos(new Date());
  const yo = grupos.some((g) => g.miembros.some((m) => m.id === u)) ? (u as string) : YO;
  return (
    <main data-component="GruposDemoPage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-3xl font-bold">Grupos 👥</h1>
      <p className="text-muted-foreground">Los que necesitan algo de ti van primero.</p>
      <ListaGrupos grupos={grupos} yo={yo} base="/dev/demo/g" />
    </main>
  );
}
