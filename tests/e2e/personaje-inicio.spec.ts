import { expect, test, type Page } from "@playwright/test";
import { ids } from "./selectors";

const inicio = (page: Page, u: string) => page.goto(`/dev/demo?u=${u}`);

async function betoLePagaA(page: Page, persona: string) {
  await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
  await page.getByTestId(ids.cuenta.pagar(persona)).click();
  await page.getByTestId(ids.hoja.confirmar).click();
}
async function confirmaEn(page: Page, persona: string) {
  await inicio(page, persona);
  await page.locator(ids.pagos.confirmar).click();
}

test.describe("héroe del personaje en el Inicio (PX-03)", () => {
  test("tu personaje a 128 px, con globo, nivel y el camino a un mejor clima; el primer Pagar sigue a la vista", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await inicio(page, "ana");
    const hero = page.getByTestId(ids.inicio_hero.raiz);
    const personaje = hero.getByTestId(ids.personaje.raiz);
    await expect(personaje).toHaveAttribute("data-modo", "3d");
    await expect(page.locator("canvas")).toHaveCount(1); // un solo canvas por pantalla
    const caja = await personaje.boundingBox();
    expect(Math.round(caja?.width ?? 0)).toBe(128);
    await expect(page.getByTestId(ids.inicio_hero.globo)).toContainText("Llueve por aquí");
    await expect(hero.getByTestId("xp-nivel")).toContainText("Nivel 3");
    await expect(hero.getByTestId(ids.inicio_resumen.estado)).toHaveText("Bajo la lluvia");
    await expect(page.getByTestId(ids.inicio_hero.camino).first()).toContainText(/Paga a .* → «/);
    await expect(page.getByTestId(ids.cuenta.pagar("nico"))).toBeInViewport(); // el héroe no empuja "Pagar" fuera de la primera pantalla
  });

  test("quien está radiante y sin deudas ve su personaje celebrando, sin camino", async ({ page }) => {
    await inicio(page, "ferni");
    await expect(page.getByTestId(ids.inicio_hero.globo)).toContainText("Todo en orden");
    await expect(page.getByTestId(ids.inicio_hero.camino)).toHaveCount(0);
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$0.00");
  });

  test("al pagar, el personaje reacciona con una frase pequeña (y al abonar, dice cuánto falta)", async ({ page }) => {
    await inicio(page, "ana");
    await page.getByTestId(ids.cuenta.pagar("nico")).click();
    await page.getByTestId(ids.hoja.monto).fill("500");
    await page.getByTestId(ids.hoja.confirmar).click();
    await expect(page.getByTestId(ids.inicio_hero.globo)).toContainText("¡Buen abono a Nico! Faltan $791.67");
    await page.getByTestId(ids.toast.deshacer).click();
    await expect(page.getByTestId(ids.inicio_hero.globo)).toContainText("Pago cancelado");
  });
});

test.describe("la recompensa llega al abrir la app (PX-04)", () => {
  test("Beto abre el Inicio tras la confirmación: un solo aviso con su XP, su personaje festeja y no se repite", async ({ page }) => {
    await betoLePagaA(page, "ferni");
    await confirmaEn(page, "ferni");

    await inicio(page, "beto");
    // Un evento, un aviso (UX2-03): la XP va en «Ferni confirmó tu pago», sin una segunda tarjeta de revelación.
    await expect(page.getByTestId(ids.revelacion.raiz)).toHaveCount(0);
    await expect(page.locator(ids.pagos.avisoXp)).toHaveText("+50 XP ⚡");
    await expect(page.getByTestId(ids.inicio_hero.raiz).getByTestId(ids.personaje.raiz)).toHaveAttribute(ids.personaje.celebraciones, "1");

    await page.locator(ids.pagos.avisoOk).click();
    await expect(page.locator(ids.pagos.avisoXp)).toHaveCount(0);

    // La siguiente vez que abre la app ya no se repite.
    await inicio(page, "beto");
    await expect(page.getByTestId(ids.revelacion.raiz)).toHaveCount(0);
    await expect(page.getByTestId(ids.inicio_hero.raiz).getByTestId(ids.personaje.raiz)).toHaveAttribute(ids.personaje.celebraciones, "0");
  });

  test("Beto paga a los tres: su personaje pasa de «Bajo la lluvia» a «Radiante» y sube de nivel", async ({ page }) => {
    for (const persona of ["ferni", "caro", "ana"]) {
      await betoLePagaA(page, persona);
      await confirmaEn(page, persona);
    }
    await inicio(page, "beto");
    await expect(page.getByTestId(ids.revelacion.raiz)).toContainText("¡Nivel 2!");
    await expect(page.getByTestId(ids.revelacion.estado)).toHaveText("Bajo la lluvia → Radiante");
    await expect(page.getByTestId(ids.revelacion.nivel)).toHaveText("Nivel 1 → Nivel 2");
    await page.getByTestId(ids.revelacion.ok).click();
    await expect(page.getByTestId(ids.revelacion.raiz)).toHaveCount(0);
  });

  test("«Reiniciar» deja el demo repetible: no revela nada la siguiente vez", async ({ page }) => {
    await betoLePagaA(page, "ferni");
    await confirmaEn(page, "ferni");
    await inicio(page, "beto");
    await page.getByTestId(ids.pagos.herramientas).locator("summary").click();
    await page.getByTestId(ids.pagos.reiniciar).click();
    await inicio(page, "beto");
    await expect(page.getByTestId(ids.revelacion.raiz)).toHaveCount(0);
  });
});
