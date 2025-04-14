import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { CONDITION_DRAWER_SEARCH_PLACEHOLDER } from "@/app/(pages)/queryBuilding/components/utils";
import {
  NestedQuery,
  QueryTableResult,
} from "@/app/(pages)/queryBuilding/utils";
import { CANCER_FRONTEND_NESTED_INPUT } from "./constants";
import { getDbClient } from "@/app/backend/dbClient";
import {
  deleteQueryByIdHelp,
  getSavedQueryByIdHelp,
  saveCustomQueryHelp,
} from "@/app/backend/dbServices/queryBuilding/lib";

test.describe("editing an exisiting query", () => {
  let subjectQuery: QueryTableResult;
  // Start every test by navigating to the customize query workflow
  test.beforeEach(async ({ page }) => {
    subjectQuery = await createTestQuery();

    await page.goto(`${TEST_URL}/queryBuilding`);
    await expect(
      page.getByRole("heading", {
        name: "Query Library",
        exact: true,
      }),
    ).toBeVisible();
  });

  test.afterEach(async () => {
    await deleteQueryByIdHelp(subjectQuery.query_id, dbClient);
  });

  test("edit query name", async ({ page }) => {
    const originalName = structuredClone(subjectQuery.query_name);
    const query = page.getByTitle(originalName);
    await expect(query).toBeVisible();

    // click edit
    await query.hover();
    const editBtn = page.getByTestId(`edit-query-${subjectQuery.query_id}`);
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
    await expect(
      page.getByRole("cell", { name: `${subjectQuery.query_name}-edited` }),
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
    const query = page.locator("tr", {
      has: page.getByTitle(subjectQuery.query_name),
    });

    await expect(query).toBeVisible();

    // click edit
    await query.hover();
    const editBtn = query.getByTestId(`edit-query-${subjectQuery.query_id}`);

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
    await expect(
      page.getByTestId(
        `condition-drawer-added-${ADDED_CONDITION.condition_id}`,
      ),
    ).toBeVisible();

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

    expect(
      page
        .getByTestId(`query-row-${subjectQuery.query_id}`)
        .getByRole("cell", { name: "Cancer (Leukemia)" }),
    ).toBeVisible();
  });

  test("edit query value sets and concept codes", async ({ page }) => {
    const subjectVS = Object.values(
      subjectQuery.query_data[CANCER_CONDITION_ID],
    )[0];

    const subjectConcept = subjectVS.concepts[0];

    const query = page.locator("tr", {
      has: page.getByTitle(subjectQuery.query_name),
    });

    await expect(query).toBeVisible();

    // click edit
    await query.hover();
    const editBtn = query.getByTestId(`edit-query-${subjectQuery.query_id}`);
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

const QUERY_LIBRARY = "Query Library";
const CUSTOM_QUERY = "Custom Query";

const ADDED_CONDITION = {
  name: "Disease caused by severe acute respiratory syndrome coronavirus 2",
  condition_id: "840539006",
};
const CANCER_CONDITION_ID = "2";
const dbClient = getDbClient();

async function createTestQuery() {
  const queryInputFixture = CANCER_FRONTEND_NESTED_INPUT as NestedQuery;
  const randomName = "Cancer query " + Math.random() * 100;
  const author = "Test Steward";
  const result = await saveCustomQueryHelp(
    queryInputFixture,
    randomName,
    author,
    dbClient,
  );
  if (result === undefined) throw Error("Failed to set up test query");

  return (await getSavedQueryByIdHelp(
    result[0].id,
    dbClient,
  )) as QueryTableResult;
}
