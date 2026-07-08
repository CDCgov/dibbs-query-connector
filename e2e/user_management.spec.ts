import { test, expect, Page } from "@playwright/test";
import { TEST_URL } from "../playwright-setup";
import { runAxeAccessibilityChecks } from "./utils";

// Users/groups created here are randomized and left in place: there is no
// user-deletion path in the app or backend, and the existing FHIR-server specs
// follow the same create-with-random-name convention (workers=3 run in
// parallel, so names must not collide).
const rand = () => Math.floor(Math.random() * 1_000_000);

/**
 * Fills the "New user" modal and submits it. If user groups exist, the modal
 * advances to an "Add to user groups" step; pass a groupName to check that group
 * before finalizing, otherwise the step is simply confirmed.
 */
async function createUser(
  page: Page,
  user: { firstName: string; lastName: string; email: string },
  groupName?: string,
) {
  await page.getByRole("button", { name: "Add user" }).click();
  await expect(page.getByRole("heading", { name: "New user" })).toBeVisible();

  // Label htmlFor attributes don't all match their input ids in this modal, so
  // target the inputs by id directly.
  await page.locator("#firstName").fill(user.firstName);
  await page.locator("#lastName").fill(user.lastName);
  await page.locator("#email").fill(user.email);

  await page.locator("#modal-step-button").click();

  // The "Add to user groups" step only appears when at least one group exists.
  const groupStep = page.getByRole("heading", { name: "Add to user groups" });
  const stepAppeared = await groupStep
    .waitFor({ state: "visible", timeout: 3000 })
    .then(() => true)
    .catch(() => false);
  if (stepAppeared) {
    if (groupName) {
      // The USWDS checkbox input is visually hidden; click its label (scoped to
      // the modal) to toggle it, matching how other specs drive checkboxes.
      await page.locator("#user-mgmt-modal").getByText(groupName).click();
    }
    await page.locator("#modal-step-button").click();
  }
}

/**
 * Creates a user group from the "User groups" tab and returns its name.
 */
async function createGroup(page: Page): Promise<string> {
  const groupName = `E2E Group ${rand()}`;
  await page.getByRole("button", { name: "User groups" }).click();
  await page.getByRole("button", { name: "Create group" }).click();
  await expect(
    page.getByRole("heading", { name: "Create user group" }),
  ).toBeVisible();
  await page.locator("#group-name").fill(groupName);
  await page.locator("#modal-step-button").click();
  await expect(
    page.getByRole("heading", { name: "Create user group" }),
  ).not.toBeVisible();
  return groupName;
}

test.describe("User management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${TEST_URL}/userManagement`);
    await expect(
      page.getByRole("heading", { name: "User management" }),
    ).toBeVisible();
  });

  test("Users tab loads list of users", async ({ page }) => {
    // Users tab is selected by default
    await expect(page.getByRole("button", { name: "Users" })).toHaveClass(
      /tab__active/,
    );
    await expect(page.getByText("Admin, QC")).toBeVisible();
    await runAxeAccessibilityChecks(page);
  });

  test("creates a new user", async ({ page }) => {
    const firstName = `Test${rand()}`;
    const lastName = `User${rand()}`;
    await createUser(page, {
      firstName,
      lastName,
      email: `qc-${rand()}@example.com`,
    });

    // New users render as "Last, First" in the users table.
    await expect(
      page.getByRole("row").filter({ hasText: `${lastName}, ${firstName}` }),
    ).toBeVisible();
    await runAxeAccessibilityChecks(page);
  });

  test("creates a new user group", async ({ page }) => {
    const groupName = await createGroup(page);

    await expect(
      page.getByRole("row").filter({ hasText: groupName }),
    ).toBeVisible();
    await runAxeAccessibilityChecks(page);
  });

  test("assigns a user to a group during creation", async ({ page }) => {
    // Create a group first so the "Add to user groups" step is guaranteed.
    const groupName = await createGroup(page);

    // Back to the Users tab to add a user and assign it to that group.
    await page.getByRole("button", { name: "Users" }).click();
    const firstName = `Grouped${rand()}`;
    const lastName = `User${rand()}`;
    await createUser(
      page,
      { firstName, lastName, email: `qc-${rand()}@example.com` },
      groupName,
    );

    // The user's row should list the assigned group in the "User groups" column.
    const userRow = page
      .getByRole("row")
      .filter({ hasText: `${lastName}, ${firstName}` });
    await expect(userRow).toBeVisible();
    await expect(userRow.getByText(groupName)).toBeVisible();
  });

  test("changes a user's role", async ({ page }) => {
    const firstName = `Role${rand()}`;
    const lastName = `User${rand()}`;
    await createUser(page, {
      firstName,
      lastName,
      email: `qc-${rand()}@example.com`,
    });

    const userRow = page
      .getByRole("row")
      .filter({ hasText: `${lastName}, ${firstName}` });
    await expect(userRow).toBeVisible();

    // Non-self users render an inline role dropdown; change it and confirm the
    // success toast (updateUserRole persists immediately).
    await userRow.getByRole("combobox").selectOption("Admin");
    await expect(page.getByText("Role successfully updated.")).toBeVisible();
  });
});
