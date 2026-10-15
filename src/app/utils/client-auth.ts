/**
 * Checks if the property AUTH_DISABLED is true
 * USE ONLY ON FRONTEND COMPONENTS
 * @param runtimeConfig - object that contains all runtime variables
 * @returns true if auth is disabled for the application
 */
export function isAuthDisabledClientCheck(
  runtimeConfig: Record<string, string> | undefined,
): boolean {
  return runtimeConfig?.AUTH_DISABLED === "true";
}
