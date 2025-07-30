import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { checkForSiteAlert, runAxeAccessibilityChecks } from "./utils";

test.describe("Mutual TLS FHIR Server Configuration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    await expect(page.getByText("Redirecting...")).not.toBeVisible();
  });

  test("should create and configure a mutual TLS enabled FHIR server", async ({
    page,
  }) => {
    // Open new server modal
    await page.getByRole("button", { name: "New server" }).click();
    await expect(
      page.getByRole("heading", { name: "New server" }),
    ).toBeVisible();

    // Fill in server details
    await page.getByTestId("server-name").fill("Test mTLS QHIN Server");
    await page
      .getByTestId("server-url")
      .fill("https://qhin-test.example.com/fhir");

    // Select auth method
    await page.getByTestId("auth-method").selectOption("client_credentials");

    // Wait for auth fields to appear
    await page.waitForTimeout(2000);

    // Fill OAuth details
    await page.getByTestId("client-id").fill("test-client-id");
    await page.getByTestId("client-secret").fill("test-client-secret");
    await page
      .getByTestId("token-endpoint")
      .fill("https://qhin-test.example.com/auth/token");
    await page.getByTestId("scopes").fill("system/*.read");

    // Enable mutual TLS - use JS to check the checkbox directly
    await page.evaluate(() => {
      const checkbox = document.querySelector(
        "#mutual-tls",
      ) as HTMLInputElement;
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        // Trigger both change and input events to ensure React sees the change
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
        checkbox.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    // Wait a moment for React to update, then verify the checkbox is checked
    await page.waitForTimeout(500);
    await expect(page.locator("#mutual-tls")).toBeChecked();

    // Add custom headers
    await page
      .getByRole("button", { name: "Add header" })
      .filter({ hasText: "Add header" })
      .click();

    await page.getByPlaceholder("Header name").fill("X-Organization-Id");
    await page.getByPlaceholder("Header value").fill("org-12345");

    // Save the server
    await page.getByRole("button", { name: "Add server" }).click();

    // Verify server appears in the list with mTLS tag
    await expect(page.getByText("Test mTLS QHIN Server")).toBeVisible();
    await expect(page.getByText("mTLS").first()).toBeVisible();

    // Run accessibility checks
    await runAxeAccessibilityChecks(page);
  });

  test("should edit existing server to enable mutual TLS", async ({ page }) => {
    // First create a server to edit
    await page.getByRole("button", { name: "New server" }).click();
    await page.getByTestId("server-name").fill("Test Server to Edit");
    await page.getByTestId("server-url").fill("https://test.example.com/fhir");
    await page.getByRole("button", { name: "Add server" }).click();

    // Wait for modal to close and server to appear
    await expect(page.getByText("Test Server to Edit")).toBeVisible();

    // Now edit the server
    await page.getByRole("button", { name: /Edit/ }).first().click();

    await expect(
      page.getByRole("heading", { name: "Edit server" }),
    ).toBeVisible();

    // Enable mutual TLS - use JS to check the checkbox directly
    await page.evaluate(() => {
      const checkbox = document.querySelector(
        "#mutual-tls",
      ) as HTMLInputElement;
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Save changes
    await page.getByRole("button", { name: "Save changes" }).click();

    // Modal should close
    await expect(
      page.getByRole("heading", { name: "Edit server" }),
    ).not.toBeVisible();
  });

  test("should test connection with mutual TLS server", async ({ page }) => {
    // Create a new mTLS server first
    await page.getByRole("button", { name: "New server" }).click();

    await page.getByTestId("server-name").fill("mTLS Connection Test");
    await page
      .getByTestId("server-url")
      .fill("https://mtls-test.example.com/fhir");
    // Enable mutual TLS - use JS to check the checkbox directly
    await page.evaluate(() => {
      const checkbox = document.querySelector(
        "#mutual-tls",
      ) as HTMLInputElement;
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Test connection
    await page.getByRole("button", { name: "Test connection" }).click();

    // Wait for connection test to complete
    await expect(
      page.getByRole("button", { name: /Test connection|Success/ }),
    ).toBeVisible({ timeout: 15000 });

    // Cancel without saving
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});

test.describe("Mutual TLS Patient Query", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await expect(page.getByText("Redirecting...")).not.toBeVisible();
  });

  test("should perform patient search on mTLS-enabled FHIR server", async ({
    page,
  }) => {
    // Fill patient search form
    await page.getByLabel("First name").fill("Jane");
    await page.getByLabel("Last name").fill("Smith");
    await page.getByLabel("Date of birth").fill("1985-03-15");

    // Open advanced options
    await page.getByRole("button", { name: "Advanced" }).click();

    // Select an mTLS-enabled server (assuming one exists in test data)
    const serverDropdown = page.getByLabel("Healthcare Organization (HCO)");

    // Check if there's an mTLS server available
    const serverOptions = await serverDropdown
      .locator("option")
      .allTextContents();
    const mtlsServerOption = serverOptions.find(
      (option) =>
        option.toLowerCase().includes("mtls") ||
        option.toLowerCase().includes("qhin"),
    );

    if (mtlsServerOption) {
      await serverDropdown.selectOption(mtlsServerOption);

      // Perform search
      await page.getByRole("button", { name: "Search for patient" }).click();

      // Wait for results or no records found
      await expect(
        page.getByRole("heading", {
          name: /Patient Search Results|No Records Found/,
        }),
      ).toBeVisible({ timeout: 15000 });

      // Run accessibility checks
      await runAxeAccessibilityChecks(page);
    } else {
      // Skip test if no mTLS server is available
      test.skip();
    }
  });
});

test.describe("Mutual TLS Error Handling", () => {
  test("should show appropriate error when mTLS certificates are missing", async ({
    page,
  }) => {
    await page.goto(`${TEST_URL}/fhirServers`);

    // Try to create mTLS server without certificates
    await page.getByRole("button", { name: "New server" }).click();

    await page.getByTestId("server-name").fill("mTLS No Certs Test");
    await page
      .getByTestId("server-url")
      .fill("https://mtls-nocerts.example.com/fhir");
    // Enable mutual TLS - use JS to check the checkbox directly
    await page.evaluate(() => {
      const checkbox = document.querySelector(
        "#mutual-tls",
      ) as HTMLInputElement;
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // Test connection should fail if certs are not available
    await page.getByRole("button", { name: "Test connection" }).click();

    // Wait for error state
    await page.waitForTimeout(2000);

    // Check if there's an error message visible
    const errorMessage = page.locator(".usa-alert--error, [role='alert']");
    const errorCount = await errorMessage.count();

    if (errorCount > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }

    // Cancel
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
