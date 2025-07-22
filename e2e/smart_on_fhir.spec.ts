import { TEST_URL } from "../playwright-setup";
import { test, expect } from "@playwright/test";
import { E2E_SMART_TEST_CLIENT_ID } from "./constants";

import { runAxeAccessibilityChecks } from "./utils";

test.describe("SMART on FHIR", () => {
  // NOTE: this E2E doesn't work on local UI mode due to Docker networking issues
  test("successfully validates the e2e flow", async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "New server" }).click();
    await expect(
      page.getByRole("heading", {
        name: "New server",
      }),
    ).toBeVisible();
    await runAxeAccessibilityChecks(page);

    const serverName = `E2E Smart on FHIR ${Math.random() * 100}`;
    await page.getByTestId("server-name").fill(serverName);

    await page
      .getByTestId("server-url")
      .fill(`${process.env.AIDBOX_BASE_URL}/fhir`);

    await page.getByTestId("auth-method").selectOption("SMART");
    await page.getByTestId("client-id").fill(E2E_SMART_TEST_CLIENT_ID);

    await page.getByTestId("scopes").fill("system/*.read");
    await page
      .getByTestId("token-endpoint")
      .fill(`${process.env.AIDBOX_BASE_URL}/auth/token`);

    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible();
    await runAxeAccessibilityChecks(page);

    await page.getByRole("button", { name: "Add server" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toHaveText(/Connected/);
    await runAxeAccessibilityChecks(page);
  });
});
