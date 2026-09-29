import { ThemeToggle } from "@/components/cozy/ThemeToggle";

export default function HomePage() {
  return (
    <main data-component="HomePage" className="mx-auto flex max-w-md items-center justify-between p-6">
      <h1 className="font-display text-3xl font-bold">Cuentas Conmigo 🌻</h1>
      <ThemeToggle />
    </main>
  );
}
