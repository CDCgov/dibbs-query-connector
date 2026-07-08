import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { runAxeAccessibilityChecks } from "./utils";

// The Code library page opens in "manage" mode when navigated to directly
// (no query context), which renders the "Manage codes" heading and the
// "table-valuesets-manage" value-set list.
test.describe("Code library", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/codeLibrary`);
    await expect(
      page.getByRole("heading", { name: "Manage codes" }),
    ).toBeVisible();
  });

  test("loads and lists value sets", async ({ page }) => {
    const table = page.getByTestId("table-valuesets-manage");
    await expect(table).toBeVisible();
    // The skeleton row disappears once the seeded value sets load.
    await expect(table.getByTestId("loading-skeleton")).toHaveCount(0);
    await expect(table.locator("tr[id^='vsTableRow--']").first()).toBeVisible();
    await runAxeAccessibilityChecks(page);
  });

  test("search filters the value set list", async ({ page }) => {
    const table = page.getByTestId("table-valuesets-manage");
    await expect(table.locator("tr[id^='vsTableRow--']").first()).toBeVisible();

    // A known seeded term (the DIBBs Cancer/Leukemia value sets) narrows the
    // list to matching value sets.
    await page.locator("#librarySearch").fill("Cancer");
    await expect(table.getByText("Cancer").first()).toBeVisible();

    // A term that matches nothing shows the empty state.
    await page.locator("#librarySearch").fill("zzzznomatchzzzz");
    await expect(page.getByText("No results found.")).toBeVisible();
  });

  test("shows concept codes for a selected value set", async ({ page }) => {
    const table = page.getByTestId("table-valuesets-manage");
    await page.locator("#librarySearch").fill("Cancer");
    const firstRow = table.locator("tr[id^='vsTableRow--']").first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Selecting a value set renders its concepts in the right-hand codes table.
    const codesTable = page.getByTestId("table-codes");
    await expect(codesTable).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Code", exact: true }),
    ).toBeVisible();
    await expect(codesTable.locator("tr").first()).toBeVisible();
    await runAxeAccessibilityChecks(page);
  });
});
