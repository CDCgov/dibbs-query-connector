import { internal_getDbClient } from "@/app/backend/db/config";
import "@testing-library/jest-dom";
import { toHaveNoViolations } from "jest-axe";
import * as matchers from "jest-extended";
import { Pool } from "pg";

expect.extend(toHaveNoViolations);
expect.extend(matchers);

if (process.env.TEST_TYPE === "integration") {
  let dbClient: Pool | null = null;
  beforeAll(() => {
    dbClient = internal_getDbClient();
  });

  afterAll(async () => {
    await dbClient?.end();
  });
}
