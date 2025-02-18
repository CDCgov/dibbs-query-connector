import { RoleTypeValues } from "../models/entities/user-management";

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

/**
 * Role access per page
 */
export const pagesRoleAccess: Record<string, RoleTypeValues[]> = {};

pagesRoleAccess[PAGES.QUERY] = [
  RoleTypeValues.SuperAdmin,
  RoleTypeValues.Admin,
  RoleTypeValues.Standard,
];

pagesRoleAccess[PAGES.MY_QUERIES] = [
  RoleTypeValues.SuperAdmin,
  RoleTypeValues.Admin,
];

pagesRoleAccess[PAGES.FHIR_SERVERS] = [
  RoleTypeValues.SuperAdmin,
  RoleTypeValues.Admin,
];

pagesRoleAccess[PAGES.USER_MANAGEMENT] = [RoleTypeValues.SuperAdmin];

pagesRoleAccess[PAGES.GROUP_MANAGEMENT] = [
  RoleTypeValues.SuperAdmin,
  RoleTypeValues.Admin,
];

/**
 * List of pages behind authentication (display in the menu)
 */
export const LOGGED_IN_PATHS = Object.keys(pagesRoleAccess);
