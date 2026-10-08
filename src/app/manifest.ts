import type { MetadataRoute } from "next";

/** Para "agregar a pantalla de inicio". Los colores son los del tema oscuro, que es el default (CLAUDE.md §10). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cuentas Conmigo",
    short_name: "Cuentas",
    description: "Divide gastos con tu grupo y sube de nivel pagando a tiempo.",
    lang: "es-MX",
    start_url: "/",
    display: "standalone",
    background_color: "#1A1F2E",
    theme_color: "#1A1F2E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
