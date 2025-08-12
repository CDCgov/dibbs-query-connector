import { TEST_URL } from "../playwright-setup";
import { test, expect } from "@playwright/test";
import { E2E_SMART_TEST_CLIENT_ID } from "./constants";
import { PAGE_TITLES } from "../src/app/(pages)/query/components/stepIndicator/StepIndicator";

test.describe("Mutual TLS", () => {
  test("successfully adds a FHIR server with mutual TLS and performs patient query", async ({
    page,
  }) => {
    // Step 1: Add a new FHIR server with mutual TLS enabled
    await page.goto(`${TEST_URL}/fhirServers`);
    await expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "New server" }).click();
    await expect(
      page.getByRole("heading", { name: "New server" }),
    ).toBeVisible();

    const serverName = `E2E Mutual TLS ${Math.floor(Math.random() * 10000)}`;
    await page.getByTestId("server-name").fill(serverName);
    await page
      .getByTestId("server-url")
      .fill(`${process.env.AIDBOX_BASE_URL}/fhir`);

    // Set up SMART auth for the server
    await page.getByTestId("auth-method").selectOption("SMART");
    await page.getByTestId("client-id").fill(E2E_SMART_TEST_CLIENT_ID);
    await page.getByTestId("scopes").fill("system/*.read");
    await page
      .getByTestId("token-endpoint")
      .fill(`${process.env.AIDBOX_BASE_URL}/auth/token`);

    // Enable mutual TLS - scroll modal and use JavaScript click
    await page.evaluate(() => {
      const modal = document.querySelector(".usa-modal__content");
      if (modal) {
        modal.scrollTop = modal.scrollHeight;
      }
    });

    await page.getByText("Enable Mutual TLS").click();
    // Verify mutual TLS hint text appears
    await expect(
      page.getByText(
        "Mutual TLS certificates will be loaded from the keys directory",
      ),
    ).toBeVisible();

    // Test connection with mutual TLS
    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible({
      timeout: 15000,
    });

    // Save the server
    await page.getByRole("button", { name: "Add server" }).click();

    // Verify server appears in the list with mTLS tag
    const serverRow = page.getByRole("row").filter({ hasText: serverName });
    await expect(serverRow).toHaveText(/Connected/, { timeout: 10000 });
    await expect(serverRow).toHaveText(/mTLS/);

    // Step 2: Navigate to query page and perform a patient search
    await page.goto(`${TEST_URL}/query`);
    await expect(
      page.getByRole("heading", {
        name: PAGE_TITLES["search"].title,
        exact: true,
      }),
    ).toBeVisible();

    // Click "Advanced" to show FHIR server selection
    await page.getByRole("button", { name: "Advanced" }).click();

    // Wait for advanced options to be visible
    await expect(
      page.getByLabel("Healthcare Organization (HCO)"),
    ).toBeVisible();

    // Select the mutual TLS enabled server
    // const serverCheckbox = page.getByLabel(serverName);
    // await expect(serverCheckbox).toBeVisible();
    // await serverCheckbox.check();

    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption(serverName);

    // Fill out the patient lookup form
    await page.getByTestId("textInput").nth(0).fill("John"); // First name
    await page.getByTestId("textInput").nth(1).fill("Doe"); // Last name
    await page.getByTestId("textInput").nth(2).fill("111-111-1111"); // Phone number
    await page
      .getByRole("textbox", { name: "Date of Birth" })
      .fill("1990-01-01"); // DOB

    // Submit the query
    await page.getByRole("button", { name: "Search" }).click();

    // Wait for results page
    // await expect(page.url()).toContain("/results");

    // Verify we get results back (should show patients from the Task-based query flow)
    await expect(page.getByText("patients found")).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    // Check that we have multiple patients from different providers
    const patientRows = page.getByRole("row").filter({ hasText: /Patient/ });
    const rowCount = await patientRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("successfully edits a server to enable mutual TLS", async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    await expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();

    // First create a server without mutual TLS
    await page.getByRole("button", { name: "New server" }).click();
    const serverName = `E2E Edit MTLS ${Math.floor(Math.random() * 10000)}`;
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

    // Test connection first to ensure it works
    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: "Add server" }).click();

    // Wait for modal to close and server to appear
    await expect(
      page.getByRole("heading", { name: "New server" }),
    ).not.toBeVisible();

    // Verify server appears without mTLS tag initially
    let serverRow = page.getByRole("row").filter({ hasText: serverName });
    await expect(serverRow).toHaveText(/Connected/, { timeout: 10000 });
    await expect(serverRow).not.toHaveText(/mTLS/);

    // Hover over the row and click edit
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    await expect(
      page.getByRole("heading", { name: "Edit server" }),
    ).toBeVisible();

    // Enable mutual TLS - scroll modal and use JavaScript click
    await page.evaluate(() => {
      const modal = document.querySelector(".usa-modal__content");
      if (modal) {
        modal.scrollTop = modal.scrollHeight;
      }
    });

    await page.getByText("Enable Mutual TLS").click();

    // Verify mutual TLS hint text appears
    await expect(
      page.getByText(
        "Mutual TLS certificates will be loaded from the keys directory",
      ),
    ).toBeVisible();

    // Save changes
    await page.getByRole("button", { name: "Save changes" }).click();

    // Verify server now shows mTLS tag
    serverRow = page.getByRole("row").filter({ hasText: serverName });
    await expect(serverRow).toHaveText(/Connected/, { timeout: 10000 });
    await expect(serverRow).toHaveText(/mTLS/);

    // Edit again to verify mutual TLS setting is persisted
    await serverRow.hover();
    await serverRow.getByRole("button", { name: `Edit ${serverName}` }).click();

    // Verify mutual TLS checkbox is checked
    await expect(page.locator("#mutual-tls")).toBeChecked();
    await expect(
      page.getByText("Mutual TLS certificates will be loaded", {
        exact: false,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("mutual TLS setting works with different auth methods", async ({
    page,
  }) => {
    await page.goto(`${TEST_URL}/fhirServers`);

    // Test with No Auth
    await page.getByRole("button", { name: "New server" }).click();
    const serverName = `E2E MTLS No Auth ${Math.floor(Math.random() * 10000)}`;
    await page.getByTestId("server-name").fill(serverName);
    await page
      .getByTestId("server-url")
      .fill("https://gw.interop.community/HeliosConnectathonSa/open");

    // Enable mutual TLS - scroll modal and use JavaScript click
    await page.evaluate(() => {
      const modal = document.querySelector(".usa-modal__content");
      if (modal) {
        modal.scrollTop = modal.scrollHeight;
      }
    });

    await page.getByText("Enable Mutual TLS").click();

    await expect(
      page.getByText(
        "Mutual TLS certificates will be loaded from the keys directory",
      ),
    ).toBeVisible();

    // Test connection should work
    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: "Add server" }).click();

    // Verify server appears with mTLS tag
    const serverRow = page.getByRole("row").filter({ hasText: serverName });
    await expect(serverRow).toHaveText(/Connected/, { timeout: 10000 });
    await expect(serverRow).toHaveText(/mTLS/);
  });
});
