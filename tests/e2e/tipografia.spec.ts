import { expect, test } from "@playwright/test";

// Texto con información: mínimo 14 px (13 px en las etiquetas de la barra inferior) (UX2-21).
const PANTALLAS = ["/dev/demo?u=ana", "/dev/demo/dividir?u=ana", "/dev/demo/grupos?u=ana", "/dev/demo/g/oaxaca?u=ana", "/dev/demo/g/oaxaca/detalle?u=ana", "/dev/demo/yo?u=ana"];

test.describe("tamaño mínimo de letra", () => {
  for (const ruta of PANTALLAS) {
    test(ruta, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState("networkidle");
      const chicos = await page.evaluate(() => {
        const res: string[] = [];
        for (const e of document.querySelectorAll<HTMLElement>("body *")) {
          if (e.closest("nav[aria-label=Principal]") || e.closest("nextjs-portal") || e.getAttribute("data-testid") === "avatar-skin") continue; // el sello de la skin es decorativo
          const tieneTexto = [...e.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim().length > 0);
          if (!tieneTexto) continue;
          const r = e.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const px = parseFloat(getComputedStyle(e).fontSize);
          if (px < 14) res.push(`${(e.textContent ?? "").trim().slice(0, 30)} (${px}px)`);
        }
        return res;
      });
      expect(chicos).toEqual([]);
    });
  }

  test("las etiquetas de la barra inferior miden al menos 13 px", async ({ page }) => {
    await page.goto("/dev/demo?u=ana");
    const px = await page.getByTestId("nav-inicio").evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(px).toBeGreaterThanOrEqual(13);
  });
});
