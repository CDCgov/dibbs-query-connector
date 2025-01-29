import Auth from "@/auth"; // Uses `auth` from v5

/**
 * Handles authentication requests for NextAuth.
 * Maps authentication handlers to GET and POST methods.
 * @param req - The incoming request object.
 * @returns The authentication response.
 */
export const { GET, POST } = Auth;
