import { getDbClient } from "@/app/backend/dbClient";
import {
  getFhirServerConfigs,
  insertFhirServer,
} from "@/app/backend/dbServices/fhir-servers";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import * as decorators from "@/app/shared/decorators";
import FHIRClient from "@/app/shared/fhirClient";
import { suppressConsoleLogs } from "./fixtures";

jest.mock("@/app/shared/decorators", () => {
  const originalModule = jest.requireActual("@/app/shared/decorators");
  return {
    __esModule: true,
    auditable: jest.fn(originalModule.auditable),
    transaction: jest.fn(originalModule.transaction),
  };
});
suppressConsoleLogs();

describe("transaction decorator", () => {
  const dbClient = getDbClient();
  const dbClientQuery = jest.spyOn(dbClient, "query");

  it("function decorated with @transaction should initiate a rollback if there's an intermediate error", async () => {
    dbClientQuery.mockImplementationOnce(() =>
      Promise.reject(new Error("test error")),
    );
    await insertFhirServer("testname", "com.example", false, true);

    expect(dbClientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(decorators.transaction).toHaveBeenCalled();
  });
});

describe("auditable decorator", () => {
  it("function decorated with @auditable should log results of FHIRClient", async () => {
    const SERVER_NAME = "Aidbox";
    const testServer = (await getFhirServerConfigs(false)).find(
      (s) => s.name === SERVER_NAME,
    ) as FhirServerConfig;

    const client = new FHIRClient(SERVER_NAME, [
      {
        id: testServer.id,
        name: testServer.name,
        hostname: testServer.hostname,
        last_connection_attempt: new Date(),
        last_connection_successful: testServer.last_connection_successful,
        headers: testServer.headers,
        disable_cert_validation: testServer.disable_cert_validation,
      },
    ]);
    await client.get("somepath");
    expect(decorators.auditable).toHaveBeenCalled();
  });
});
