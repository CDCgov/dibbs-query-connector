import { test, expect, Page } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";

// Covers the FHIR-server config dimensions not already exercised by
// smart_on_fhir.spec.ts (SMART), custom_headers.spec.ts and mtls.spec.ts:
// the None/Basic auth methods, server deletion, the connection-failure state,
// the Immunization Gateway endpoint type, and Epic query-strategy persistence.
const rand = () => Math.floor(Math.random() * 1_000_000);
const AIDBOX_FHIR = `${process.env.AIDBOX_BASE_URL}/fhir`;

/** Opens the "New server" modal and fills the name + URL. Returns the name. */
async function openNewServer(page: Page, url = AIDBOX_FHIR): Promise<string> {
  const serverName = `E2E Server ${rand()}`;
  await page.getByRole("button", { name: "New server" }).click();
  await expect(page.getByRole("heading", { name: "New server" })).toBeVisible();
  await page.getByTestId("server-name").fill(serverName);
  await page.getByTestId("server-url").fill(url);
  return serverName;
}

/** Hovers a server row and opens its edit modal. */
async function openEdit(page: Page, serverName: string) {
  const row = page.getByRole("row").filter({ hasText: serverName });
  await row.hover();
  await row.getByRole("button", { name: `Edit ${serverName}` }).click();
  await expect(
    page.getByRole("heading", { name: "Edit server" }),
  ).toBeVisible();
}

test.describe("FHIR server configuration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    await expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();
  });

  test("adds a server with no auth and persists it", async ({ page }) => {
    const serverName = await openNewServer(page);
    await page.getByTestId("auth-method").selectOption("none");

    // Aidbox requires auth, so a no-auth connection test won't report success;
    // the server still saves. Confirm it persists with the None auth method.
    await page.getByRole("button", { name: "Add server" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toBeVisible();

    await openEdit(page, serverName);
    await expect(page.getByTestId("auth-method")).toHaveValue("none");
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("adds a server with basic (bearer token) auth and persists it", async ({
    page,
  }) => {
    const serverName = await openNewServer(page);
    await page.getByTestId("auth-method").selectOption("basic");
    const token = `e2e-token-${rand()}`;
    await page.locator("#bearer-token").fill(token);

    // The connection test would fail with a dummy token, but a server still
    // saves (the result is only recorded as its connection status).
    await page.getByRole("button", { name: "Add server" }).click();
    await expect(
      page.getByRole("heading", { name: "New server" }),
    ).not.toBeVisible();

    const row = page.getByRole("row").filter({ hasText: serverName });
    await expect(row).toBeVisible();

    // Re-open to confirm the auth method persisted. (The bearer token itself is
    // not echoed back into the edit form.)
    await openEdit(page, serverName);
    await expect(page.getByTestId("auth-method")).toHaveValue("basic");
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("deletes a server", async ({ page }) => {
    const serverName = await openNewServer(page);
    await page.getByTestId("auth-method").selectOption("none");
    await page.getByRole("button", { name: "Add server" }).click();

    const row = page.getByRole("row").filter({ hasText: serverName });
    await expect(row).toBeVisible();

    await openEdit(page, serverName);
    await page.locator("#modal-delete-button").click();

    await expect(
      page.getByRole("heading", { name: "Edit server" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toHaveCount(0);
  });

  test("shows an error state for an unreachable server", async ({ page }) => {
    await openNewServer(page, "http://127.0.0.1:9/fhir");
    await page.getByTestId("auth-method").selectOption("none");

    await page.getByRole("button", { name: "Test connection" }).click();
    // A failed connection sets an error message, which the modal footer renders
    // with an "Error" icon; the connection never reports success.
    await expect(page.locator('[aria-label="Error"]')).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByRole("button", { name: "Success" })).toHaveCount(0);
  });

  test("persists the Immunization Gateway endpoint type", async ({ page }) => {
    const serverName = await openNewServer(page);
    await page.getByTestId("auth-method").selectOption("none");
    await page.getByTestId("endpoint-type").selectOption("immunization");

    await page.getByRole("button", { name: "Add server" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toBeVisible();

    await openEdit(page, serverName);
    await expect(page.getByTestId("endpoint-type")).toHaveValue("immunization");
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("persists the Epic query strategy", async ({ page }) => {
    const serverName = await openNewServer(page);
    await page.getByTestId("auth-method").selectOption("none");
    await page.getByTestId("query-strategy").selectOption("epic");

    await page.getByRole("button", { name: "Add server" }).click();
    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toBeVisible();

    await openEdit(page, serverName);
    await expect(page.getByTestId("query-strategy")).toHaveValue("epic");
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
