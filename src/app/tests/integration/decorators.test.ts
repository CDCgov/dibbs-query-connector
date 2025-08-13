import { internal_getDbClient } from "@/app/backend/db/config";
import { suppressConsoleLogs } from "./fixtures";
import { insertFhirServer } from "@/app/backend/fhir-servers/service";

const dbClientQuery = jest.spyOn(internal_getDbClient(), "query");
suppressConsoleLogs();

describe("transaction decorator", () => {
  it("function decorated with @transaction should initiate a rollback if there's an intermediate error", async () => {
    dbClientQuery.mockImplementationOnce(() =>
      Promise.reject(new Error("test error")),
    );
    await insertFhirServer("testname", "com.example", false, true);

    expect(dbClientQuery).toHaveBeenCalledWith("ROLLBACK");
  });
});
