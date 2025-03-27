import { TEST_URL } from "../playwright-setup";
import { test, expect } from "@playwright/test";
import { E2E_SMART_TEST_CLIENT_ID } from "./constants";

test.describe("SMART on FHIR", () => {
  test("successfully validates the e2e flow", async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "New server" }).click();

    const serverName = `E2E Smart on FHIR ${Math.random() * 100}`;
    await page.getByTestId("server-name").fill(serverName);

    await page
      .getByTestId("server-url")
      .fill(process.env.AIDBOX_BASE_URL as string);

    await page.getByTestId("auth-method").selectOption("SMART");
    await page.getByTestId("client-id").fill(E2E_SMART_TEST_CLIENT_ID);

    await page.getByTestId("scopes").fill("system/*.read");
    await page
      .getByTestId("token-endpoint")
      .fill(`${process.env.APP_HOSTNAME}/.well-known/jwks.json`);

    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible();

    await page.getByRole("button", { name: "Add server" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toHaveText(/Connected/);
  });
});
