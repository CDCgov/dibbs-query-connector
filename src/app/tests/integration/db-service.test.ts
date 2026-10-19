import dbService from "@/app/backend/db/service";

jest.mock("@/auth", () => ({
  superAdminAccessCheck: jest.fn().mockResolvedValue(true),
  adminAccessCheck: jest.fn().mockResolvedValue(true),
  authenticatedAccessCheck: jest.fn().mockResolvedValue(true),
}));

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
