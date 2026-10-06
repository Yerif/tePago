import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("personaje 3D", () => {
  test("se dibuja en 3D con un solo canvas y responde a estado, base, skin y nivel", async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto("/dev/personaje");
    const raiz = page.getByTestId(ids.personaje.raiz);
    await expect(raiz).toHaveAttribute("data-modo", "3d");
    await expect(page.locator("canvas")).toHaveCount(1);

    for (const estado of ["mild", "rekt", "clean"]) {
      await page.getByTestId(ids.personaje.estado(estado)).click();
      await expect(page.getByTestId(ids.personaje.estado(estado))).toHaveAttribute("aria-pressed", "true");
    }
    await page.getByTestId(ids.personaje.base("zorro")).click();
    await page.getByTestId(ids.personaje.skin("leyenda")).click();
    await page.getByTestId(ids.personaje.nivel).fill("10");
    await expect(page.locator("canvas")).toHaveCount(1);
    expect(errores).toEqual([]);
  });

  test("sin WebGL cae al avatar 2D en lugar de romperse", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, tipo: string, ...resto: unknown[]) {
        return /webgl/.test(tipo) ? null : (original as (...a: unknown[]) => unknown).call(this, tipo, ...resto);
      } as typeof original;
    });
    await page.goto("/dev/personaje");
    await expect(page.getByTestId(ids.personaje.raiz)).toHaveAttribute("data-modo", "2d");
    await expect(page.getByTestId(ids.personaje.respaldo)).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("el Home del grupo muestra el personaje 3D de quien mira", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca");
    await expect(page.getByTestId(ids.personaje.raiz)).toHaveAttribute("data-modo", "3d");
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test("festeja al pedirlo y cuando confirman el pago de una deuda completa, no al pagar", async ({ page }) => {
    await page.goto("/dev/personaje");
    const raiz = page.getByTestId(ids.personaje.raiz);
    await expect(raiz).toHaveAttribute(ids.personaje.celebraciones, "0");
    await page.getByTestId(ids.personaje.festejar).click();
    await expect(raiz).toHaveAttribute(ids.personaje.celebraciones, "1");

    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    const beto = page.getByTestId(ids.personaje.raiz);
    await page.getByTestId(ids.saldar.monto("beto", "ferni")).fill("100");
    await page.getByTestId(ids.saldar.abonar("beto", "ferni")).click();
    await page.getByTestId(ids.saldar.todo("beto", "ferni")).click();
    // Pagar solo deja pendiente: el personaje no festeja hasta que Ferni lo confirme.
    await expect(beto).toHaveAttribute(ids.personaje.celebraciones, "0");

    await page.goto("/dev/demo?u=ferni");
    await page.locator(ids.pagos.confirmar).first().click();
    await page.locator(ids.pagos.confirmar).first().click();

    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await expect(page.getByTestId(ids.personaje.raiz)).toHaveAttribute(ids.personaje.celebraciones, "1");
  });
});
