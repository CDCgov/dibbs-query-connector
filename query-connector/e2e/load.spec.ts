import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { showSiteAlert } from "./constants";
import { checkForSiteAlert } from "./utils";
import { PAGE_TITLES } from "@/app/(pages)/query/components/stepIndicator/StepIndicator";

test("landing page loads", async ({ page }) => {
  await page.goto(TEST_URL);
  await expect(page.getByText("Redirecting...")).not.toBeVisible();

  // Check that each expected text section is present
  await expect(
    page.getByRole("heading", {
      name: PAGE_TITLES["search"].title,
      exact: true,
    }),
  ).toBeVisible();
  // Check that interactable elements are present (header and Get Started)
  // Check that the info alert is visible and contains the correct text
  if (showSiteAlert) {
    await checkForSiteAlert(page);
  }
});
