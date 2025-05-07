import dbService from "@/app/backend/db/client";

describe("db service", () => {
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
