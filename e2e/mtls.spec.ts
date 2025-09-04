import { TEST_URL } from "../playwright-setup";
import { expect } from "@playwright/test";
import { PAGE_TITLES } from "../src/app/(pages)/query/components/stepIndicator/StepIndicator";
import { testWithMock } from "./utils";

testWithMock.describe("Mutual TLS", () => {
  testWithMock(
    "successfully adds a FHIR server with mutual TLS and performs patient query",
    async ({ page, mockServerRequest }) => {
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

      await page.getByLabel("Auth Method").selectOption("Mutual TLS");
      // Verify mutual TLS hint text appears
      await expect(
        page.getByText(
          "Mutual TLS certificates will be loaded from the keys directory",
        ),
      ).toBeVisible();

      // Save the server
      await page.getByRole("button", { name: "Add server" }).click();

      // Verify server appears in the list with mTLS tag
      const serverRow = page.getByRole("row").filter({ hasText: serverName });
      await expect(serverRow).toBeVisible({ timeout: 10000 });
      await expect(serverRow).toHaveText(/mTLS/);

      // Step 2: Set up mock responses for FHIR Task endpoints
      const parentTaskId = "parent-task-123";
      const childTask1Id = "child-task-1";
      const childTask2Id = "child-task-2";

      // Mock parent task creation
      await mockServerRequest.POST(new RegExp(".*/fhir/Task$"), {
        status: 200,
        headers: { "content-type": "application/json" },
        body: {
          resourceType: "Bundle",
          type: "transaction-response",
          entry: [
            {
              resource: {
                resourceType: "Task",
                id: parentTaskId,
                status: "requested",
                intent: "order",
              },
            },
          ],
        },
      });

      // Mock child task polling - handle both URL encoded and non-encoded versions
      await mockServerRequest.GET(
        new RegExp(`.*/fhir/Task\\?part-of=Task(%2F|/)${parentTaskId}`),
        {
          status: 200,
          headers: { "content-type": "application/json" },
          body: {
            resourceType: "Bundle",
            type: "searchset",
            entry: [
              {
                resource: {
                  resourceType: "Task",
                  id: childTask1Id,
                  status: "completed",
                  intent: "order",
                  output: [
                    {
                      valueString: `${process.env.AIDBOX_BASE_URL}/ndjson/Patient-Page1/server1`,
                    },
                  ],
                },
              },
              {
                resource: {
                  resourceType: "Task",
                  id: childTask2Id,
                  status: "completed",
                  intent: "order",
                  output: [
                    {
                      valueString: `${process.env.AIDBOX_BASE_URL}/ndjson/Patient-Page1/server2`,
                    },
                  ],
                },
              },
            ],
          },
        },
      );

      // Mock patient data from server 1
      await mockServerRequest.GET(
        new RegExp(".*/ndjson/Patient-Page1/server1$"),
        {
          status: 200,
          headers: { "content-type": "application/json" },
          body: {
            resourceType: "Patient",
            id: "patient-1",
            name: [{ given: ["John"], family: "Doe" }],
            birthDate: "1990-01-01",
            identifier: [
              {
                system: "targetResponderFullUrl",
                value: "server1.example.com",
              },
            ],
          },
        },
      );

      // Mock patient data from server 2
      await mockServerRequest.GET(
        new RegExp(".*/ndjson/Patient-Page1/server2$"),
        {
          status: 200,
          headers: { "content-type": "application/json" },
          body: {
            resourceType: "Patient",
            id: "patient-2",
            name: [{ given: ["John"], family: "Doe" }],
            birthDate: "1990-01-01",
            identifier: [
              {
                system: "targetResponderFullUrl",
                value: "server2.example.com",
              },
            ],
          },
        },
      );

      // Step 3: Navigate to query page and perform a patient search
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

      // Verify we get successful results with the expected text (extend timeout)
      await expect(page.getByText("The following record(s) match")).toBeVisible(
        { timeout: 30000 },
      );

      // Check that the patient's name appears twice (from different servers)
      const johnDoeElements = page.getByText("John Doe");
      const johnDoeCount = await johnDoeElements.count();
      expect(johnDoeCount).toBe(2);

      // Verify the patients are from different servers by checking for both server identifiers
      // TODO: Uncomment when server identifiers are displayed
      // await expect(page.getByText("server1.example.com")).toBeVisible();
      // await expect(page.getByText("server2.example.com")).toBeVisible();
    },
  );
});
