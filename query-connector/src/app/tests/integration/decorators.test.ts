import { getDbClient } from "@/app/backend/dbClient";
// import * as decorators from "@/app/shared/decorators";
import FHIRClient from "@/app/shared/fhirClient";
// import { get, getBatch, post } from "@/app/shared/fhirClient";
import { insertFhirServer } from "@/app/backend/dbServices/fhir-servers";
import { suppressConsoleLogs } from "./fixtures";

const dbClientQuery = jest.spyOn(getDbClient(), "query");
const decorators = jest.requireActual("@/app/shared/decorators")
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

describe("auditable decorator", () => {
  it("function decorated with @auditable should log results of FHIRClient", async () => {
    // const FHIRClient = jest.mock("@/app/shared/fhirClient", () => { 
    //   return {
    //     get: jest.fn((query) => Promise.resolve(true)),
    //     // getBatch: jest.fn(() => Promise.resolve(true)),
    //     // post: jest.fn(() => Promise.resolve(true))
    //   };
    // });
    // const client = require("@/app/shared/fhirClient");
    // const spy = jest.spyOn(client, "get");
    // const auditable = client.get("some query");

    // FHIRClient.mockImplementationOnce(() => Promise.resolve(new Response("hereisapath")));
    // const log = await get();
    const client = new FHIRClient("path", [{id: "9174",
      name: "path",
      hostname: "hoo",
      last_connection_attempt: new Date(),
      last_connection_successful: false,
      headers: {header: "headerhere"},
      disable_cert_validation: true}]);
    const spy = global.fetch = jest.fn();
    client.get("path");
    // const auditable = jest.spyOn(decorators, "auditable");
    // expect(FHIRClient).toHaveBeenCalledWith("get");
    expect(spy).toHaveBeenCalled();
    expect(decorators.auditable).toHaveBeenCalledAfter(spy);
    // expect(auditable).toHaveBeenCalled();
  });
});
