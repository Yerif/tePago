/** Herramientas de desarrollo (/dev/ui, DebugPanel): visibles en dev y en previews de Vercel, nunca en producción. */
export function esEntornoDev(env: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env): boolean {
  if (env.VERCEL_ENV) return env.VERCEL_ENV !== "production";
  return env.NODE_ENV !== "production";
}
