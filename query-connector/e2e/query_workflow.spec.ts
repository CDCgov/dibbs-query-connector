// @ts-check

import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { PAGE_TITLES } from "@/app/query/components/stepIndicator/StepIndicator";
import {
  CONTACT_US_DISCLAIMER_EMAIL,
  CONTACT_US_DISCLAIMER_TEXT,
} from "@/app/query/designSystem/SiteAlert";
import { TEST_PATIENT, TEST_PATIENT_NAME } from "./constants";

test.describe("querying with the Query Connector", () => {
  test.beforeEach(async ({ page }) => {
    // Start every test on our main landing page
    await page.goto(TEST_URL);
  });

  test("unsuccessful user query: no patients", async ({ page }) => {
    await page.getByRole("button", { name: "Go to the demo" }).click();
    await page.getByRole("button", { name: "Fill fields" }).click();
    await page.getByLabel("First Name").fill("Shouldnt");
    await page.getByLabel("Last Name").fill("Findanyone");
    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("FHIR Server (QHIN)")
      .selectOption("Local e2e HAPI Server: Direct");

    await page.getByRole("button", { name: "Search for patient" }).click();

    // Better luck next time, user!
    await expect(
      page.getByRole("heading", { name: "No Records Found" }),
    ).toBeVisible();
    await expect(
      page.getByText("No records were found for your search"),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Revise your patient search" })
      .click();
  });

  test("successful demo user query", async ({ page }) => {
    await page.getByRole("button", { name: "Go to the demo" }).click();

    // Check that the info alert is visible and contains the correct text
    const alert = page.locator(".custom-alert");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(
      "This site is for demo purposes only. Please do not enter PII on this website.",
    );
    await expect(
      page.getByRole("heading", { name: PAGE_TITLES["search"], exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Fill fields" }).click();
    // Select FHIR server from drop down
    await page.getByRole("button", { name: "Advanced" }).click();
    await page
      .getByLabel("FHIR Server (QHIN)")
      .selectOption("Local e2e HAPI Server: Direct");

    await page.getByRole("button", { name: "Search for patient" }).click();
    await expect(page.getByText("Loading")).toHaveCount(0, { timeout: 10000 });

    await page.getByRole("link", { name: "Select patient" }).click();
    await expect(
      page.getByRole("heading", { name: "Select a query" }),
    ).toBeVisible();
    await page.getByTestId("Select").selectOption("chlamydia");

    // For some reason only in Chromium (ie not in firefox / webkit) there were
    // issues connecting to the database for the cancer use case, which was resulting
    // in errors on the results view screen when checking for the query result.
    // Switching to chlymdia seemed to solve the issue, but leaving this check
    // in just in case something similar happens in the future so the unlucky
    // dev can have a note to help debug.
    await page.getByRole("button", { name: "Customize Query" }).click();
    await expect(
      page.getByRole("heading", { name: "Customize Query" }),
    ).toBeVisible();
    await expect(
      page.getByText("0 labs found, 0 medications found, 0 conditions found."),
    ).not.toBeVisible();
    await page.getByText("Return to Select query").click();

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
      page.getByText(`Medical Record Number: ${TEST_PATIENT.MRN}`),
    ).toBeVisible();

    // Check that the info alert is visible and has updated to the correct text
    const alert2 = page.locator(".custom-alert");
    await expect(alert2).toBeVisible();
    await expect(alert2).toHaveText(
      `${CONTACT_US_DISCLAIMER_TEXT} ${CONTACT_US_DISCLAIMER_EMAIL}`,
    );

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
        .filter({ hasText: "Chlamydia trachomatis DNA" })
        .getByRole("row"),
    ).toHaveCount(18);
    // Encounters
    await expect(
      page
        .getByRole("table")
        .filter({ hasText: "Sexual overexposure" })
        .getByRole("row"),
    ).toHaveCount(5);
    // Conditions
    await expect(
      page
        .getByRole("table")
        .filter({ hasText: "Chlamydial infection, unspecified" })
        .getByRole("row"),
    ).toHaveCount(3);
    // Diagnostic Reports
    await expect(
      page
        .getByRole("table")
        .filter({
          hasText: "Chlamydia trachomatis and Neisseria gonorrhoeae DNA panel",
        })
        .getByRole("row"),
    ).toHaveCount(4);
    // Medication Requests
    await expect(
      page
        .getByRole("table")
        .filter({ hasText: "azithromycin 1000 MG" })
        .getByRole("row"),
    ).toHaveCount(7);

    // Now let's use the return to search to go back to a blank form
    await page.getByRole("button", { name: "New patient search" }).click();
    await expect(
      page.getByRole("heading", { name: PAGE_TITLES["search"], exact: true }),
    ).toBeVisible();
  });
});
