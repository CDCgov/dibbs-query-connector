import { getDbClient } from "@/app/backend/dbClient";
import { insertFhirServer } from "@/app/backend/dbServices/fhir-servers";
import { suppressConsoleLogs } from "./fixtures";

const dbClientQuery = jest.spyOn(getDbClient(), "query");
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
