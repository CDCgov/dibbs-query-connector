import { Page, expect } from "@playwright/test";
import { CANCER_FRONTEND_NESTED_INPUT, showSiteAlert } from "./constants";
import { internal_getDbClient } from "@/app/backend/db/config";
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  NestedQuery,
  QueryTableResult,
} from "@/app/(pages)/queryBuilding/utils";
import {
  saveCustomQueryHelp,
  getSavedQueryByIdHelp,
} from "@/app/backend/query-building/lib";
import { translateSnakeStringToCamelCase } from "@/app/backend/db/util";
import AxeBuilder from "@axe-core/playwright";

/**
 *
 * @param page The page instance on which to run the test
 * @param matchText Optional string to check for expected text content; if blank,
 * defaults to generic PII warning
 */
export const checkForSiteAlert = async (page: Page, matchText?: string) => {
  const text =
    matchText ??
    "This site is for demo purposes only. Please do not enter PII on this website.";

  if (showSiteAlert) {
    const alert = page.getByTestId("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(text);
  }
};

const dbClient = internal_getDbClient();

/**
 * Helper function that creates a custom query and grabs it back in return
 * @returns a camel-cased Custom Query
 */
export async function createTestCancerQuery() {
  const queryInputFixture = CANCER_FRONTEND_NESTED_INPUT as NestedQuery;
  const randomName = "Cancer query " + Math.random() * 100;
  const author = "Test Steward";
  const result = await saveCustomQueryHelp(
    queryInputFixture,
    randomName,
    author,
    dbClient,
    EMPTY_MEDICAL_RECORD_SECTIONS,
  );
  if (result === undefined) throw Error("Failed to set up test query");

  const queryResult = (await getSavedQueryByIdHelp(
    result[0].id,
    dbClient,
  )) as QueryTableResult;

  const val: Record<string, unknown> = {};
  Object.entries(queryResult).forEach(([k, v]) => {
    val[translateSnakeStringToCamelCase(k)] = v;
  });

  return val as unknown as QueryTableResult;
}

/**
 * Helper function that scans the page for any automatic Axe errors
 * @param page - the page object generated in the test
 * @returns - runs an Axe sweep to see if there are errors
 */
export async function runAxeAccessibilityChecks(page: Page) {
  const accessiblityChecker = await new AxeBuilder({
    page,
  }).analyze();
  expect(accessiblityChecker.violations).toEqual([]);
}
