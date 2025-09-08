import { TEST_URL } from "../playwright-setup";
import { test, expect } from "@playwright/test";
import { E2E_SMART_TEST_CLIENT_ID } from "./constants";

test.describe("Custom Headers", () => {
  test("successfully adds a FHIR server with custom headers", async ({
    page,
  }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    await expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "New server" }).click();
    await expect(
      page.getByRole("heading", { name: "New server" }),
    ).toBeVisible();

    await page.evaluate(() => {
      const modal = document.querySelector(".usa-modal__content");
      if (modal) {
        modal.scrollTop = modal.scrollHeight;
      }
    });

    const serverName = `E2E Custom Headers ${Math.floor(
      Math.random() * 100000,
    )}`;
    await page.getByTestId("server-name").fill(serverName);
    await page
      .getByTestId("server-url")
      .fill("https://gw.interop.community/HeliosConnectathonSa/open");

    // Add custom headers
    await page.getByRole("button", { name: "Add header" }).click();

    // First header
    await page
      .getByPlaceholder("Header name")
      .first()
      .fill("X-Organization-Id");
    await page.getByPlaceholder("Header value").first().fill("org-123");

    // Add second header
    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").nth(1).fill("X-API-Version");
    await page.getByPlaceholder("Header value").nth(1).fill("v2");

    // Test connection with headers
    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible();

    // Save the server
    await page.getByRole("button", { name: "Add server" }).click();

    // Verify server appears in the list
    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toHaveText(/Connected/);
  });

  test("successfully edits a server to add and modify custom headers", async ({
    page,
  }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    await expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();

    // First create a server without headers
    await page.getByRole("button", { name: "New server" }).click();
    const serverName = `E2E Edit Headers ${Math.floor(Math.random() * 10000)}`;
    await page.getByTestId("server-name").fill(serverName);
    await page
      .getByTestId("server-url")
      .fill("https://gw.interop.community/HeliosConnectathonSa/open");

    await page.getByRole("button", { name: "Add server" }).click();

    // Wait for modal to close and server to appear
    await expect(
      page.getByRole("heading", { name: "New server" }),
    ).not.toBeVisible();

    // Hover over the row and click edit
    const serverRow = page.getByRole("row").filter({ hasText: serverName });
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    await expect(
      page.getByRole("heading", { name: "Edit server" }),
    ).toBeVisible();

    // Add headers
    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").fill("X-Custom-Header");
    await page.getByPlaceholder("Header value").fill("custom-value");

    // Save changes
    await page.getByRole("button", { name: "Save changes" }).click();

    // Edit again to verify headers are persisted
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    // Verify header is still there using the custom-headers testid
    const headersSection = page.getByTestId("custom-headers");
    await expect(headersSection).toBeVisible();

    // Check input values within the headers section
    const headerNameInput = headersSection
      .getByPlaceholder("Header name")
      .first();
    const headerValueInput = headersSection
      .getByPlaceholder("Header value")
      .first();
    await expect(headerNameInput).toHaveValue("X-Custom-Header");
    await expect(headerValueInput).toHaveValue("custom-value");

    // Add another header
    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").nth(1).fill("X-Another-Header");
    await page.getByPlaceholder("Header value").nth(1).fill("another-value");

    await page.getByRole("button", { name: "Save changes" }).click();
  });

  test("successfully removes custom headers", async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);

    // Create a server with headers
    await page.getByRole("button", { name: "New server" }).click();
    const serverName = `E2E Remove Headers ${Math.floor(
      Math.random() * 10000,
    )}`;
    await page.getByTestId("server-name").fill(serverName);
    await page
      .getByTestId("server-url")
      .fill("https://gw.interop.community/HeliosConnectathonSa/open");

    // Add two headers
    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").first().fill("X-Header-One");
    await page.getByPlaceholder("Header value").first().fill("value-one");

    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").nth(1).fill("X-Header-Two");
    await page.getByPlaceholder("Header value").nth(1).fill("value-two");

    await page.getByRole("button", { name: "Add server" }).click();

    // Hover over the row and edit the server
    const serverRow = page.getByRole("row").filter({ hasText: serverName });
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    // Remove the first header
    await page
      .getByRole("button", { name: "Remove header X-Header-One" })
      .click();

    // Verify only one header remains
    const headersSection = page.getByTestId("custom-headers");
    await expect(headersSection.getByPlaceholder("Header name")).toHaveCount(1);

    // Verify the remaining header
    await expect(
      headersSection.getByPlaceholder("Header name").first(),
    ).toHaveValue("X-Header-Two");
    await expect(
      headersSection.getByPlaceholder("Header value").first(),
    ).toHaveValue("value-two");

    await page.getByRole("button", { name: "Save changes" }).click();

    // Edit again to verify the deletion persisted
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    const headersSection2 = page.getByTestId("custom-headers");
    await expect(headersSection2.getByPlaceholder("Header name")).toHaveCount(
      1,
    );
    await expect(
      headersSection2.getByPlaceholder("Header name").first(),
    ).toHaveValue("X-Header-Two");
    await expect(
      headersSection2.getByPlaceholder("Header value").first(),
    ).toHaveValue("value-two");

    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("custom headers work with SMART auth and Authorization header is preserved", async ({
    page,
  }) => {
    await page.goto(`${TEST_URL}/fhirServers`);

    await page.getByRole("button", { name: "New server" }).click();
    const serverName = `E2E Headers SMART Auth ${Math.floor(
      Math.random() * 10000,
    )}`;
    await page.getByTestId("server-name").fill(serverName);
    await page
      .getByTestId("server-url")
      .fill(`${process.env.AIDBOX_BASE_URL}/fhir`);

    // Set up SMART auth
    await page.getByTestId("auth-method").selectOption("SMART");
    await page.getByTestId("client-id").fill(E2E_SMART_TEST_CLIENT_ID);
    await page.getByTestId("scopes").fill("system/*.read");
    await page
      .getByTestId("token-endpoint")
      .fill(`${process.env.AIDBOX_BASE_URL}/auth/token`);

    // Add custom headers
    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").fill("X-Request-Id");
    await page.getByPlaceholder("Header value").fill("req-12345");

    // Test that Authorization header in custom headers gets filtered
    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").nth(1).fill("Authorization");
    await page
      .getByPlaceholder("Header value")
      .nth(1)
      .fill("Bearer wrong-token");

    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible();

    await page.getByRole("button", { name: "Add server" }).click();

    // Hover and edit to verify Authorization header was handled correctly
    const serverRow = page.getByRole("row").filter({ hasText: serverName });
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    await expect(
      page.getByRole("heading", { name: "Edit server" }),
    ).toBeVisible();

    await page.evaluate(() => {
      const modal = document.querySelector(".usa-modal__content");
      if (modal) {
        modal.scrollTop = (modal as HTMLElement).scrollHeight;
      }
    });

    // Custom header should be there
    const headersSection = page.getByTestId("custom-headers");
    await expect(headersSection).toBeVisible();

    // Check that only the X-Request-Id header remains (Authorization should be filtered out)
    const headerNameInputs = headersSection.getByPlaceholder("Header name");
    await expect(headerNameInputs).toHaveCount(1);

    await expect(
      headersSection.getByPlaceholder("Header name").first(),
    ).toHaveValue("X-Request-Id");
    await expect(
      headersSection.getByPlaceholder("Header value").first(),
    ).toHaveValue("req-12345");

    // Verify Authorization header is not in the custom headers
    for (let i = 0; i < (await headerNameInputs.count()); i++) {
      const value = await headerNameInputs.nth(i).inputValue();
      expect(value).not.toBe("Authorization");
    }

    // SMART auth settings should still be intact
    await expect(page.getByTestId("client-id")).toHaveValue(
      E2E_SMART_TEST_CLIENT_ID,
    );

    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("headers are preserved when updating other server properties", async ({
    page,
  }) => {
    await page.goto(`${TEST_URL}/fhirServers`);

    // Create server with headers
    await page.getByRole("button", { name: "New server" }).click();
    const serverName = `E2E Preserve Headers ${Math.floor(
      Math.random() * 10000,
    )}`;
    await page.getByTestId("server-name").fill(serverName);
    await page
      .getByTestId("server-url")
      .fill("https://gw.interop.community/HeliosConnectathonSa/open");

    await page.getByRole("button", { name: "Add header" }).click();
    await page.getByPlaceholder("Header name").fill("X-Important-Header");
    await page.getByPlaceholder("Header value").fill("important-value");

    await page.getByRole("button", { name: "Add server" }).click();

    // Hover and edit server to change only the name
    const serverRow = page.getByRole("row").filter({ hasText: serverName });
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    const updatedName = `${serverName} Updated`;
    await page.getByTestId("server-name").clear();
    await page.getByTestId("server-name").fill(updatedName);

    // Headers should still be there
    const headersSection = page.getByTestId("custom-headers");
    await expect(headersSection).toBeVisible();
    await expect(
      headersSection.getByPlaceholder("Header name").first(),
    ).toHaveValue("X-Important-Header");
    await expect(
      headersSection.getByPlaceholder("Header value").first(),
    ).toHaveValue("important-value");

    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify the name changed but headers are preserved
    await expect(
      page.getByRole("row").filter({ hasText: updatedName }),
    ).toBeVisible();

    const updatedServerRow = page
      .getByRole("row")
      .filter({ hasText: updatedName });
    await updatedServerRow.hover();
    await updatedServerRow
      .getByRole("button", { name: `Edit ${updatedName}` })
      .click();

    const headersSection2 = page.getByTestId("custom-headers");
    await expect(headersSection2).toBeVisible();
    await expect(
      headersSection2.getByPlaceholder("Header name").first(),
    ).toHaveValue("X-Important-Header");
    await expect(
      headersSection2.getByPlaceholder("Header value").first(),
    ).toHaveValue("important-value");

    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
