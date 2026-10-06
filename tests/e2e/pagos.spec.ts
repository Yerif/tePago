import { expect, test, type Page } from "@playwright/test";
import { ids } from "./selectors";

const inicio = (page: Page, u: string) => page.goto(`/dev/demo?u=${u}`);

/** Ana le paga todo lo que debe a Nico desde su inicio (hoja de pago → "Ya le pagué"). */
async function anaLePagaANico(page: Page) {
  await inicio(page, "ana");
  await page.getByTestId(ids.cuenta.pagar("nico")).click();
  await page.getByTestId(ids.hoja.confirmar).click();
}

test.describe("pagos: inicio, hoja, confirmación y reversa", () => {
  test("el inicio muestra cuánto debes en total y una fila por persona (sin repetir a Nico)", async ({ page }) => {
    await inicio(page, "ana");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$5,631.68");
    await expect(page.getByTestId(ids.inicio_resumen.texto)).toContainText("a 7 personas");
    await expect(page.getByTestId(ids.inicio_resumen.teDeben)).toHaveText("$3,050.29");
    const lista = page.getByTestId(ids.inicio_resumen.teToca);
    await expect(lista.getByTestId(ids.cuenta.fila("nico"))).toHaveCount(1);
    await expect(lista.getByTestId(ids.cuenta.monto("nico"))).toHaveText("$1,291.67"); // playa $991.67 + peda $300
    // Solo 4 filas a la vista; el resto, tras "Ver las 7 personas".
    await expect(page.getByTestId(ids.cuenta.pagar("luis"))).toHaveCount(0);
    await page.getByTestId(ids.inicio_resumen.verTodas).click();
    await expect(page.getByTestId(ids.cuenta.pagar("luis"))).toBeVisible();
  });

  test("las herramientas de prueba no estorban: viven plegadas debajo", async ({ page }) => {
    await inicio(page, "ana");
    await expect(page.getByTestId(ids.pagos.herramientas)).not.toHaveAttribute("open", "");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toBeInViewport();
  });

  test("barra inferior: 4 destinos fijos", async ({ page }) => {
    await inicio(page, "ana");
    for (const destino of [ids.nav.inicio, ids.nav.dividir, ids.nav.grupos, ids.nav.yo]) await expect(page.getByTestId(destino)).toBeVisible();
    await page.getByTestId(ids.nav.grupos).click();
    await expect(page).toHaveURL(/\/dev\/demo\/grupos\?u=ana/);
    await page.getByTestId(ids.nav.dividir).click();
    await expect(page).toHaveURL(/\/dev\/demo\/dividir\?u=ana/);
  });

  test("pagar son 2 toques, queda pendiente y se puede deshacer", async ({ page }) => {
    await anaLePagaANico(page);
    await expect(page.getByTestId(ids.toast.raiz)).toContainText("Avisamos a Nico");
    // Pendiente: la deuda sigue contando y no se puede pagar otra vez.
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$5,631.68");
    await expect(page.getByTestId(ids.cuenta.pendiente("nico"))).toContainText("$1,291.67");
    await expect(page.getByTestId(ids.cuenta.pagar("nico"))).toHaveCount(0);

    await page.getByTestId(ids.toast.deshacer).click();
    await expect(page.getByTestId(ids.cuenta.pendiente("nico"))).toHaveCount(0);
    await expect(page.getByTestId(ids.cuenta.pagar("nico"))).toBeVisible();
  });

  test("la hoja valida el monto y permite abonar", async ({ page }) => {
    await inicio(page, "ana");
    await page.getByTestId(ids.cuenta.pagar("nico")).click();
    await expect(page.getByTestId(ids.hoja.monto)).toHaveValue("1291.67");
    await page.getByTestId(ids.hoja.monto).fill("12.345");
    await page.getByTestId(ids.hoja.confirmar).click();
    await expect(page.getByTestId(ids.hoja.error)).toContainText("monto válido");
    await page.getByTestId(ids.hoja.monto).fill("99999");
    await page.getByTestId(ids.hoja.confirmar).click();
    await expect(page.getByTestId(ids.hoja.error)).toContainText("no pagues de más");
    await page.getByTestId(ids.hoja.monto).fill("500");
    await page.getByTestId(ids.hoja.confirmar).click();
    await expect(page.getByTestId(ids.cuenta.pendiente("nico"))).toContainText("$500.00");
    // Lo que falta sigue disponible para pagar.
    await expect(page.getByTestId(ids.cuenta.pagar("nico"))).toContainText("$791.67");
  });

  test("quien recibe confirma en su inicio; la deuda se salda y quien pagó se entera", async ({ page }) => {
    await anaLePagaANico(page);

    // Ana no tiene nada por confirmar, y Nico ve un solo aviso aunque el pago abarque dos grupos.
    await inicio(page, "ana");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toHaveCount(0);
    await inicio(page, "nico");
    await expect(page.getByTestId(ids.nav.pendientes)).toHaveText("1");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toContainText("Ana dice que ya te pagó $1,291.67");
    await page.locator(ids.pagos.confirmar).click();
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toHaveCount(0);

    await inicio(page, "ana");
    await expect(page.getByTestId(ids.pagos.avisos)).toContainText("Nico confirmó tu pago de $1,291.67");
    await expect(page.getByTestId(ids.nav.pendientes)).toHaveText("1");
    await page.locator(ids.pagos.avisoOk).click();
    await expect(page.getByTestId(ids.pagos.avisos)).toHaveCount(0);
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$4,340.01");
    await expect(page.getByTestId(ids.inicio_resumen.teToca).getByTestId(ids.cuenta.fila("nico"))).toHaveCount(0);
  });

  test("rechazar deja el pago en disputa (reservado); quien lo rechazó puede aprobarlo más tarde", async ({ page }) => {
    await anaLePagaANico(page);
    await inicio(page, "nico");
    await page.locator(ids.pagos.rechazar).click();
    // Nico lo ve en "por revisar" y puede aprobarlo después.
    await expect(page.getByTestId(ids.pagos.porRevisar)).toContainText("Rechazaste el pago de Ana");

    await inicio(page, "ana");
    await expect(page.getByTestId(ids.pagos.avisos)).toContainText("no le ha llegado tu pago de $1,291.67");
    await expect(page.getByTestId(ids.cuenta.disputa("nico"))).toBeVisible();
    await expect(page.getByTestId(ids.cuenta.pagar("nico"))).toHaveCount(0); // sigue reservado
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$5,631.68");

    await inicio(page, "nico");
    await page.locator(ids.pagos.aprobar).click();
    await expect(page.getByTestId(ids.pagos.porRevisar)).toHaveCount(0);

    await inicio(page, "ana");
    await expect(page.getByTestId(ids.pagos.avisos)).toContainText("Nico confirmó tu pago de $1,291.67");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$4,340.01");
  });

  test("quien pagó puede cancelar un pago pendiente o en disputa y volver a pagar", async ({ page }) => {
    await anaLePagaANico(page);
    await expect(page.getByTestId(ids.cuenta.cancelar("nico"))).toBeVisible();
    await page.getByTestId(ids.cuenta.cancelar("nico")).click();
    await expect(page.getByTestId(ids.cuenta.pendiente("nico"))).toHaveCount(0);
    await expect(page.getByTestId(ids.cuenta.pagar("nico"))).toBeVisible();

    // En disputa: se cancela desde el aviso.
    await anaLePagaANico(page);
    await inicio(page, "nico");
    await page.locator(ids.pagos.rechazar).click();
    await inicio(page, "ana");
    await page.locator(ids.pagos.avisoCancelar).click();
    await expect(page.getByTestId(ids.pagos.avisos)).toHaveCount(0);
    await expect(page.getByTestId(ids.cuenta.pagar("nico"))).toBeVisible();
    // Y a Nico ya no le queda nada por revisar.
    await inicio(page, "nico");
    await expect(page.getByTestId(ids.pagos.porRevisar)).toHaveCount(0);
  });

  test("quien no debe nada ve $0.00 y sus cobros plegados", async ({ page }) => {
    await inicio(page, "luis");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$0.00");
    await expect(page.getByTestId(ids.inicio_resumen.teDeben)).not.toHaveText("$0.00");
  });
});

