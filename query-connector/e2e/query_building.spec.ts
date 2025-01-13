// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { DEFAULT_QUERIES } from "@/app/queryBuilding/fixtures";

test.describe("building a new query", () => {
  // Start every test by navigating to the customize query workflow
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/queryBuilding`);
    await expect(
      page.getByRole("heading", {
        name: "Query Library",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("happy path works works", async ({ page }) => {
    page.getByText("Create Query").click();
    await expect(
      page.getByRole("heading", {
        name: "Custom query",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Select condition template(s)",
      }),
    ).toBeVisible();

    expect(page.getByText("Customize query")).toBeVisible();
    expect(page.getByText("Customize query")).toBeDisabled();

    await page.getByText("Cancer (Leukemia)", { exact: true }).click();
    await page.getByText("Cleft lip", { exact: true }).click();

    await page.getByPlaceholder("Search conditions").fill("syp");
    await page.getByText("Congenital syphilis", { exact: true }).click();

    await page.getByLabel("Query name").fill("Test Query");

    expect(page.getByText("Customize query")).toBeEnabled();
    await page.getByText("Customize query", { exact: true }).click();

    await expect(
      page.getByRole("button", {
        name: "Save query",
      }),
    ).toBeEnabled();

    expect(
      page.getByTestId("accordionItem_labs").getByText("3 / 3"),
    ).toBeVisible();
    expect(
      page.getByTestId("accordionItem_conditions").getByText("6 / 6"),
    ).toBeVisible();
    expect(
      page.getByTestId("accordionItem_medications").getByText("1 / 1"),
    ).toBeVisible();

    await page.getByText("Conditions", { exact: true }).click();
    expect(
      page.getByTestId("accordionItem_conditions").getByText("5/5"),
    ).toBeVisible();
  });
});

test.describe("editing an exisiting new query", () => {
  // Start every test by navigating to the customize query workflow
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/queryBuilding`);
    await expect(
      page.getByRole("heading", {
        name: "Query Library",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("default queries render", async ({ page }) => {
    DEFAULT_QUERIES.forEach((query) => {
      expect(page.getByText(query.query_name)).toBeVisible();
    });
  });

  //   test("customize query select / deselect all filters whole DibbsConceptType, across tabs", async ({
  //     page,
  //   }) => {
  //     test.slow();

  //     await page.getByRole("button", { name: "Labs", exact: true }).click();
  //     await page.getByRole("button", { name: "Deselect all labs" }).click();

  //     // Spot check a couple valuesets for deselection
  //     await expect(page.getByText("0 of 38 selected")).toBeVisible();
  //     await expect(page.getByText("0 of 14 selected")).toBeVisible();
  //     await expect(page.getByText("0 of 33 selected")).toBeVisible();

  //     // Now de-select all the medications via the group check marks
  //     await page.getByRole("button", { name: "Medications" }).click();
  //     await page
  //       .getByRole("button", { name: "Chlamydia Medication" })
  //       .locator("label")
  //       .click();
  //     await expect(page.getByText("0 of 4 selected")).toBeVisible();

  //     await page.getByRole("button", { name: "Apply changes" }).click();
  //     await expect(
  //       page.getByRole("alert").getByText("Query Customization Successful!"),
  //     ).toBeVisible();

  //     await page.getByRole("button", { name: "Submit" }).click();
  //     await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

  //     // Make sure we have a results page with a single patient
  //     // Non-interactive 'div' elements in the table should be located by text
  //     await expect(
  //       page.getByRole("heading", { name: "Patient Record" }),
  //     ).toBeVisible();
  //     await expect(page.getByText("Patient Name")).toBeVisible();
  //     await expect(page.getByText(TEST_PATIENT_NAME)).toBeVisible();
  //     await expect(page.getByText("Patient Identifiers")).toBeVisible();
  //     await expect(
  //       page.getByText(`Medical Record Number: ${TEST_PATIENT.MRN}`),
  //     ).toBeVisible();

  //     // Should be no medication requests available
  //     await expect(
  //       page.getByRole("button", { name: "Medication Requests" }),
  //     ).not.toBeVisible();

  //     // Eliminating all value set labs should also remove diagnostic reports
  //     await expect(
  //       page.getByRole("button", { name: "Diagnostic Reports" }),
  //     ).not.toBeVisible();

  //     // Observations table should have 5 rows, all of which are SDoH factors rather than lab results
  //     await expect(
  //       page.getByRole("button", { name: "Observations", expanded: true }),
  //     ).toBeVisible();
  //     await expect(
  //       page
  //         .getByRole("table")
  //         .filter({ hasText: "I do not have housing" })
  //         .getByRole("row"),
  //     ).toHaveCount(6);
  //     const acceptableSdohKeywords = [
  //       "history",
  //       "narrative",
  //       "housing",
  //       "pregnancy",
  //       "with anonymous partner",
  //     ];
  //     const obsRows = page
  //       .getByRole("table")
  //       .filter({ hasText: "I do not have housing" })
  //       .getByRole("row");
  //     for (let i = 1; i < 6; i++) {
  //       const row = obsRows.nth(i);
  //       const typeText = await row.locator("td").nth(1).textContent();
  //       const presentKey = acceptableSdohKeywords.find(
  //         (key) => typeText?.toLowerCase().includes(key),
  //       );
  //       expect(presentKey).toBeDefined();
  //       expect(typeText?.includes("chlamydia")).toBeFalsy();
  //     }
  //   });
});
