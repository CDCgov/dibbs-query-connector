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
  position: number;
  path: string;
  name: string;
  roleAccess: RoleTypeValues[];
}
/**
 * Pages configuration
 */

export const pagesConfig: Record<string, Page> = {};

pagesConfig[PAGES.QUERY] = {
  position: 0,
  path: PAGES.QUERY,
  name: "Run query",
  roleAccess: [
    RoleTypeValues.SuperAdmin,
    RoleTypeValues.Admin,
    RoleTypeValues.Standard,
  ],
};

pagesConfig[PAGES.MY_QUERIES] = {
  position: 1,
  path: PAGES.MY_QUERIES,
  name: "Query library",
  roleAccess: [RoleTypeValues.SuperAdmin, RoleTypeValues.Admin],
};

pagesConfig[PAGES.USER_MANAGEMENT] = {
  position: 2,
  path: PAGES.USER_MANAGEMENT,
  name: "User management",
  roleAccess: [RoleTypeValues.SuperAdmin, RoleTypeValues.Admin],
};

pagesConfig[PAGES.FHIR_SERVERS] = {
  position: 3,
  path: PAGES.FHIR_SERVERS,
  name: "FHIR servers",
  roleAccess: [RoleTypeValues.SuperAdmin],
};

/**
 * @param userRole - the logged in user's role
 * @returns List of pages that will display in the settings menu based on the user's role
 */
export function getPagesInSettingsMenu(userRole: RoleTypeValues): Page[] {
  return Object.values(pagesConfig)
    .filter((page: Page) => page.roleAccess.includes(userRole))
    .sort((a, b) => (a.position > b.position ? 1 : -1));
}
