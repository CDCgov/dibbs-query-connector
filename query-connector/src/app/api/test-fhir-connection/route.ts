import { NextRequest, NextResponse } from "next/server";
import { testFhirServerConnection } from "../../shared/query-service";

/**
 * Test FHIR connection
 * @param request - Incoming request
 * @returns Response with the result of the test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, bearerToken } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    const result = await testFhirServerConnection(url, bearerToken);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing FHIR connection:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
