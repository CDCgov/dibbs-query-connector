import { getPagesInSettingsMenu, pagesConfig, PAGES } from "./page-routes";
import { UserRole } from "../models/entities/users";

describe("pagesConfig", () => {
  it("defines each configured page with a path, name and roleAccess", () => {
    for (const page of Object.values(pagesConfig)) {
      expect(typeof page.path).toBe("string");
      expect(typeof page.name).toBe("string");
      expect(Array.isArray(page.roleAccess)).toBe(true);
    }
  });
});

describe("getPagesInSettingsMenu", () => {
  it("returns every configured page for a super admin", () => {
    const pages = getPagesInSettingsMenu(UserRole.SUPER_ADMIN);
    expect(pages).toHaveLength(Object.keys(pagesConfig).length);
  });

  it("filters out pages the role cannot access", () => {
    const adminPaths = getPagesInSettingsMenu(UserRole.ADMIN).map(
      (p) => p.path,
    );
    // Admins do not get FHIR servers or audit logs.
    expect(adminPaths).not.toContain(PAGES.FHIR_SERVERS);
    expect(adminPaths).not.toContain(PAGES.AUDIT_LOGS);
    expect(adminPaths).toContain(PAGES.QUERY_BUILDING);
  });

  it("gives a standard user only the pages open to them", () => {
    const standardPaths = getPagesInSettingsMenu(UserRole.STANDARD).map(
      (p) => p.path,
    );
    expect(standardPaths).toContain(PAGES.QUERY);
    expect(standardPaths).toContain(PAGES.DOCS);
    expect(standardPaths).not.toContain(PAGES.USER_MANAGEMENT);
  });

  it("returns pages sorted by ascending position", () => {
    const positions = getPagesInSettingsMenu(UserRole.SUPER_ADMIN).map(
      (p) => p.position,
    );
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });
});
