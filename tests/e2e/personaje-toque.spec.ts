import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

const heroe = (page: import("@playwright/test").Page) => page.getByTestId(ids.inicio_hero.raiz);

test.describe("personaje vivo (PX-13)", () => {
  test("saluda la primera vez de la sesión y no vuelve a hacerlo al recargar", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    const personaje = heroe(page).getByTestId(ids.personaje.raiz);
    await expect(personaje).toHaveAttribute("data-saludos", "1");
    await page.reload();
    await expect(heroe(page).getByTestId(ids.personaje.raiz)).toHaveAttribute("data-saludos", "0");
  });

  test("al tocarlo reacciona con una frase nueva en el globo y no se puede spamear", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    const globo = heroe(page).getByTestId(ids.inicio_hero.globo);
    const antes = await globo.innerText();
    await expect(heroe(page).getByTestId(ids.personaje.raiz)).toHaveAttribute("data-saludos", "1"); // pasó el saludo
    await heroe(page).getByTestId(ids.inicio_hero.toque).click();
    await expect(heroe(page).getByTestId(ids.personaje.raiz)).toHaveAttribute("data-saludos", "2");
    await expect(globo).not.toHaveText(antes);
    const reaccion = await globo.innerText();
    // Un segundo toque inmediato (< 2 s) se ignora: ni brinco extra ni frase nueva.
    await heroe(page).getByTestId(ids.inicio_hero.toque).click();
    await expect(heroe(page).getByTestId(ids.personaje.raiz)).toHaveAttribute("data-saludos", "2");
    await expect(globo).toHaveText(reaccion);
  });

  test("con movimiento reducido el toque solo cambia la frase", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dev/demo?u=ana");
    const globo = heroe(page).getByTestId(ids.inicio_hero.globo);
    const antes = await globo.innerText();
    await heroe(page).getByTestId(ids.inicio_hero.toque).click();
    await expect(globo).not.toHaveText(antes);
    // La clase se aplica, pero el CSS no anima con movimiento reducido.
    const animacion = await heroe(page).getByTestId(ids.personaje.respaldo).locator("[class~=brincar]").evaluate((e) => getComputedStyle(e).animationName);
    expect(animacion).toBe("none");
  });

  test("el canvas se pausa cuando el personaje sale de pantalla y vuelve al regresar", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    const personaje = heroe(page).getByTestId(ids.personaje.raiz);
    await expect(personaje).toHaveAttribute("data-modo", "3d");
    await expect(personaje).toHaveAttribute("data-pausado", "false");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(personaje).toHaveAttribute("data-pausado", "true");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(personaje).toHaveAttribute("data-pausado", "false");
  });
});
