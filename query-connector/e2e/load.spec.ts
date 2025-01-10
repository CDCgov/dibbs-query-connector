import { test, expect } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { metadata } from "@/app/constants";

test("landing page loads", async ({ page }) => {
  await page.goto(TEST_URL);

  // Check that each expected text section is present
  await expect(
    page.getByRole("heading", { name: "Data collection made easier" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "What is it?" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "How does it work?" }),
  ).toBeVisible();

  // Check that interactable elements are present (header and Get Started)
  await expect(page.getByRole("link", { name: metadata.title })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try it out" })).toBeVisible();
});
