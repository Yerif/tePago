"use client";

import { ErrorPantalla } from "@/components/features/ErrorPantalla";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorPantalla error={error} reintentar={reset} />;
}