test.describe("detalle del grupo", () => {
  test("Mis cuentas va primero y la cifra de pagar es la misma que la deuda directa", async ({ page }) => {
    await page.goto("/dev/demo/g/playa/detalle?u=ana");
    await expect(page.getByTestId(ids.pagos.misCuentas)).toBeVisible();
    await expect(page.getByTestId(ids.cuenta.monto("nico"))).toHaveText("$991.67");
    await page.getByTestId(ids.cuenta.pagar("nico")).click();
    await expect(page.getByTestId(ids.hoja.monto)).toHaveValue("991.67"); // una sola cifra por pago
    await page.getByTestId(ids.hoja.cerrar).click();
    // Todo lo del grupo, plegado.
    await expect(page.getByTestId(ids.pagos.todasLasDeudas)).not.toHaveAttribute("open", "");
  });

  test("pagar menos veces es opcional, explica el camino y lo confirma quien recibe", async ({ page }) => {
    await page.goto("/dev/demo/g/roomies/detalle?u=ana");
    await expect(page.getByTestId(ids.cuenta.monto("luis"))).toHaveText("$400.00"); // lo que le debes directo
    await page.getByTestId(ids.modos.comoPagarse).locator("summary").click();
    await expect(page.getByTestId(ids.pagos.plan("ana", "luis"))).toContainText("$218.04"); // saldo neto del grupo
    await page.getByTestId(ids.pagos.planPagar("ana", "luis")).click();
    await expect(page.getByTestId(ids.hoja.monto)).toHaveValue("218.04");
    await page.getByTestId(ids.hoja.confirmar).click();
    await expect(page.getByTestId(ids.toast.raiz)).toContainText("Avisamos");

    await inicio(page, "luis");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toContainText("Ana dice que ya te pagó $218.04");
  });

  test("el detalle de Beto: abono pendiente, Ferni confirma, XP solo al saldar por completo", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await expect(page.getByTestId(ids.saldar.estado)).toHaveText("Bajo la lluvia");

    await page.getByTestId(ids.cuenta.pagar("ferni")).click();
    await page.getByTestId(ids.hoja.monto).fill("100");
    await page.getByTestId(ids.hoja.confirmar).click();
    await expect(page.getByTestId(ids.cuenta.pendiente("ferni"))).toContainText("$100.00");
    await expect(page.getByTestId(ids.saldar.estado)).toHaveText("Bajo la lluvia"); // nada cambia hasta que confirme

    await inicio(page, "ferni");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toContainText("Beto dice que ya te pagó $100.00");
    await page.locator(ids.pagos.confirmar).click();

    await inicio(page, "beto");
    await expect(page.getByTestId(ids.pagos.avisos)).toContainText("Ferni confirmó tu pago de $100.00");
    await expect(page.locator(ids.pagos.avisoXp)).toHaveCount(0); // un abono no da XP
    await page.locator(ids.pagos.avisoOk).click();

    // Lo que falta ($210): al confirmarse, +50 XP.
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await expect(page.getByTestId(ids.cuenta.pagar("ferni"))).toContainText("$210.00");
    await page.getByTestId(ids.cuenta.pagar("ferni")).click();
    await page.getByTestId(ids.hoja.confirmar).click();
    await inicio(page, "ferni");
    await page.locator(ids.pagos.confirmar).click();
    await inicio(page, "beto");
    await expect(page.locator(ids.pagos.avisoXp)).toHaveText("+50 XP ⚡");
  });
});
