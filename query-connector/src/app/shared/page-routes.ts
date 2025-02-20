import { UserRole } from "../models/entities/user-management";

/**
 * Pathnames
 */
export enum PAGES {
  LANDING = "/",
  QUERY = "/query",
  QUERY_BUILDING = "/queryBuilding",
  FHIR_SERVERS = "/fhirServers",
  USER_MANAGEMENT = "/userManagement",
}

/**
 * Role access per page
 */
export const pagesRoleAccess: Record<string, UserRole[]> = {};

pagesRoleAccess[PAGES.QUERY] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.STANDARD,
];

pagesRoleAccess[PAGES.QUERY_BUILDING] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
];

pagesRoleAccess[PAGES.FHIR_SERVERS] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
];

pagesRoleAccess[PAGES.USER_MANAGEMENT] = [
  UserRole.SUPER_ADMIN, UserRole.ADMIN
];

/**
 * List of pages behind authentication (display in the menu)
 */
export const LOGGED_IN_PATHS = Object.keys(pagesRoleAccess);
