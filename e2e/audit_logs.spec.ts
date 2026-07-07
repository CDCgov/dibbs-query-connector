import { test, expect, Page } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { DEFAULT_FHIR_SERVER } from "./constants";
import { runAxeAccessibilityChecks } from "./utils";

// A patient discovery query is an audited action ("makePatientDiscoveryRequest").
// The seed inserts data directly (no audit rows), so generate one entry here to
// guarantee the log table is populated regardless of what other specs have run.
async function generateAuditEntry(page: Page) {
  await page.goto(TEST_URL);
  await page.getByRole("button", { name: "Fill fields" }).click();
  await page.getByRole("button", { name: "Advanced" }).click();
  await page
    .getByLabel("Healthcare Organization (HCO)")
    .selectOption(DEFAULT_FHIR_SERVER);
  await page.getByRole("button", { name: "Search for patient" }).click();
  await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });
}

test.describe("Audit logs", () => {
  test.beforeEach(async ({ page }) => {
    await generateAuditEntry(page);
    await page.goto(`${TEST_URL}/auditLogs`);
    await expect(
      page.getByRole("heading", { name: "Audit Log" }),
    ).toBeVisible();
  });

  test("loads the audit log table", async ({ page }) => {
    // At least one audited action is present, so the table shows rows and the
    // "Showing X - Y of Z actions" summary.
    await expect(page.locator("tbody tr").first()).toBeVisible();
    await expect(page.getByText(/Showing/)).toBeVisible();
    await runAxeAccessibilityChecks(page);
  });

  test("search filters rows and shows the empty state", async ({ page }) => {
    await expect(page.locator("tbody tr").first()).toBeVisible();

    // A search term that matches nothing yields the empty state.
    await page.locator("#search").fill("zzzznomatchzzzz");
    await expect(page.getByText("No results found.")).toBeVisible();

    // Clearing the filters restores the rows.
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("opens the detail drawer for a log entry", async ({ page }) => {
    await page.locator("tbody tr").first().click();

    const drawer = page.getByTestId("drawer-title");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Full JSON request");
    await runAxeAccessibilityChecks(page);

    await page.getByRole("button", { name: "Close drawer" }).click();
    await expect(drawer).not.toBeVisible();
  });
});
