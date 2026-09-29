import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { esEntornoDev } from "@/lib/entorno";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Todo lo que vive bajo /dev existe solo en desarrollo y previews: 404 en producción. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (!esEntornoDev()) notFound();
  return children;
}
