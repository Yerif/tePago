import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill } from "@/components/cozy/Pill";
import { FriendRow } from "@/components/features/FriendRow";
import { GastoDetalle } from "@/components/features/GastoDetalle";
import { Card } from "@/components/ui/Card";
import { crearGrupos, YO } from "@/lib/mock/datos";
import { balancesNetos } from "@/lib/splits/balances";
import { deudasEntrePersonas } from "@/lib/splits/deudas";
import { formatoMXN } from "@/lib/splits/formato";

export const metadata: Metadata = { title: "Detalle del grupo (demo)" };
export const dynamic = "force-dynamic";

export default async function DetalleGrupoDemoPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const ahora = new Date();
  const grupo = crearGrupos(ahora).find((g) => g.id === groupId);
  if (!grupo) notFound();

  const nombres = Object.fromEntries(grupo.miembros.map((m) => [m.id, m.nombre]));
  const balances = balancesNetos(grupo.gastos);
  const deudas = deudasEntrePersonas(grupo.gastos);
  const gastos = [...grupo.gastos].sort((a, b) => b.fecha.localeCompare(a.fecha));

  const frase = (deudor: string, acreedor: string, monto: string) => {
    if (deudor === YO) return `Le debes ${monto} a ${nombres[acreedor]} 😬`;
    if (acreedor === YO) return `${nombres[deudor]} te debe ${monto}`;
    return `${nombres[deudor]} le debe ${monto} a ${nombres[acreedor]}`;
  };

  return (
    <main data-component="DetalleGrupoDemoPage" className="mx-auto flex max-w-md flex-col gap-5 p-6">
      <Link href={`/dev/demo/g/${grupo.id}`} className="text-sm text-muted-foreground underline">
        ← {grupo.icono} {grupo.nombre}
      </Link>
      <h1 className="font-display text-3xl font-bold">Detalle</h1>
      <Pill variant="lemon" className="self-start">
        Datos de ejemplo · sin Supabase
      </Pill>

      <section>
        <h2 className="font-display text-xl font-bold">¿Quién le debe a quién?</h2>
        <Card size="sm" className="mt-2">
          {deudas.length === 0 ? (
            <p data-testid="sin-deudas">¡Todo en orden! 🌻</p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="deudas">
              {deudas.map((d) => (
                <li key={`${d.deudorId}>${d.acreedorId}`} data-testid={`deuda-${d.deudorId}-${d.acreedorId}`} className={d.deudorId === YO ? "font-semibold text-rose-text" : d.acreedorId === YO ? "font-semibold text-grass-text" : ""}>
                  {frase(d.deudorId, d.acreedorId, formatoMXN(d.centavos))}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Balances</h2>
        <Card size="sm" className="mt-2">
          <ul className="divide-y-2 divide-border">
            {grupo.miembros.map((m) => (
              <FriendRow key={m.id} miembro={m} balanceCentavos={balances[m.id] ?? 0} esYo={m.id === YO} />
            ))}
          </ul>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl font-bold">Gastos</h2>
        <div className="mt-2 flex flex-col gap-3">
          {gastos.map((g) => (
            <GastoDetalle key={g.id} gasto={g} nombres={nombres} ahora={ahora} />
          ))}
        </div>
      </section>
    </main>
  );
}
