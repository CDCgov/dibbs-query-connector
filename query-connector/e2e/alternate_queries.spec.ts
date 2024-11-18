import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { PAGE_TITLES } from "@/app/query/components/stepIndicator/StepIndicator";

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

    // Delete Last name and MRN to force phone number as one of the 3 fields
    await page.getByLabel("Last name").clear();
    await page.getByLabel("Medical Record Number").clear();

    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption("Local e2e HAPI Server: Direct");

    // Among verification, make sure phone number is right
    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: PAGE_TITLES["patient-results"] }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: PAGE_TITLES["select-query"] }),
    ).toBeVisible();
    await page.getByTestId("Select").selectOption("chlamydia");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await expect(page.getByText("Patient Name")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT_NAME)).toBeVisible();
    await expect(page.getByText("Contact")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT.Phone)).toBeVisible();
    await expect(page.getByText("Patient Identifiers")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT.MRN)).toBeVisible();
  });

  // test("social determinants query with generalized function", async ({
  test("cancer query with generalized function", async ({ page }) => {
    await page.getByRole("button", { name: "Go to the demo" }).click();
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
    // await page.getByTestId("Select").selectOption("social-determinants");
    await page.getByTestId("Select").selectOption("cancer");
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
    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption("Local e2e HAPI Server: Direct");

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
