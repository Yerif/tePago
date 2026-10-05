export default function Loading() {
  return (
    <main data-component="Cargando" className="mx-auto flex max-w-md flex-col items-center gap-3 p-10" aria-busy="true">
      <p aria-hidden className="animate-pulse text-5xl">
        🌱
      </p>
      <p role="status" className="text-muted-foreground">
        Cargando…
      </p>
    </main>
  );
}
