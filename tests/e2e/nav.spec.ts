import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

const PESTANAS = [
  { ruta: "/dev/demo?u=ana", activa: ids.nav.inicio },
  { ruta: "/dev/demo/dividir?u=ana", activa: ids.nav.dividir },
  { ruta: "/dev/demo/grupos?u=ana", activa: ids.nav.grupos },
  { ruta: "/dev/demo/g/oaxaca?u=ana", activa: ids.nav.grupos },
  { ruta: "/dev/demo/yo?u=ana", activa: ids.nav.yo },
];

test.describe("barra inferior: una sola pestaña se ve seleccionada", () => {
  for (const { ruta, activa } of PESTANAS) {
    test(`${ruta}`, async ({ page }) => {
      await page.goto(ruta);
      const nav = page.getByRole("navigation", { name: "Principal" });
      // Exactamente una pestaña con indicador, y es la que corresponde; Dividir no parece "siempre activa".
      await expect(nav.getByTestId("nav-activa")).toHaveCount(1);
      await expect(nav.getByTestId(activa)).toHaveAttribute("aria-current", "page");
      await expect(nav.getByTestId(activa).getByTestId("nav-activa")).toHaveCount(1);
      await expect(nav.locator("[aria-current=page]")).toHaveCount(1);
    });
  }
});
