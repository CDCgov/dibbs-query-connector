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

  // Code below from https://github.com/vitest-dev/vitest/issues/4043#issuecomment-2383567554
  // Default TextEncoder produces Uint8Array objects that are _different_ from the global
  // Uint8Array objects, so some functions that compare their types explode.
  class ESBuildAndJSDOMCompatibleTextEncoder extends TextEncoder {
    constructor() {
      super();
    }

    encode(input: string) {
      if (typeof input !== "string") {
        throw new TypeError("`input` must be a string");
      }

      const decodedURI = decodeURIComponent(encodeURIComponent(input));
      const arr = new Uint8Array(decodedURI.length);
      const chars = decodedURI.split("");
      for (let i = 0; i < chars.length; i++) {
        arr[i] = decodedURI[i].charCodeAt(0);
      }
      return arr;
    }
  }

  global.TextEncoder = ESBuildAndJSDOMCompatibleTextEncoder;
}
