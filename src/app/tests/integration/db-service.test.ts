import dbService from "@/app/backend/db/service";
import { resetMocksToDefault } from "./mocks";

jest.mock("@/app/backend/db/decorators/auth");
jest.mock("@/app/backend/audit-logs/decorator");

describe("db service", () => {
  beforeEach(() => {
    resetMocksToDefault();
  });

  it("query function should return camel-cased rows", async () => {
    const auditQuery = "SELECT * FROM fhir_servers;";
    const auditResult = await dbService.query(auditQuery);
    expect(
      auditResult.rows.map((e) => {
        Object.keys(e).forEach((k) => {
          expect(k.match(/^[a-z][a-zA-Z0-9]*$/g)).toHaveLength(1);
        });
      }),
    );
  });
});
