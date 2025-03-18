// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { DEFAULT_QUERIES } from "@/app/(pages)/queryBuilding/fixtures";
import { CONDITION_DRAWER_SEARCH_PLACEHOLDER } from "@/app/(pages)/queryBuilding/components/utils";

// consts
const QUERY_LIBRARY = "Query Library";
const CUSTOM_QUERY = "Custom Query";

const ADDED_CONDITION = {
  name: "Disease caused by severe acute respiratory syndrome coronavirus 2",
  condition_id: "840539006",
};

// since we're deleting / editing the queries across browsers and asserting on
// in between state in a way that might cause race conditions, run these serially
test.describe.configure({ mode: "serial" });

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
  });

  test("edit query name", async ({ page }) => {
    const subjectQuery = DEFAULT_QUERIES[0];
    const originalName = structuredClone(subjectQuery.query_name);
    const query = page.getByTitle(originalName);
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
    await expect(actionButton).toHaveText("Save query");
    await expect(actionButton).not.toBeDisabled(); // not disabled since we have condition(s) + name filled

    // update query name
    const queryNameInput = page.getByTestId("queryNameInput");
    expect(queryNameInput).toHaveValue(originalName);
    await queryNameInput.fill(`${originalName}-edited`);

    // save edited query, back to my queries page
    await actionButton.click();
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();
    expect(
      page.getByRole("cell", { name: "Cancer case investigation-edited" }),
    ).toBeVisible();

    // change name back to original
    await query.hover();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    expect(queryNameInput).toHaveValue(`${originalName}-edited`);
    await queryNameInput.fill(originalName);
    await expect(actionButton).toContainText("Save query");
    await actionButton.click();

    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();
  });

  test("edit query conditions", async ({ page }) => {
    test.describe.configure({ mode: "serial" });

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
    await expect(actionButton).not.toBeDisabled(); // not disabled since we have condition(s) + name filled
    await expect(actionButton).toHaveText("Save query");

    // update query conditions
    page.getByTestId("add-condition-icon").click();
    const search = page.getByPlaceholder(CONDITION_DRAWER_SEARCH_PLACEHOLDER);
    await search.fill(ADDED_CONDITION.name);

    await page.getByTestId(`update-${ADDED_CONDITION.condition_id}`).hover();
    expect(
      page.getByTestId(`condition-drawer-add-${ADDED_CONDITION.condition_id}`),
    ).toBeVisible();
    await page
      .getByTestId(`condition-drawer-add-${ADDED_CONDITION.condition_id}`)
      .click();
    await expect(page.getByText(`ADDED`)).toBeVisible();
    await page
      .getByTestId("drawer-open-true")
      .getByTestId(`close-drawer`)
      .click();

    // move to next page
    await expect(actionButton).toContainText("Save query");
    await actionButton.click();

    // save edited query, back to my queries page
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();

    // confirm query shows correct condition/s

    await editBtn.click();
    await expect(actionButton).not.toBeDisabled();
    expect(
      page.getByTestId(`${ADDED_CONDITION.condition_id}-conditionCard`),
    ).toBeEnabled();

    // remove added condition
    await page
      .getByTestId(`${ADDED_CONDITION.condition_id}-conditionCard`)
      .hover();

    await page
      .getByTestId(`delete-condition-${ADDED_CONDITION.condition_id}`)
      .locator("path")
      .click();

    // save edited query, back to my queries page
    await actionButton.click(); // save query
    await expect(
      page.getByRole("heading", {
        name: QUERY_LIBRARY,
      }),
    ).toBeVisible();

    expect(page.getByRole("cell", { name: "Cancer (Leukemia)" })).toBeVisible();
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

    // uncheck a value set
    const labsHeader = page.getByTestId("accordionButton_labs");
    await expect(labsHeader).toBeVisible();
    await labsHeader.click();

    const firstLabVS = page.getByTestId("accordionItem_labs");
    const firstVsCheckTarget = firstLabVS.getByTestId("checkbox");
    // initial render is a minus state, so need to check and uncheck to reset the
    // state to uncheck
    await firstVsCheckTarget.click();
    await expect(firstVsCheckTarget.getByRole("checkbox")).not.toBeChecked();
    await firstVsCheckTarget.click();
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
