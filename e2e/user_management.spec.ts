import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { runAxeAccessibilityChecks } from "./utils";

test.describe("User management", () => {
  test.beforeEach(async ({ page }) => {
    // Start every test on our main landing page
    await page.goto(`${TEST_URL}/userManagement`);
  });

  test("Users tab loads list of users", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "User management" }),
    ).toBeVisible();
    // Users tab is selected by default
    await expect(page.getByRole("button", { name: "Users" })).toHaveClass(
      /tabGroup_tab__active__/,
    );
    await expect(page.getByText("Mario, Mario")).toBeVisible();
    await runAxeAccessibilityChecks(page);
  });
});
