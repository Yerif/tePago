import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/cozy/Pill";
import { Card } from "@/components/ui/Card";
import { crearGrupos } from "@/lib/mock/datos";

export const metadata: Metadata = { title: "Demo · Cuentas Conmigo" };
export const dynamic = "force-dynamic"; // las fechas de ejemplo son relativas a "ahora"

export default function DemoIndexPage() {
  const grupos = crearGrupos(new Date());
  return (
    <main data-component="DemoIndexPage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="font-display text-3xl font-bold">Demo 🌻</h1>
      <Pill variant="lemon" className="self-start">
        Datos de ejemplo · sin Supabase
      </Pill>
      <p className="text-muted-foreground">
        Pantallas con datos ficticios para probar la UI desde el celular. Nada se guarda: al recargar vuelve todo a como estaba.
      </p>

      <h2 className="mt-2 font-display text-xl font-bold">Home de grupo</h2>
      {grupos.map((g) => (
        <Link key={g.id} href={`/dev/demo/g/${g.id}`} data-testid={`demo-grupo-${g.id}`}>
          <Card size="sm" className="flex items-center gap-3">
            <span aria-hidden className="text-3xl">
              {g.icono}
            </span>
            <div>
              <p className="font-semibold">{g.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {g.miembros.length} personas · {g.gastos.length} gastos
              </p>
            </div>
          </Card>
        </Link>
      ))}

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
