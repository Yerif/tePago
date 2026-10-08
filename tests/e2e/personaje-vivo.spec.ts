import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("una sola historia del personaje (PX-01)", () => {
  test("lo que editas en Yo se ve en el Home del grupo, en El grupo y en la barra inferior", async ({ page }) => {
    await page.goto("/dev/demo/yo?u=ana");
    await page.getByTestId(ids.perfil.nombre).fill("Anita");
    await page.getByTestId(ids.perfil.guardar).click();
    await page.getByTestId(ids.perfil.base("gato")).click();

    await page.goto("/dev/demo/g/oaxaca?u=ana");
    await expect(page.getByTestId("mi-personaje")).toContainText("Anita");
    await expect(page.getByTestId("friend-ana")).toContainText("Anita (tú)");
    await expect(page.getByTestId("friend-ana").locator("img")).toHaveAttribute("src", /gato-/);
    await expect(page.getByTestId(ids.nav.yo).locator("img")).toHaveAttribute("src", /gato-clean/); // la barra muestra tu miniatura, neutra
    await expect(page.getByTestId("mi-personaje").getByTestId(ids.personaje.raiz)).toHaveAttribute("aria-label", "Personaje Gato");
  });

  test("Yo, Home y Detalle dicen el mismo nivel y XP tras ganar puntos", async ({ page }) => {
    // Beto paga a Ferni (+50 XP al confirmarse).
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await page.getByTestId(ids.cuenta.pagar("ferni")).click();
    await page.getByTestId(ids.hoja.confirmar).click();
    await page.goto("/dev/demo?u=ferni");
    await page.locator(ids.pagos.confirmar).click();

    const leer = async (url: string) => {
      await page.goto(url);
      return [await page.getByTestId("xp-nivel").first().innerText(), await page.getByTestId("xp-valor").first().innerText()];
    };
    const yo = await leer("/dev/demo/yo?u=beto");
    const detalle = await leer("/dev/demo/g/oaxaca/detalle?u=beto");
    const home = await leer("/dev/demo/g/oaxaca?u=beto");
    expect(yo).toEqual(["Nivel 1", "80 / 100 XP"]); // 30 + 50
    expect(detalle).toEqual(yo);
    expect(home).toEqual(yo);
  });

  test("«Debes $0.00» no va en rosa y en modo claro debes y te deben se distinguen por color", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("cc-theme", "light"));
    await page.goto("/dev/demo?u=luis");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$0.00");
    const color = (id: string) => page.getByTestId(id).evaluate((el) => getComputedStyle(el).color);
    const debes0 = await color(ids.inicio_resumen.debes);
    await page.goto("/dev/demo?u=ana");
    const debesAna = await color(ids.inicio_resumen.debes);
    const teDebenAna = await page.getByTestId(ids.inicio_resumen.teDeben).evaluate((el) => getComputedStyle(el).color);
    expect(debesAna).not.toBe(debes0); // sin deuda, neutro
    expect(debesAna).not.toBe(teDebenAna); // en light "debes" (rosa oscuro) y "te deben" (verde oscuro) ya no son el mismo café
    expect(debesAna).toBe("rgb(163, 34, 76)");
  });
});

test.describe("carga del personaje sin parpadeo (PX-02)", () => {
  test("siempre hay una figura: la miniatura PNG primero y el 3D después, con un fundido", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca?u=ana");
    const raiz = page.getByTestId("mi-personaje").getByTestId(ids.personaje.raiz);
    await expect(raiz.getByTestId("personaje-respaldo").locator("img")).toHaveAttribute("src", /\/personajes\/.*\.png/);
    await expect(raiz).toHaveAttribute("data-modo", "3d");
    await expect(raiz).toHaveAttribute("data-listo", "true"); // primer cuadro 3D dibujado
    await expect(raiz.getByTestId("personaje-respaldo")).toHaveCSS("opacity", "0");
  });

  test("sin WebGL el personaje es la miniatura PNG de su base, no un emoji", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, tipo: string, ...args: unknown[]) {
        if (tipo === "webgl" || tipo === "webgl2") return null;
        return (original as (...a: unknown[]) => unknown).call(this, tipo, ...args) as never;
      } as typeof original;
    });
    await page.goto("/dev/demo/g/oaxaca?u=ana");
    const raiz = page.getByTestId("mi-personaje").getByTestId(ids.personaje.raiz);
    await expect(raiz).toHaveAttribute("data-modo", "2d");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(raiz.getByTestId("personaje-respaldo").locator("img")).toBeVisible();
    await expect(raiz.getByTestId("personaje-respaldo")).toHaveCSS("opacity", "1");
  });

  test("con «ahorro de datos» no se descarga el 3D", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
    });
    await page.goto("/dev/demo/g/oaxaca?u=ana");
    await expect(page.getByTestId("mi-personaje").getByTestId(ids.personaje.raiz)).toHaveAttribute("data-modo", "2d");
    await expect(page.locator("canvas")).toHaveCount(0);
  });
});

test.describe("medidor del 3D en ?debug=1 (PX-06)", () => {
  test("muestra el primer cuadro, los fps y los draw calls", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca?u=ana&debug=1");
    await page.getByTestId("debug-toggle").click();
    await expect(page.getByTestId("debug-personaje")).toContainText(/1\.er cuadro \d+ ms · \d+ fps \(p5 \d+\) · \d+ draw calls/, { timeout: 15_000 });
  });
});
