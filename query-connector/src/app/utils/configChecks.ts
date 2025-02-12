/**
 * Checks if the property DEMO_MODE is true (Configured this way in demo env only)
 * @returns true if the application is running in demo env
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

/**
 * Checks if the property AUTH_DISABLED is true
 * @returns true if auth is disabled for the application
 */
export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === "true";
}
