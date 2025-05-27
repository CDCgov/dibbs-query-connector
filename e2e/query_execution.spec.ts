// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { PAGE_TITLES } from "@/app/(pages)/query/components/stepIndicator/StepIndicator";
import {
  CONTACT_US_DISCLAIMER_EMAIL,
  CONTACT_US_DISCLAIMER_TEXT,
} from "@/app/ui/designSystem/SiteAlert";
import {
  DEFAULT_FHIR_SERVER,
  TEST_PATIENT,
  TEST_PATIENT_NAME,
  showSiteAlert,
} from "./constants";
import { checkForSiteAlert } from "./utils";

test.describe("querying with the Query Connector", () => {
  test.beforeEach(async ({ page }) => {
    // Start every test on our main landing page
    await page.goto(TEST_URL);
    await expect(page.getByText("Redirecting...")).not.toBeVisible();
  });

  test("unsuccessful user query: no patients", async ({ page }) => {
    await page.getByRole("button", { name: "Fill fields" }).click();
    await page.getByLabel("First name").fill("Shouldnt");
    await page.getByLabel("Last name").fill("Findanyone");
    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption(DEFAULT_FHIR_SERVER);

    await page.getByRole("button", { name: "Search for patient" }).click();

    // Better luck next time, user!
    await expect(
      page.getByRole("heading", { name: "No Records Found" }),
    ).toBeVisible();
    await expect(
      page.getByText("No records were found for your search"),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Revise your patient search" })
      .click();
  });

  test("successful demo user query", async ({ page }) => {
    // Check that the info alert is visible and contains the correct text
    if (showSiteAlert) {
      await checkForSiteAlert(page);
    }

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
      .selectOption(DEFAULT_FHIR_SERVER);

    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await page.getByRole("button", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: "Select a query" }),
    ).toBeVisible();
    await page
      .getByTestId("Select")
      .selectOption("Chlamydia case investigation");

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

    // Check that the info alert is visible and has updated to the correct text
    if (showSiteAlert) {
      const matchText = `${CONTACT_US_DISCLAIMER_TEXT} ${CONTACT_US_DISCLAIMER_EMAIL}`;
      checkForSiteAlert(page, matchText);
    }

    await expect(
      page.getByRole("button", { name: "Observations", expanded: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Medication Requests", expanded: true }),
    ).toBeVisible();

    // We can also just directly ask the page to find us the number of rows
    // in each section of the results page
    // Observations
    await expect(
      page
        .getByRole("table")
        .getByRole("row")
        .filter({ hasText: "Chlamydia trachomatis DNA" }),
    ).toHaveCount(4);
    // Encounters
    await expect(
      page
        .getByRole("table")
        .getByRole("row")
        .filter({ hasText: "Sexual overexposure" }),
    ).toHaveCount(3);
    // 4 Conditions + 3 Medication Requests (Reason Code)
    await expect(
      page
        .getByRole("table")
        .getByRole("row")
        .filter({ hasText: "Chlamydial infection, unspecified" }),
    ).toHaveCount(7);
    // Diagnostic Reports
    await expect(
      page.getByRole("table").getByRole("row").filter({
        hasText: "Chlamydia trachomatis and Neisseria gonorrhoeae DNA panel",
      }),
    ).toHaveCount(3);
    // Medication Requests
    await expect(
      page
        .getByRole("table")
        .getByRole("row")
        .filter({ hasText: "azithromycin 1000 MG" }),
    ).toHaveCount(2);

    // Now let's use the return to search to go back to a blank form
    await page.getByRole("button", { name: "New patient search" }).click();
    await expect(
      page.getByRole("heading", {
        name: PAGE_TITLES["search"].title,
        exact: true,
      }),
    ).toBeVisible();
  });
});

test.describe("alternate queries with the Query Connector", () => {
  test.beforeEach(async ({ page }) => {
    // Start every test on our main landing page
    await page.goto(TEST_URL);
  });

  test("query using form-fillable demo patient by phone number", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Fill fields" }).click();

    // Delete Last name and MRN to force phone number as one of the 3 fields
    await page.getByLabel("Last name").clear();
    await page.getByLabel("Medical Record Number").clear();

    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption(DEFAULT_FHIR_SERVER);

    // Among verification, make sure phone number is right
    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: PAGE_TITLES["patient-results"].title }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: PAGE_TITLES["select-query"].title }),
    ).toBeVisible();
    await page
      .getByTestId("Select")
      .selectOption("Chlamydia case investigation");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await expect(page.getByText("Patient Name")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT_NAME)).toBeVisible();
    await expect(page.getByText("Contact")).toBeVisible();
    const visiblePhones = page
      .getByText(TEST_PATIENT.Phone)
      .filter({ has: page.locator(":visible") });
    await expect(visiblePhones).toHaveCount(1);
    await expect(page.getByText("Patient Identifiers")).toBeVisible();
    await expect(page.getByText(TEST_PATIENT.MRN)).toBeVisible();
  });

  // test("social determinants query with generalized function", async ({
  test("cancer query with generalized function", async ({ page }) => {
    await page.getByRole("button", { name: "Fill fields" }).click();
    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption(DEFAULT_FHIR_SERVER);

    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await page.getByRole("button", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: "Select a query" }),
    ).toBeVisible();
    await page.getByTestId("Select").selectOption("Cancer case investigation");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await expect(
      page.getByRole("heading", { name: "Patient Record" }),
    ).toBeVisible();
  });

  test("form-fillable STI query using generalized function", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Fill fields" }).click();
    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("Healthcare Organization (HCO)")
      .selectOption(DEFAULT_FHIR_SERVER);

    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });
    await page.getByRole("button", { name: "Select patient" }).click();
    await page
      .getByTestId("Select")
      .selectOption("Chlamydia case investigation");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await expect(
      page.getByRole("heading", { name: "Patient Record" }),
    ).toBeVisible();
  });
});
