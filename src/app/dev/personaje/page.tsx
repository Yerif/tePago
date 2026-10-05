import type { Metadata } from "next";
import Link from "next/link";
import { PersonajeLab } from "@/components/personaje/PersonajeLab";
import { Pill } from "@/components/cozy/Pill";

export const metadata: Metadata = { title: "Personaje 3D (demo)" };

export default function PersonajePage() {
  return (
    <main data-component="PersonajePage" className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <Link href="/dev/demo" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline">
        ← Demo
      </Link>
      <h1 className="font-display text-3xl font-bold">Personaje 3D 🌻</h1>
      <Pill variant="lemon" className="self-start">
        Laboratorio · solo desarrollo y previews
      </Pill>
      <PersonajeLab />
    </main>
  );
}
