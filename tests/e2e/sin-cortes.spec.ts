import { expect, test } from "@playwright/test";

// Criterio de salida de UAT-1 (docs/UAT.md §6): 0 textos cortados con "…" a 375 px (UX2-06).
const PANTALLAS = [
  "/dev/demo?u=ana",
  "/dev/demo/grupos?u=ana",
  "/dev/demo/g/oaxaca?u=ana",
  "/dev/demo/g/oaxaca/detalle?u=ana",
  "/dev/demo/g/playa/detalle?u=ana",
  "/dev/demo/yo?u=ana",
];

test.describe("textos sin cortar", () => {
  for (const ruta of PANTALLAS) {
    test(`${ruta}: ningún texto termina en «…»`, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState("networkidle");
      const cortados = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("body *")]
          .filter((e) => {
            const cs = getComputedStyle(e);
            const r = e.getBoundingClientRect();
            if (r.width === 0 || r.height === 0 || !e.textContent?.trim()) return false;
            const elipsis = cs.textOverflow === "ellipsis" && e.scrollWidth > e.clientWidth;
            const clamp = cs.webkitLineClamp !== "none" && cs.webkitLineClamp !== "" && e.scrollHeight > e.clientHeight + 1;
            return elipsis || clamp;
          })
          .map((e) => (e.textContent ?? "").trim().slice(0, 40)),
      );
      expect(cortados).toEqual([]);
    });
  }
});
