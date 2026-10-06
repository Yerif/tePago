import { expect, test } from "@playwright/test";
import { ids } from "./selectors";

test.describe("flujos críticos del demo", () => {
  test("dividir un gasto simple en 3 interacciones", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId(ids.inicio.dividir).click(); // 1
    await page.getByTestId(ids.dividir.monto).fill("850"); // 2
    await page.getByTestId(ids.dividir.confirmar).click(); // 3
    await expect(page.getByTestId(ids.dividir.aviso)).toBeVisible();
    await expect(page.getByTestId(ids.dividir.guardados)).toContainText("$850.00");
  });

  test("montos: avisa cuánto falta, deja guardar y el pagador absorbe lo que quedó sin asignar", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("1000");
    await page.getByTestId(ids.modos.modo("montos")).click();
    await page.getByTestId(ids.modos.valor("ana")).fill("300");
    await page.getByTestId(ids.modos.valor("beto")).fill("200");
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Faltan $500.00");
    await expect(page.getByTestId(ids.modos.sinAsignar)).toContainText("$500.00");
    await page.getByTestId(ids.dividir.confirmar).click();
    await page.getByTestId(ids.modos.absorber(1)).click();
    await expect(page.getByTestId(ids.dividir.guardados)).toContainText("absorbió $500.00");
  });

  test("montos: pasarse del total bloquea guardar", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("100");
    await page.getByTestId(ids.modos.modo("montos")).click();
    await page.getByTestId(ids.modos.valor("ana")).fill("150");
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Te pasaste $50.00");
    await expect(page.getByTestId(ids.dividir.confirmar)).toBeDisabled();
  });

  test("porcentajes: deben sumar 100 y hay atajo para repartir lo que falta", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("1000");
    await page.getByTestId(ids.modos.modo("porcentajes")).click();
    await page.getByTestId(ids.modos.valor("ana")).fill("50");
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Llevan 50 %");
    await expect(page.getByTestId(ids.dividir.confirmar)).toBeDisabled();
    await page.getByTestId(ids.modos.completar).click();
    await expect(page.getByTestId(ids.modos.estado)).toContainText("Suma 100 %");
    await expect(page.getByTestId(ids.modos.parte("ana"))).toContainText("$500.00");
    await expect(page.getByTestId(ids.dividir.confirmar)).toBeEnabled();
  });

  test("partes y ajustes; al cambiar de modo se conserva lo capturado", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("700");
    await page.getByTestId(ids.modos.modo("partes")).click();
    await page.getByTestId(ids.modos.valor("ana")).fill("3");
    await page.getByTestId(ids.modos.valor("beto")).fill("2");
    await page.getByTestId(ids.modos.valor("caro")).fill("2");
    await page.getByTestId(ids.modos.valor("ferni")).fill("0");
    await expect(page.getByTestId(ids.modos.parte("ana"))).toContainText("$300.00");
    await page.getByTestId(ids.modos.modo("ajustes")).click();
    await page.getByTestId(ids.modos.modo("partes")).click();
    await expect(page.getByTestId(ids.modos.valor("ana"))).toHaveValue("3");
  });

  test("por producto: lo que pidió uno solo se le carga a él y lo demás se reparte", async ({ page }) => {
    await page.goto("/dev/demo/dividir");
    await page.getByTestId(ids.dividir.monto).fill("1000");
    await page.getByTestId(ids.modos.modo("producto")).click();
    await page.getByTestId(ids.modos.productoNombre).fill("Postre");
    await page.getByTestId(ids.modos.productoPrecio).fill("200");
    await page.getByTestId(ids.modos.productoQuien("beto")).click();
    await page.getByTestId(ids.modos.productoAgregar).click();
    // 800 restantes entre 4 = 200 c/u; Beto además el postre.
    await expect(page.getByTestId(ids.modos.parte("beto"))).toContainText("$400.00");
    await expect(page.getByTestId(ids.modos.parte("ana"))).toContainText("$200.00");
  });

  test("cómo pagarse: muestra el plan más sencillo", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await expect(page.getByTestId(ids.modos.comoPagarse)).toContainText("más sencilla");
  });

  test("cómo pagarse: pagar desde el plan registra el pago y baja lo que debes", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    const botones = page.locator('[data-testid^="plan-pagar-beto-"]');
    const antes = await botones.count();
    expect(antes).toBeGreaterThan(0);
    await botones.first().click();
    await expect(page.getByTestId(ids.saldar.reaccion)).toContainText("Avisamos a");
    await expect(botones).toHaveCount(antes - 1);
  });

  test("inicio: Ana paga a Luis, queda pendiente y se salda solo cuando Luis lo confirma", async ({ page }) => {
    await page.goto("/dev/demo");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$4,821.39");
    await expect(page.getByTestId(ids.inicio_resumen.teDeben)).toHaveText("$2,240.00");
    await page.getByTestId(ids.inicio_resumen.pagar("roomies", "luis")).click();
    await expect(page.getByTestId(ids.inicio_resumen.aviso)).toContainText("Avisamos a Luis");
    // Pendiente: la deuda sigue igual y no se puede pagar otra vez.
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$4,821.39");
    await expect(page.getByTestId(ids.pagos.pendienteInicio("roomies", "luis"))).toContainText("$218.04");
    await expect(page.getByTestId(ids.inicio_resumen.pagar("roomies", "luis"))).toHaveCount(0);

    await page.goto("/dev/demo?u=luis");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toContainText("Ana dice que ya te pagó $218.04");
    await page.locator(ids.pagos.confirmar).click();

    await page.goto("/dev/demo");
    await expect(page.getByTestId(ids.pagos.avisos)).toContainText("Luis confirmó tu pago de $218.04");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$4,603.35");
    await expect(page.getByTestId(ids.pagos.pendienteInicio("roomies", "luis"))).toHaveCount(0);
  });

  test("inicio: quien no debe nada ve todo en orden", async ({ page }) => {
    await page.goto("/dev/demo?u=luis");
    await expect(page.getByTestId(ids.inicio_resumen.debes)).toHaveText("$0.00");
    await expect(page.getByTestId(ids.inicio_resumen.teDeben)).not.toHaveText("$0.00");
  });

  test("confirmar lo que entendió la app y guardar", async ({ page }) => {
    await page.goto("/dev/demo/ia?c=b1-05-cena-detalle");
    await expect(page.getByTestId(ids.confirmar.resultado)).toBeVisible();
    await page.getByTestId(ids.confirmar.confirmar).click();
    await expect(page.getByTestId(ids.confirmar.guardado)).toBeVisible();
  });

  test("saldar: el pago queda pendiente y solo quien recibe lo confirma; ahí llega el XP", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await expect(page.getByTestId(ids.saldar.estado)).toHaveText("Deteriorado");

    // Un abono: queda pendiente, nada cambia todavía.
    await page.getByTestId(ids.saldar.monto("beto", "ferni")).fill("100");
    await page.getByTestId(ids.saldar.abonar("beto", "ferni")).click();
    await expect(page.getByTestId(ids.saldar.reaccion)).toContainText("Avisamos a Ferni");
    await expect(page.getByTestId(ids.pagos.pendienteDetalle("beto", "ferni"))).toContainText("$100.00");
    await expect(page.getByTestId(ids.saldar.estado)).toHaveText("Deteriorado");

    // Quien paga no ve nada por confirmar; Ferni sí, en su inicio.
    await page.goto("/dev/demo?u=beto");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toHaveCount(0);
    await page.goto("/dev/demo?u=ferni");
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toContainText("Beto dice que ya te pagó $100.00");
    await page.locator(ids.pagos.confirmar).click();
    await expect(page.getByTestId(ids.pagos.porConfirmar)).toHaveCount(0);

    // Beto se entera en su inicio; un abono no da XP.
    await page.goto("/dev/demo?u=beto");
    await expect(page.getByTestId(ids.pagos.avisos)).toContainText("Ferni confirmó tu pago de $100.00");
    await expect(page.locator(ids.pagos.avisoXp)).toHaveCount(0);
    await page.locator(ids.pagos.avisoOk).click();
    await expect(page.getByTestId(ids.pagos.avisos)).toHaveCount(0);

    // Paga lo que falta ($210): pendiente → Ferni confirma → +50 XP.
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await page.getByTestId(ids.saldar.todo("beto", "ferni")).click();
    await page.goto("/dev/demo?u=ferni");
    await page.locator(ids.pagos.confirmar).click();
    await page.goto("/dev/demo?u=beto");
    await expect(page.locator(ids.pagos.avisoXp)).toHaveText("+50 XP ⚡");
  });

  test("rechazar un pago no cambia la deuda y se le avisa a quien pagó", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await page.getByTestId(ids.saldar.todo("beto", "ferni")).click();
    await page.goto("/dev/demo?u=ferni");
    await page.locator(ids.pagos.rechazar).click();
    await page.goto("/dev/demo?u=beto");
    await expect(page.getByTestId(ids.pagos.avisos)).toContainText("no le ha llegado tu pago de $310.00");
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await expect(page.getByTestId("deuda-beto-ferni")).toContainText("$310.00");
    await expect(page.getByTestId(ids.pagos.pendienteDetalle("beto", "ferni"))).toHaveCount(0);
    await expect(page.getByTestId(ids.saldar.todo("beto", "ferni"))).toBeVisible();
  });

  test("saldar valida el monto", async ({ page }) => {
    await page.goto("/dev/demo/g/oaxaca/detalle?u=beto");
    await page.getByTestId(ids.saldar.monto("beto", "ferni")).fill("12.345");
    await page.getByTestId(ids.saldar.abonar("beto", "ferni")).click();
    await expect(page.getByTestId(ids.saldar.error)).toContainText("monto válido");
    await page.getByTestId(ids.saldar.monto("beto", "ferni")).fill("99999");
    await page.getByTestId(ids.saldar.abonar("beto", "ferni")).click();
    await expect(page.getByTestId(ids.saldar.error)).toContainText("no pagues de más");
  });
});
