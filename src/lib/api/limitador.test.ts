import { describe, expect, it } from "vitest";
import { crearLimitadorEnMemoria } from "./limitador";

describe("limitador en memoria (ventana deslizante)", () => {
  const regla = { limite: 3, ventanaSeg: 60 };

  it("permite hasta el límite y bloquea la siguiente, diciendo cuándo reintentar", async () => {
    let t = 1_000_000;
    const consumir = crearLimitadorEnMemoria(() => t);
    for (let i = 0; i < 3; i++) expect(await consumir("k", regla)).toEqual({ permitido: true, reintentarEnSeg: 0 });
    t += 10_000;
    expect(await consumir("k", regla)).toEqual({ permitido: false, reintentarEnSeg: 50 }); // la 1ª llamada sale a los 60 s
  });

  it("la ventana se desliza: libera un lugar cuando la llamada más vieja sale", async () => {
    let t = 0;
    const consumir = crearLimitadorEnMemoria(() => t);
    await consumir("k", regla); // t=0
    t = 20_000;
    await consumir("k", regla);
    t = 40_000;
    await consumir("k", regla);
    t = 59_999;
    expect((await consumir("k", regla)).permitido).toBe(false);
    t = 60_001; // ya salió la de t=0
    expect((await consumir("k", regla)).permitido).toBe(true);
    expect((await consumir("k", regla)).permitido).toBe(false); // otra vez lleno (20 s, 40 s, 60.001 s)
  });

  it("las llaves son independientes", async () => {
    const consumir = crearLimitadorEnMemoria(() => 0);
    for (let i = 0; i < 3; i++) await consumir("a", regla);
    expect((await consumir("a", regla)).permitido).toBe(false);
    expect((await consumir("b", regla)).permitido).toBe(true);
  });

  it("los intentos bloqueados no extienden el bloqueo", async () => {
    let t = 0;
    const consumir = crearLimitadorEnMemoria(() => t);
    for (let i = 0; i < 3; i++) await consumir("k", regla);
    for (t = 1000; t < 30_000; t += 1000) expect((await consumir("k", regla)).permitido).toBe(false);
    t = 60_001;
    expect((await consumir("k", regla)).permitido).toBe(true);
  });

  it("usa el reloj real si no se le da uno", async () => {
    const consumir = crearLimitadorEnMemoria();
    expect((await consumir("k", { limite: 1, ventanaSeg: 60 })).permitido).toBe(true);
    expect((await consumir("k", { limite: 1, ventanaSeg: 60 })).permitido).toBe(false);
  });
});
