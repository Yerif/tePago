import { expect, test } from "@playwright/test";

// CLAUDE.md §11: objetivos táctiles ≥ 44×44 px en móvil (UX-08).
const PANTALLAS = [
  "/",
  "/dev/demo?u=ana",
  "/dev/demo/grupos?u=ana",
  "/dev/demo/yo?u=ana",
  "/dev/demo/g/oaxaca?u=ana",
  "/dev/demo/g/oaxaca/detalle?u=ana",
  "/dev/demo/dividir?u=ana",
];

test.describe("objetivos táctiles", () => {
  for (const ruta of PANTALLAS) {
    test(`${ruta}: todo lo tocable mide ≥ 44 px`, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState("networkidle");
      const chicos = await page.evaluate(() =>
        [...document.querySelectorAll("a,button,input,select,summary,textarea,[role=button]")]
          .map((e) => ({ nombre: `${e.tagName} ${(e.getAttribute("data-testid") ?? e.textContent ?? "").trim().slice(0, 30)}`, r: e.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44))
          .map(({ nombre, r }) => `${nombre} ${Math.round(r.width)}x${Math.round(r.height)}`),
      );
      expect(chicos).toEqual([]);
    });
  }
});
