import { NextResponse } from "next/server";
import { esEntornoDev } from "@/lib/entorno";

/**
 * `/dev/*` (demo y sistema de diseño) solo existe en desarrollo y previews. El `notFound()` del layout da 404,
 * pero Next igual manda el árbol de la página en el cuerpo; aquí se corta antes de renderizar nada.
 * Cuando llegue Supabase, este archivo también refresca la sesión (CLAUDE.md §5).
 */
export function middleware() {
  if (esEntornoDev()) return NextResponse.next();
  return new NextResponse(null, { status: 404 });
}

export const config = { matcher: "/dev/:path*" };
