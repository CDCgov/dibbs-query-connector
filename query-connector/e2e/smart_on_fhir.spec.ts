import { TEST_URL } from "../playwright-setup";
import { test } from "@playwright/test";

test.describe("the e2e SMART on FHIR flow", () => {
  test("successfully validates the e2e flow", async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    page.getByText("New server").click();
  });
});
