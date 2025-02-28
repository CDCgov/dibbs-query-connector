import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";

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
  });
  // test("Users tab loads list of users", async ({ page }) => {
  //   await page.getByRole("link", { name: "Try it out" }).click();
  //   await page.getByTestId("menu-button").click();
  //   await page.getByRole("link", { name: "User Management" }).click();
  //   await expect(
  //     page.getByRole("heading", { name: "User management" }),
  //   ).toBeVisible();
  //   // Users tab is selected by default
  //   await expect(page.getByRole("link", { name: "Users" })).toHaveClass(
  //     /border-bottom-05 border-primary/,
  //   );
  //   await expect(page.getByText("No users found")).toBeVisible();
  // });
});
