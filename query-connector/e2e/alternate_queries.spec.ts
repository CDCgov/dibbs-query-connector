import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { STEP_TWO_PAGE_TITLE } from "@/app/query/components/patientSearchResults/PatientSearchResultsTable";
import { STEP_THREE_PAGE_TITLE } from "@/app/query/components/selectQuery/SelectSavedQuery";
import { TEST_PATIENT, TEST_PATIENT_NAME } from "./constants";

test.describe("alternate queries with the Query Connector", () => {
  test.beforeEach(async ({ page }) => {
    // Start every test on our main landing page
    await page.goto(TEST_URL);
  });

  test("query using form-fillable demo patient by phone number", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Go to the demo" }).click();
    await page.getByRole("button", { name: "Fill fields" }).click();

    // Delete last name and MRN to force phone number as one of the 3 fields
    await page.getByLabel("Last Name").clear();
    await page.getByLabel("Medical Record Number").clear();

    // Among verification, make sure phone number is right
    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: STEP_TWO_PAGE_TITLE }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: STEP_THREE_PAGE_TITLE }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await expect(page.getByText("Patient Name")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT_NAME)).toBeVisible();
    await expect(page.getByText("Contact")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT.Phone)).toBeVisible();
    await expect(page.getByText("Patient Identifiers")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT.MRN)).toBeVisible();
  });

  test("social determinants query with generalized function", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Go to the demo" }).click();
    await page.getByRole("button", { name: "Fill fields" }).click();
    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await page.getByRole("link", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: "Select a query" }),
    ).toBeVisible();
    await page.getByTestId("Select").selectOption("social-determinants");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await expect(
      page.getByRole("heading", { name: "Patient Record" }),
    ).toBeVisible();
  });

  test("form-fillable STI query using generalized function", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Go to the demo" }).click();
    await page.getByRole("button", { name: "Fill fields" }).click();
    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });
    await page.getByRole("link", { name: "Select patient" }).click();
    await page.getByTestId("Select").selectOption("chlamydia");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await expect(
      page.getByRole("heading", { name: "Patient Record" }),
    ).toBeVisible();
  });
});
