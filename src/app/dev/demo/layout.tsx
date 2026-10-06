import { Suspense } from "react";
import { NavInferior } from "@/components/features/NavInferior";
import { crearGrupos, YO } from "@/lib/mock/datos";

/** Todo el demo comparte la barra de navegación inferior; el contenido deja espacio para ella. */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  const bases = Object.fromEntries(crearGrupos(new Date()).flatMap((g) => g.miembros.map((m) => [m.id, m.base])));
  return (
    <div className="pb-24">
      {children}
      <Suspense fallback={null}>
        <NavInferior yoPorDefecto={YO} bases={bases} />
      </Suspense>
    </div>
  );
}
