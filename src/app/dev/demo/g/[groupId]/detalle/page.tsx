import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetalleGrupoInteractivo } from "@/components/features/DetalleGrupoInteractivo";
import { crearGrupos, YO } from "@/lib/mock/datos";

export const metadata: Metadata = { title: "Detalle del grupo (demo)" };
export const dynamic = "force-dynamic";

export default async function DetalleGrupoDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ u?: string }>;
}) {
  const [{ groupId }, { u }] = await Promise.all([params, searchParams]);
  const ahora = new Date();
  const grupos = crearGrupos(ahora);
  const grupo = grupos.find((g) => g.id === groupId);
  if (!grupo) notFound();
  const yo = grupo.miembros.some((m) => m.id === u) ? (u as string) : YO;
  return <DetalleGrupoInteractivo key={yo} grupos={grupos} grupoId={groupId} yo={yo} ahoraIso={ahora.toISOString()} />;
}
