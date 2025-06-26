import { NextResponse } from "next/server";
import { getOrCreateKeys } from "../../../../../setup-scripts/gen-keys";

/**
 * API endpoint for the SMART on FHIR auth flow
 * @returns the JWKS key set needed for auth
 */
export async function GET() {
  try {
    // Get or create JWKS
    const jwks = await getOrCreateKeys();

    // Return the JWKS as JSON with appropriate headers
    return NextResponse.json(jwks, {
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error serving JWKS:", error);
    return NextResponse.json(
      { error: "Failed to load or generate JWKS" },
      { status: 500 },
    );
  }
}
