import { Page, expect } from "@playwright/test";
import { showSiteAlert } from "./constants";

/**
 * 
 * @param page The page instance on which to run the test
 * @param matchText Optional string to check for expected text content; if blank,
 * defaults to generic PII warning
 */
export const checkForSiteAlert = async (page: Page, matchText?: string) => {
    const text = matchText ?? "This site is for demo purposes only. Please do not enter PII on this website."

    if (showSiteAlert) {
        const alert = page.getByTestId("alert");
        await expect(alert).toBeVisible();
        await expect(alert).toHaveText(text);
      }
  }