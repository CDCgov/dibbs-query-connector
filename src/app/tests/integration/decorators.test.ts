import { suppressConsoleLogs } from "./fixtures";
import { insertFhirServer } from "@/app/backend/fhir-servers/service";
import dbService from "@/app/backend/db/service";
import { resetMocksToDefault } from "./mocks";

jest.mock("@/app/backend/db/decorators/auth");

describe("transaction decorator", () => {
  beforeEach(() => {
    resetMocksToDefault();
    suppressConsoleLogs();
  });

  afterAll(() => {
    resetMocksToDefault();
  });

  it("function decorated with @transaction should initiate a rollback if there's an intermediate error", async () => {
    const dbClientQuery = jest.spyOn(dbService, "query");

    dbClientQuery.mockImplementation((queryArg) => {
      if (queryArg === "BEGIN" || queryArg === "ROLLBACK") {
        return Promise.resolve({
          rows: [],
          rowCount: 0,
          command: queryArg,
          oid: 0,
          fields: [],
        });
      }
      return Promise.reject(new Error("test error"));
    });

    const result = await insertFhirServer(
      "testname",
      "com.example",
      false,
      true,
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to save the FHIR server configuration.");

    expect(dbClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(dbClientQuery).toHaveBeenCalledWith("BEGIN");
    expect(dbClientQuery).not.toHaveBeenCalledWith("COMMIT");

    dbClientQuery.mockRestore();
  }, 10000);
});
