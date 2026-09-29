import type { Metadata } from "next";
import { Pill } from "@/components/cozy/Pill";
import { ThemeToggle } from "@/components/cozy/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "UI · Cuentas Conmigo" };

const ACENTOS = ["grass", "peach", "rose", "lemon", "mint", "lavender", "water"] as const;
const SWATCH = {
  grass: "bg-grass",
  peach: "bg-peach",
  rose: "bg-rose",
  lemon: "bg-lemon",
  mint: "bg-mint",
  lavender: "bg-lavender",
  water: "bg-water",
} as const;

export default function DevUiPage() {
  return (
    <main data-component="DevUiPage" className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Sistema de diseño 🌻</h1>
        <ThemeToggle />
      </header>

      <Card>
        <h2 className="font-display text-xl font-bold">Botones</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button>Saldar</Button>
          <Button variant="peach">Dividir</Button>
          <Button variant="rose">Recordar</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="ghost">Ahora no</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Chico</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
        </div>
      </Card>

      <Card>
        <h2 className="font-display text-xl font-bold">Pills</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill>Neutral</Pill>
          <Pill variant="grass">🌱 Jardinero</Pill>
          <Pill variant="peach">🎩 El Mecenas</Pill>
          <Pill variant="rose">👻 El Fantasma</Pill>
          <Pill variant="lemon">⚡ Rayo</Pill>
          <Pill variant="mint">🌻 El Generoso</Pill>
          <Pill variant="lavender">🏅 Alcalde</Pill>
          <Pill variant="water">Nivel 3</Pill>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="font-display text-3xl font-bold">$1,240.50</p>
          <p className="mt-1 text-muted-foreground">Le debes a Ferni 😬</p>
        </Card>
        <Card size="sm">
          <p className="font-display text-2xl font-bold">¡Todo en orden! 🌻</p>
          <p className="mt-1 text-muted-foreground">Card chica (radio 16 px)</p>
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-xl font-bold">Paleta</h2>
        <ul className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
          {ACENTOS.map((a) => (
            <li key={a} className="text-center text-xs text-muted-foreground">
              <div className={`${SWATCH[a]} h-12 rounded-2xl border-2 border-border`} />
              <span className="mt-1 block">{a}</span>
            </li>
          ))}
        </ul>
      </Card>
    </main>
  );
}
