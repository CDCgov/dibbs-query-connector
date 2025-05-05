// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";

// consts
const QUERY_LIBRARY = "Query Library";
const CUSTOM_QUERY = "Custom Query";
const SELECT_TEMPLATES = "Start from template(s)";
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

    const backLink = page.getByTestId("backArrowLink");
    expect(backLink).toContainText(BACKLINK_MY_QUERIES);

    const actionButton = page.getByTestId("createSaveQueryBtn");
    expect(actionButton).toBeVisible();
    expect(actionButton).toHaveText("Customize query");
    expect(actionButton).toBeDisabled();

    const input = page.getByTestId("queryNameInput");
    const hasFocus = await input.evaluate(
      (node) => document.activeElement === node,
    );
    expect(hasFocus).toBeTruthy();

    // start adding conditions:
    await page.getByText(CLICKED_CONDITION.name, { exact: true }).click();
    expect(page.getByText(CLICKED_CONDITION.name, { exact: true })).toBeChecked;

    await page.getByLabel("Query name").fill(Math.random().toString());
    await expect(actionButton).toBeEnabled();

    const search = page.getByTestId("textInput");
    await search.fill("syp");
    await page.getByText(SEARCHED_CONDITION.name, { exact: true }).click();
    expect(page.getByText(SEARCHED_CONDITION.name, { exact: true }))
      .toBeChecked;

    // move to value set selection:
    await actionButton.click();

    const labsHeader = page.getByTestId("accordionButton_labs");
    const conditionsHeader = page.getByTestId("accordionButton_conditions");
    const medicationsHeader = page.getByTestId("accordionButton_medications");

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
    const labCheckbox = page
      .locator(
        `[data-testid="container-${CLICKED_CONDITION.sampleLabValueSetID}"]`,
      )
      .getByRole("checkbox");
    await expect(labCheckbox).toBeChecked();

    await labCheckbox.click();
    await expect(labCheckbox).not.toBeChecked();

    await medicationsHeader.click();
    const medCheckbox = page
      .locator(
        `[data-testid="container-${CLICKED_CONDITION.sampleMedValueSetID}"]`,
      )
      .getByRole("checkbox");
    await expect(medCheckbox).toBeVisible();
    await expect(medCheckbox).toBeChecked();

    // customize codes:
    const openDrawer = page.getByTestId("drawer-open-true");
    await expect(openDrawer).not.toBeVisible();

    await page
      .getByTestId(`viewCodes-${CLICKED_CONDITION.sampleMedValueSetID}`)
      .click();
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
});
