import Link from "next/link";
import { ThemeToggle } from "@/components/cozy/ThemeToggle";
import { ListaGrupos } from "@/components/features/ListaGrupos";
import { buttonVariants } from "@/components/ui/Button";
import { esEntornoDev } from "@/lib/entorno";
import { crearGrupos, YO } from "@/lib/mock/datos";

// Las fechas del demo son relativas a "ahora": sin esto se congelarían al compilar.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const dev = esEntornoDev();
  return (
    <main data-component="HomePage" className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Cuentas Conmigo 🌻</h1>
        <ThemeToggle />
      </div>
      {dev ? (
        <>
          <p className="text-muted-foreground">Prototipo con datos de ejemplo. Tus pagos de prueba se guardan en este navegador; «Reiniciar» empieza de cero.</p>
          <section aria-labelledby="titulo-grupo" className="flex flex-col gap-3">
            <h2 id="titulo-grupo" className="font-display text-xl font-bold">
              Elige tu grupo
            </h2>
            <ListaGrupos grupos={crearGrupos(new Date())} yo={YO} base="/dev/demo/g" />
          </section>
          <div className="flex flex-col gap-3">
            <Link href="/dev/demo/dividir" data-testid="ir-dividir" className={buttonVariants({ variant: "grass", size: "lg" })}>
              Dividir ⚡
            </Link>
            <Link href="/dev/demo/yo" data-testid="ir-yo" className={buttonVariants({ variant: "outline" })}>
              Mi personaje 🐻
            </Link>
            <Link href="/dev/demo" data-testid="ir-demo" className={buttonVariants({ variant: "ghost" })}>
              Más pantallas de prueba
            </Link>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">Muy pronto: divide gastos con tu grupo y sube de nivel pagando a tiempo.</p>
      )}
    </main>
  );
}
