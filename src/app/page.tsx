import Link from "next/link";
import { ThemeToggle } from "@/components/cozy/ThemeToggle";
import { buttonVariants } from "@/components/ui/Button";
import { esEntornoDev } from "@/lib/entorno";

export default function HomePage() {
  return (
    <main data-component="HomePage" className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Cuentas Conmigo 🌻</h1>
        <ThemeToggle />
      </div>
      {esEntornoDev() && (
        <Link href="/dev/demo" data-testid="ir-demo" className={buttonVariants({ variant: "peach" })}>
          Ver demo con datos de ejemplo
        </Link>
      )}
    </main>
  );
}
