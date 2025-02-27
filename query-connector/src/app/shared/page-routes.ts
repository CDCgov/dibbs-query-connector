import { RoleTypeValues } from "../models/entities/users";

/**
 * Pathnames
 */
export enum PAGES {
  LANDING = "/",
  QUERY = "/query",
  MY_QUERIES = "/queryBuilding",
  FHIR_SERVERS = "/fhirServers",
  USER_MANAGEMENT = "/userManagement",
  GROUP_MANAGEMENT = "/userManagement/userGroups",
}

interface Page {
  path: string;
  name: string;
  roleAccess: RoleTypeValues[];
}
/**
 * Pages configuration
 */

export const pagesConfig: Record<string, Page> = {};

pagesConfig[PAGES.QUERY] = {
  path: PAGES.QUERY,
  name: "Query",
  roleAccess: [
    RoleTypeValues.SuperAdmin,
    RoleTypeValues.Admin,
    RoleTypeValues.Standard,
  ],
};

pagesConfig[PAGES.MY_QUERIES] = {
  path: PAGES.MY_QUERIES,
  name: "My Queries",
  roleAccess: [RoleTypeValues.SuperAdmin, RoleTypeValues.Admin],
};

pagesConfig[PAGES.FHIR_SERVERS] = {
  path: PAGES.FHIR_SERVERS,
  name: "FHIR Servers",
  roleAccess: [RoleTypeValues.SuperAdmin],
};

pagesConfig[PAGES.USER_MANAGEMENT] = {
  path: PAGES.USER_MANAGEMENT,
  name: "User Management",
  roleAccess: [RoleTypeValues.SuperAdmin, RoleTypeValues.Admin],
};

/**
 * @param userRole - the logged in user's role
 * @returns List of pages that will display in the settings menu based on the user's role
 */
export function getSettingsMenuPages(userRole: RoleTypeValues): Page[] {
  return Object.values(pagesConfig)
    .filter((page: Page) => page.roleAccess.includes(userRole))
    .sort((a, b) => (a.name > b.name ? 1 : -1));
}
