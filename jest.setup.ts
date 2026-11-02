import "@testing-library/jest-dom";
import * as matchers from "jest-extended";
import dbService from "./src/app/backend/db/service";

expect.extend(matchers);
global.MessagePort = require("node:worker_threads").MessagePort;

if (process.env.TEST_TYPE === "integration") {
  afterAll(async () => {
    // close the DB connection so Jest doesn't complain about remaining open handles
    await dbService?.end();
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
