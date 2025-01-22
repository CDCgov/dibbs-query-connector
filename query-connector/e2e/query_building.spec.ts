// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { DEFAULT_QUERIES } from "@/app/queryBuilding/fixtures";

// consts
const QUERY_LIBRARY = "Query Library";
const CUSTOM_QUERY = "Custom Query";
const SELECT_TEMPLATES = "Select condition template(s)";
const BACKLINK_MY_QUERIES = "Back to My queries";
const BACKLINK_CONDITIONS = "Back to condition selection";

const CLICKED_CONDITION = {
  name: "Cancer (Leukemia)",
  labsCount: "3 / 3",
  medsCount: "1 / 1",
  conditionsCount: "6 / 6",
  sampleLabValueSet: "Cancer (Leukemia) Lab Result",
  sampleLabValueSetID: "14_20240923",
  sampleMedValueSet: "Cancer (Leukemia) Medication",
  sampleMedValueSetID: "3_20240909",
  sampleCode: "1 ML alemtuzumab 30 MG/ML Injection",
  sampleCodeID: "828265",
};
const SEARCHED_CONDITION = {
  name: "Congenital syphilis",
  labsCount: "97 / 97",
  medsCount: "27 / 27",
  conditionsCount: "79 / 79",
};

test.describe("building a new query", () => {
  // Start every test by navigating to the query building workflow
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/queryBuilding`);
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
        exact: true,
      }),
    ).toBeVisible();
  });

  test("happy path works", async ({ page }) => {
    page.getByText("Create Query").click();

    // expect the Condition Selection page:
    await expect(
      page.getByRole("heading", {
        name: CUSTOM_QUERY,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: SELECT_TEMPLATES,
      }),
    ).toBeVisible();

    const backLink = await page.getByTestId("backArrowLink");
    expect(backLink).toContainText(BACKLINK_MY_QUERIES);

    const actionButton = await page.getByTestId("createSaveQueryBtn");
    expect(actionButton).toBeVisible();
    expect(actionButton).toHaveText("Customize query");
    expect(actionButton).toBeDisabled();

    const input = await page.getByTestId("queryNameInput");
    const hasFocus = await input.evaluate(
      (node) => document.activeElement === node,
    );
    expect(hasFocus).toBeTruthy();

    // start adding conditions:
    await page.getByText(CLICKED_CONDITION.name, { exact: true }).click();
    expect(page.getByText(CLICKED_CONDITION.name, { exact: true })).toBeChecked;

    await page.getByLabel("Query name").fill(Math.random().toString());
    await expect(actionButton).toBeEnabled();

    await input.fill("syp");
    await page.getByText(SEARCHED_CONDITION.name, { exact: true }).click();
    expect(page.getByText(SEARCHED_CONDITION.name, { exact: true }))
      .toBeChecked;

    // move to value set selection:
    await actionButton.click();

    const labsHeader = await page.getByTestId("accordionButton_labs");
    const conditionsHeader = await page.getByTestId(
      "accordionButton_conditions",
    );
    const medicationsHeader = await page.getByTestId(
      "accordionButton_medications",
    );

    await expect(labsHeader).toBeVisible();
    expect(labsHeader).toContainText(CLICKED_CONDITION.labsCount);

    await expect(conditionsHeader).toBeVisible();
    expect(conditionsHeader).toContainText(CLICKED_CONDITION.conditionsCount);

    await expect(medicationsHeader).toBeVisible();
    expect(medicationsHeader).toContainText(CLICKED_CONDITION.medsCount);

    expect(actionButton).toContainText("Save query");
    expect(backLink).toContainText(BACKLINK_CONDITIONS);

    // customize value sets:
    await labsHeader.click();
    const expandedLabValueSet = page.getByText(
      CLICKED_CONDITION.sampleLabValueSet,
      { exact: true },
    );
    expect(expandedLabValueSet).toBeVisible();
    expect(expandedLabValueSet).toBeChecked();

    await expandedLabValueSet.click();
    await expect(expandedLabValueSet).not.toBeChecked();

    await medicationsHeader.click();
    const expandedMedValueSet = page.getByText(
      CLICKED_CONDITION.sampleMedValueSet,
      { exact: true },
    );
    expect(expandedLabValueSet).not.toBeVisible();
    expect(expandedMedValueSet).toBeVisible();
    expect(expandedMedValueSet).toBeChecked();

    // customize codes:
    const openDrawer = page.getByTestId("drawer-open-true");
    await expect(openDrawer).not.toBeVisible();

    await expandedMedValueSet.hover();
    await page.getByTestId(CLICKED_CONDITION.sampleMedValueSetID).click();
    await expect(openDrawer).toBeVisible();

    const code = page
      .locator("tr", { has: page.getByText(CLICKED_CONDITION.sampleCodeID) })
      .getByTestId("checkbox");
    await expect(code.getByRole("checkbox")).toBeChecked();

    await code.click();
    await expect(code.getByRole("checkbox")).not.toBeChecked();

    // close the drawer:
    const closeBtn = openDrawer.getByLabel("Close drawer");
    await closeBtn.click();
    await expect(openDrawer).not.toBeVisible();
  });

  // test("backnav and add/remove data", async ({ page }) => {
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
