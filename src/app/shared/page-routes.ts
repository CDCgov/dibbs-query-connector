import { UserRole } from "../models/entities/users";

/**
 * Pathnames
 */
export enum PAGES {
  LANDING = "/",
  QUERY = "/query",
  QUERY_BUILDING = "/queryBuilding",
  FHIR_SERVERS = "/fhirServers",
  USER_MANAGEMENT = "/userManagement",
  AUDIT_LOGS = "/auditLogs",
  CODE_LIBRARY = "/codeLibrary",
  DOCS = "/docs",
}

interface Page {
  position: number;
  path: string;
  name: string;
  roleAccess: UserRole[];
}
/**
 * Pages configuration
 */

export const pagesConfig: Record<string, Page> = {};

pagesConfig[PAGES.QUERY] = {
  position: 0,
  path: PAGES.QUERY,
  name: "Run a query",
  roleAccess: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STANDARD],
};

pagesConfig[PAGES.QUERY_BUILDING] = {
  position: 1,
  path: PAGES.QUERY_BUILDING,
  name: "Query library",
  roleAccess: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
};
pagesConfig[PAGES.CODE_LIBRARY] = {
  position: 2,
  path: PAGES.CODE_LIBRARY,
  name: "Code library",
  roleAccess: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
};
pagesConfig[PAGES.USER_MANAGEMENT] = {
  position: 3,
  path: PAGES.USER_MANAGEMENT,
  name: "User management",
  roleAccess: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
};

pagesConfig[PAGES.FHIR_SERVERS] = {
  position: 4,
  path: PAGES.FHIR_SERVERS,
  name: "FHIR servers",
  roleAccess: [UserRole.SUPER_ADMIN],
};

pagesConfig[PAGES.AUDIT_LOGS] = {
  position: 5,
  path: PAGES.AUDIT_LOGS,
  name: "Audit logs",
  roleAccess: [UserRole.SUPER_ADMIN],
};

pagesConfig[PAGES.DOCS] = {
  position: 6,
  path: PAGES.DOCS,
  name: "Documentation",
  roleAccess: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STANDARD],
};

/**
 * @param userRole - the logged in user's role
 * @returns List of pages that will display in the settings menu based on the user's role
 */
export function getPagesInSettingsMenu(userRole: UserRole): Page[] {
  return Object.values(pagesConfig)
    .filter((page: Page) => page.roleAccess.includes(userRole))
    .sort((a, b) => (a.position > b.position ? 1 : -1));
}
