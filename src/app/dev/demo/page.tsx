import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/cozy/Pill";
import { Card } from "@/components/ui/Card";
import { ListaGrupos } from "@/components/features/ListaGrupos";
import { ResumenInicio } from "@/components/features/ResumenInicio";
import { crearGrupos, YO } from "@/lib/mock/datos";

export const metadata: Metadata = { title: "Demo · Cuentas Conmigo" };
export const dynamic = "force-dynamic"; // las fechas de ejemplo son relativas a "ahora"

export default async function DemoIndexPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams;
  const grupos = crearGrupos(new Date());
  const miembros = new Map(grupos.flatMap((g) => g.miembros.map((m) => [m.id, m] as const)));
  const yo = u && miembros.has(u) ? u : YO;
  return (
    <main data-component="DemoIndexPage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-3xl font-bold">Demo 🌻</h1>
      <Pill variant="lemon" className="self-start">
        Datos de ejemplo · sin Supabase
      </Pill>
      <p className="text-muted-foreground">
        Pantallas con datos ficticios para probar la UI desde el celular. Nada se guarda: al recargar vuelve todo a como estaba.
      </p>

      <nav aria-label="Probar como" className="flex flex-wrap gap-2">
        {[...miembros.values()].map((m) => (
          <Link key={m.id} href={`/dev/demo?u=${m.id}`} aria-current={m.id === yo ? "page" : undefined} data-testid={`inicio-probar-${m.id}`} className="inline-flex min-h-11 items-center">
            <Pill variant={m.id === yo ? "grass" : "neutral"}>{m.nombre}</Pill>
          </Link>
        ))}
      </nav>

      <h2 className="mt-2 font-display text-xl font-bold">Hola, {miembros.get(yo)?.nombre} 👋</h2>
      <ResumenInicio grupos={grupos} yo={yo} base="/dev/demo/g" />

      <h2 className="mt-2 font-display text-xl font-bold">Home de grupo</h2>
      <ListaGrupos grupos={grupos} yo={yo} base="/dev/demo/g" />

      <h2 className="mt-2 font-display text-xl font-bold">Dividir</h2>
      <Link href="/dev/demo/dividir" data-testid="demo-dividir">
        <Card size="sm" className="flex items-center gap-3">
          <span aria-hidden className="text-3xl">
            ⚡
          </span>
          <div>
            <p className="font-semibold">Modo rápido</p>
            <p className="text-sm text-muted-foreground">Monto → confirmar. Cuenta las interacciones.</p>
          </div>
        </Card>
      </Link>

      <h2 className="mt-2 font-display text-xl font-bold">Confirmar un gasto</h2>
      <Link href="/dev/demo/ia" data-testid="demo-ia">
        <Card size="sm" className="flex items-center gap-3">
          <span aria-hidden className="text-3xl">
            ✅
          </span>
          <div>
            <p className="font-semibold">Revisar lo que se entendió</p>
            <p className="text-sm text-muted-foreground">Corrige monto, quién pagó y entre quiénes antes de guardar.</p>
          </div>
        </Card>
      </Link>

      <h2 className="mt-2 font-display text-xl font-bold">Perfil</h2>
      <Link href="/dev/demo/yo" data-testid="demo-yo">
        <Card size="sm" className="flex items-center gap-3">
          <span aria-hidden className="text-3xl">
            🐻
          </span>
          <div>
            <p className="font-semibold">Yo: personaje, badges y skins</p>
            <p className="text-sm text-muted-foreground">Cambia de persona para ver qué skins se desbloquean.</p>
          </div>
        </Card>
      </Link>

      <h2 className="mt-2 font-display text-xl font-bold">Sistema de diseño</h2>
      <Link href="/dev/ui" data-testid="demo-ui">
        <Card size="sm" className="flex items-center gap-3">
          <span aria-hidden className="text-3xl">
            🎨
          </span>
          <p className="font-semibold">Botones, pills, cards y paleta</p>
        </Card>
      </Link>
    </main>
  );
}
