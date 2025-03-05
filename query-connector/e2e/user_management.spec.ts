import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";

test.describe("User management", () => {
  test.beforeEach(async ({ page }) => {
    // Start every test on our main landing page
    await page.goto(TEST_URL);
  });

  test("User management tab does not show for Standard users", async ({
    page,
  }) => {
    await page.getByRole("link", { name: "Try it out" }).click();
    await page.getByTestId("menu-button").click();
    expect(
      await page.getByTestId("dropdown-menu").allTextContents(),
    ).not.toContain("User Management");
  });

  test("Users tab loads list of users", async ({ page }) => {
    await page.getByRole("link", { name: "Try it out" }).click();
    await page.getByTestId("menu-button").click();
    await page.getByRole("link", { name: "User Management" }).click();
    await expect(
      page.getByRole("heading", { name: "User management" }),
    ).toBeVisible();
    // Users tab is selected by default
    await expect(page.getByRole("link", { name: "Users" })).toHaveClass(
      /tabGroup_tab__active/,
    );
    await expect(page.getByText("No users found")).toBeVisible();
  });
});
