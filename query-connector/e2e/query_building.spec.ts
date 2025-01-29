// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { DEFAULT_QUERIES } from "@/app/(pages)/queryBuilding/fixtures";

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
const ADDED_CONDITION = {
  name: "Disease caused by severe acute respiratory syndrome coronavirus 2",
  condition_id: "840539006",
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

test.describe("editing an exisiting query", () => {
  // Start every test by navigating to the customize query workflow
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/queryBuilding`);
    await expect(
      page.getByRole("heading", {
        name: "Query Library",
        exact: true,
      }),
    ).toBeVisible();

    // Default queries should render
    DEFAULT_QUERIES.forEach(async (query) => {
      await expect(page.getByTitle(query.query_name)).toBeVisible();
    });
  });

  test("edit query name", async ({ page }) => {
    const subjectQuery = DEFAULT_QUERIES[0];
    const query = page.getByTitle(subjectQuery.query_name);
    await expect(query).toBeVisible();

    // click edit
    await query.hover();
    const editBtn = page
      .getByRole("button")
      .locator(`#${subjectQuery.query_id}`)
      .getByText("Edit");
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    //  customize query
    await expect(
      page.getByRole("heading", {
        name: CUSTOM_QUERY,
      }),
    ).toBeVisible();

    const actionButton = page.getByTestId("createSaveQueryBtn");
    await expect(actionButton).toBeVisible();
    await expect(actionButton).toHaveText("Customize query");
    await expect(actionButton).not.toBeDisabled(); // not disabled since we have condition(s) + name filled

    // update query name
    const queryNameInput = page.getByTestId("queryNameInput");
    expect(queryNameInput).toHaveValue(subjectQuery.query_name);
    const newName = await queryNameInput.inputValue();

    await queryNameInput.fill(`${newName}-edited`);

    // move to next page
    await actionButton.click();
    await expect(actionButton).toContainText("Save query");

    // save edited query, back to my queries page
    await actionButton.click();
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();

    // change name back to original
    await query.hover();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    expect(queryNameInput).toHaveValue(newName);
    await queryNameInput.fill(subjectQuery.query_name);

    await actionButton.click();
    await expect(actionButton).toContainText("Save query");

    await actionButton.click();
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();
  });

  test("edit query conditions", async ({ page }) => {
    const subjectQuery = DEFAULT_QUERIES[0];
    const query = page.locator("tr", {
      has: page.getByTitle(subjectQuery.query_name),
    });

    await expect(query).toBeVisible();

    // click edit
    await query.hover();
    const editBtn = query
      .getByRole("button")
      .locator(`#${subjectQuery.query_id}`)
      .getByText("Edit");
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    //  customize query
    await expect(
      page.getByRole("heading", {
        name: CUSTOM_QUERY,
      }),
    ).toBeVisible();

    const actionButton = page.getByTestId("createSaveQueryBtn");
    await expect(actionButton).toBeVisible();
    await expect(actionButton).toHaveText("Customize query");
    await expect(actionButton).not.toBeDisabled(); // not disabled since we have condition(s) + name filled

    // update query conditions
    const search = page.getByTestId("textInput");
    await search.fill(ADDED_CONDITION.name);

    await page.getByText(ADDED_CONDITION.name, { exact: true }).click();
    expect(page.getByText(ADDED_CONDITION.name, { exact: true })).toBeChecked;

    // move to next page
    await actionButton.click();
    await expect(actionButton).toContainText("Save query");

    // save edited query, back to my queries page
    await actionButton.click();
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();

    // confirm query shows correct condition/s
    await editBtn.click();
    expect(page.getByText(ADDED_CONDITION.name, { exact: true })).toBeChecked;
    expect(page.getByText(subjectQuery.query_name, { exact: true }))
      .toBeChecked;

    // remove added condition
    await page.getByText(ADDED_CONDITION.name, { exact: true }).click();
    expect(page.getByText(ADDED_CONDITION.name, { exact: true })).not
      .toBeChecked;

    // move to next page
    await actionButton.click(); // customize query
    await expect(actionButton).toContainText("Save query");

    // save edited query, back to my queries page
    await actionButton.click(); // save query
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();

    expect(page.getByText(ADDED_CONDITION.name, { exact: true })).not
      .toBeChecked;
  });

  test("edit query value sets and concept codes", async ({ page }) => {
    const subjectQuery = DEFAULT_QUERIES[0];
    const subjectVS = DEFAULT_QUERIES[0].valuesets[0];
    const subjectConcept = subjectVS.concepts[0];

    const query = page.locator("tr", {
      has: page.getByTitle(subjectQuery.query_name),
    });

    await expect(query).toBeVisible();

    // click edit
    await query.hover();
    const editBtn = query
      .getByRole("button")
      .locator(`#${subjectQuery.query_id}`)
      .getByText("Edit");
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    //  customize query
    await expect(
      page.getByRole("heading", {
        name: CUSTOM_QUERY,
      }),
    ).toBeVisible();

    const actionButton = page.getByTestId("createSaveQueryBtn");
    await expect(actionButton).toBeVisible();

    // move to next page
    await actionButton.click();
    await expect(actionButton).toContainText("Save query");

    // uncheck a value set
    const labsHeader = page.getByTestId("accordionButton_labs");
    await expect(labsHeader).toBeVisible();
    await labsHeader.click();

    const firstLabVS = page.getByTestId("accordionItem_labs");
    const firstVsCheckTarget = firstLabVS.getByTestId("checkbox");
    // initial render is a minus state, so need to check and uncheck to reset the
    // state to uncheck
    await firstVsCheckTarget.dblclick();
    await expect(firstVsCheckTarget.getByRole("checkbox")).toBeChecked();
    await firstVsCheckTarget.click();

    // recheck a single concept code
    const openDrawer = page.getByTestId("drawer-open-true");
    await expect(openDrawer).not.toBeVisible();

    await firstLabVS.hover();
    await page
      .getByTestId(`container-${subjectVS.valueSetId}`)
      .getByRole("button")
      .click();
    await expect(openDrawer).toBeVisible();

    const code = page
      .locator("tr", { hasText: subjectConcept.code })
      .getByTestId("checkbox");
    await expect(code.getByRole("checkbox")).not.toBeChecked(); // because we unchecked all codes in prev step
    await code.click();
    await expect(code.getByRole("checkbox")).toBeChecked();

    // close the drawer:
    const closeBtn = openDrawer.getByLabel("Close drawer");
    await closeBtn.click();
    await expect(openDrawer).not.toBeVisible();

    // save edited query, back to my queries page
    await actionButton.click();
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();
  });
});
