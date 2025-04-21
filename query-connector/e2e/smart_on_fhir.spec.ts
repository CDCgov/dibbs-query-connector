import { TEST_URL } from "../playwright-setup";
import { test, expect } from "@playwright/test";
import { E2E_SMART_TEST_CLIENT_ID } from "./constants";
import {
  createSmartJwt,
  getOrCreateKeys,
} from "@/app/backend/dbServices/smartOnFhir/lib";
import { decodeJwt, decodeProtectedHeader } from "jose";

test.describe("SMART on FHIR", () => {
  // NOTE: this E2E doesn't work on local UI mode due to Docker networking issues
  test("successfully validates the e2e flow", async ({ page }) => {
    await page.goto(`${TEST_URL}/fhirServers`);
    expect(
      page.getByRole("heading", { name: "FHIR server configuration" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "New server" }).click();
    await expect(
      page.getByRole("heading", { name: "New server" }),
    ).toBeVisible();
    const serverName = `E2E Smart on FHIR ${Math.random() * 100}`;
    await page.getByTestId("server-name").fill(serverName);

    await page
      .getByTestId("server-url")
      .fill(`${process.env.AIDBOX_BASE_URL}/fhir`);

    await page.getByTestId("auth-method").selectOption("SMART");
    await page.getByTestId("client-id").fill(E2E_SMART_TEST_CLIENT_ID);

    await page.getByTestId("scopes").fill("system/*.read");
    await page
      .getByTestId("token-endpoint")
      .fill(`${process.env.AIDBOX_BASE_URL}/auth/token`);

    await page.getByRole("button", { name: "Test connection" }).click();
    await expect(page.getByRole("button", { name: "Success" })).toBeVisible();

    await page.getByRole("button", { name: "Add server" }).click();

    await expect(
      page.getByRole("row").filter({ hasText: serverName }),
    ).toHaveText(/Connected/);
  });

  // This integration test is stuck in the e2e setting because of weird issues running
  // our JWT signing library in a JSDOM environment. Trying to sign the JWT errors
  // with type errors complaining about the payload needing to a UTF-8 array,
  // which after some digging is an issue running the library within JSDOM.
  // Relevant issue here: https://github.com/vitest-dev/vitest/issues/5685
  test("JWT creation generates the correct token and signing creates the right request payload", async () => {
    const tokenEndpoint = `${process.env.AIDBOX_BASE_URL}/auth/token`;

    // make sure key pair exist, and create them if they don't
    await getOrCreateKeys();

    const outputJWT = await createSmartJwt(
      E2E_SMART_TEST_CLIENT_ID,
      tokenEndpoint,
    );

    const header = decodeProtectedHeader(outputJWT);
    expect(header.alg).toBe("RS384");
    expect(header.typ).toBe("JWT");
    expect(header.jku).toBe(
      `${process.env.APP_HOSTNAME}/.well-known/jwks.json`,
    );
    const claims = decodeJwt(outputJWT);
    expect(claims.aud).toBe(tokenEndpoint);
    expect(claims.iss).toBe(E2E_SMART_TEST_CLIENT_ID);
    expect(claims.sub).toBe(E2E_SMART_TEST_CLIENT_ID);
  });
});
