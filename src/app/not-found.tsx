import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function NotFound() {
  return (
    <main data-component="NotFoundPage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Card className="flex flex-col gap-3">
        <p aria-hidden className="text-5xl">
          🔍
        </p>
        <h1 className="font-display text-2xl font-bold">No encontramos esta página</h1>
        <p className="text-muted-foreground">Puede que el enlace esté mal escrito o que ya no exista.</p>
        <Link href="/" data-testid="not-found-inicio" className={buttonVariants({ variant: "grass" })}>
          Ir al inicio
        </Link>
      </Card>
    </main>
  );
}
