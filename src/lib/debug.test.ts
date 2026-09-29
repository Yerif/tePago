import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDebug, reiniciarDebug, setDebug, subscribeDebug } from "./debug";

beforeEach(() => reiniciarDebug());

describe("debug store", () => {
  it("empieza vacío y mezcla los parches sin perder lo anterior", () => {
    expect(getDebug()).toEqual({});
    setDebug({ usuario: "ana" });
    setDebug({ grupo: "oaxaca", xp: { total: 395, nivel: 3 } });
    expect(getDebug()).toEqual({ usuario: "ana", grupo: "oaxaca", xp: { total: 395, nivel: 3 } });
  });

  it("devuelve el mismo objeto mientras no cambie (useSyncExternalStore)", () => {
    setDebug({ usuario: "ana" });
    expect(getDebug()).toBe(getDebug());
  });

  it("avisa a los suscritos y deja de avisar al desuscribirse", () => {
    const oyente = vi.fn();
    const baja = subscribeDebug(oyente);
    setDebug({ usuario: "a" });
    expect(oyente).toHaveBeenCalledTimes(1);
    baja();
    setDebug({ usuario: "b" });
    expect(oyente).toHaveBeenCalledTimes(1);
  });

  it("recorta la respuesta cruda de la IA a 2,000 caracteres", () => {
    setDebug({ ia: { prompt: "B1@v1", latenciaMs: 812, respuesta: "x".repeat(5000), ts: "2026-09-29T12:00:00Z" } });
    expect(getDebug().ia?.respuesta).toHaveLength(2000);
    expect(getDebug().ia?.latenciaMs).toBe(812);
  });

  it("un parche sin `ia` conserva la última llamada a la IA", () => {
    setDebug({ ia: { prompt: "B1@v1", latenciaMs: 1, respuesta: "{}", ts: "t" } });
    setDebug({ usuario: "ana" });
    expect(getDebug().ia?.prompt).toBe("B1@v1");
  });
});
