// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { PAGE_TITLES } from "@/app/(pages)/query/components/stepIndicator/StepIndicator";

import { TEST_PATIENT, TEST_PATIENT_NAME } from "./constants";

test.describe("querying with the Query Connector", () => {
  // Start every test by navigating to the customize query workflow
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_URL);
    await page.getByRole("button", { name: "Try it out" }).click();

    // Check that the info alert is visible and contains the correct text
    const alert = page.locator(".custom-alert");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(
      "This site is for demo purposes only. Please do not enter PII on this website.",
    );
    await expect(
      page.getByRole("heading", {
        name: PAGE_TITLES["search"].title,
        exact: true,
      }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Fill fields" }).click();
    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption("Local e2e HAPI Server: Direct");

    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await page.getByRole("link", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: "Select a query" }),
    ).toBeVisible();
    await page
      .getByTestId("Select")
      .selectOption("Chlamydia case investigation");

    await page.getByRole("button", { name: "Customize Query" }).click();
    await expect(
      page.getByRole("heading", { name: "Customize Query" }),
    ).toBeVisible();
  });

  test("customize query successfully filtering some data", async ({ page }) => {
    test.slow();
    await expect(
      page.getByText(
        "250 labs found, 4 medications found, 104 conditions found.",
      ),
    ).toBeVisible();
    await page.getByRole("button", { name: "Medications" }).click();
    await page.getByRole("button", { name: "Chlamydia Medication" }).click();
    await page
      .getByRole("row", { name: "azithromycin 1000 MG" })
      .locator("label")
      .click();
    await expect(page.getByText("3 of 4 selected")).toBeVisible();
    await page
      .getByRole("row")
      .filter({ hasText: "ceftriaxone 500 MG Injection" })
      .locator("label")
      .click();
    await expect(page.getByText("2 of 4 selected")).toBeVisible();
    await page.getByRole("button", { name: "Apply changes" }).click();
    await expect(
      page.getByRole("alert").getByText("Query Customization Successful!"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    // Make sure we have a results page with a single patient
    // Non-interactive 'div' elements in the table should be located by text
    await expect(
      page.getByRole("heading", { name: "Patient Record" }),
    ).toBeVisible();
    await expect(page.getByText("Patient Name")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT_NAME)).toBeVisible();
    await expect(page.getByText("Patient Identifiers")).toBeVisible();
    await expect(
      page.getByText(
        `Medical Record Number: St. Worrywart’s Hospital: ${TEST_PATIENT.MRN}`,
      ),
    ).toBeVisible();

    // Should now just be a single lonely medication request
    // No azithromycin or ceftriaxone should be visible
    await expect(
      page.getByRole("button", { name: "Medication Requests", expanded: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "doxycycline hyclate 100 MG" }),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "azithromycin 1000 MG" }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: "ceftriaxone 500 MG Injection" }),
    ).not.toBeVisible();
    // Count will be 2: the lonely med and the title row
    await expect(
      page
        .getByRole("table")
        .getByRole("row")
        .filter({ hasText: "doxycycline hyclate 100 MG" }),
    ).toHaveCount(2);
  });

  test("customize query select / deselect all filters whole DibbsConceptType, across tabs", async ({
    page,
  }) => {
    test.slow();
    await page.getByRole("button", { name: "Labs", exact: true }).click();
    await page.getByRole("button", { name: "Deselect all labs" }).click();

    // Spot check a couple valuesets for deselection
    await expect(page.getByText("0 of 38 selected")).toBeVisible();
    await expect(page.getByText("0 of 14 selected")).toBeVisible();
    await expect(page.getByText("0 of 33 selected")).toBeVisible();

    // Now de-select all the medications via the group check marks
    await page.getByRole("button", { name: "Medications" }).click();
    await page
      .getByRole("button", { name: "Chlamydia Medication" })
      .locator("label")
      .click();
    await expect(page.getByText("0 of 4 selected")).toBeVisible();

    await page.getByRole("button", { name: "Apply changes" }).click();
    await expect(
      page.getByRole("alert").getByText("Query Customization Successful!"),
    ).toBeVisible();

    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    // Make sure we have a results page with a single patient
    // Non-interactive 'div' elements in the table should be located by text
    await expect(
      page.getByRole("heading", { name: "Patient Record" }),
    ).toBeVisible();
    await expect(page.getByText("Patient Name")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT_NAME)).toBeVisible();
    await expect(page.getByText("Patient Identifiers")).toBeVisible();
    await expect(
      page.getByText(
        `Medical Record Number: St. Worrywart’s Hospital: ${TEST_PATIENT.MRN}`,
      ),
    ).toBeVisible();

    // Should be no medication requests available
    await expect(
      page.getByRole("button", { name: "Medication Requests" }),
    ).not.toBeVisible();

    // Eliminating all value set labs should also remove diagnostic reports
    await expect(
      page.getByRole("button", { name: "Diagnostic Reports" }),
    ).not.toBeVisible();

    // Observations table should have 5 rows, all of which are SDoH factors rather than lab results
    await expect(
      page.getByRole("button", { name: "Observations", expanded: true }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("table")
        .getByRole("row")
        .filter({ hasText: "I do not have housing" }),
    ).toHaveCount(6);
    const acceptableSdohKeywords = [
      "history",
      "narrative",
      "housing",
      "pregnancy",
      "with anonymous partner",
    ];
    const obsRows = page
      .getByRole("table")
      .getByRole("row")
      .filter({ hasText: "I do not have housing" });
    for (let i = 1; i < 6; i++) {
      const row = obsRows.nth(i);
      const typeText = await row.locator("td").nth(1).textContent();
      const presentKey = acceptableSdohKeywords.find((key) =>
        typeText?.toLowerCase().includes(key),
      );
      expect(presentKey).toBeDefined();
      expect(typeText?.includes("chlamydia")).toBeFalsy();
    }
  });
});
