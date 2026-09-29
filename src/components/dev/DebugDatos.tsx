"use client";

import { useEffect } from "react";
import { setDebug, type DatosDebug } from "@/lib/debug";

/** No pinta nada: alimenta el DebugPanel con lo que la pantalla ya conoce. */
export function DebugDatos(props: DatosDebug) {
  const { usuario, grupo, estadoAvatar, xp, ia } = props;
  useEffect(() => {
    setDebug({ usuario, grupo, estadoAvatar, xp, ia });
  }, [usuario, grupo, estadoAvatar, xp?.total, xp?.nivel, ia]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
