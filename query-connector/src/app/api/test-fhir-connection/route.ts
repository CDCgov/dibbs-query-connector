import FHIRClient from "@/app/shared/fhirClient";
import { NextRequest, NextResponse } from "next/server";

/**
 * Test FHIR connection
 * @param request - Incoming request
 * @returns Response with the result of the test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, disableCertValidation, authData } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 },
      );
    }

    const result = await FHIRClient.testConnection(
      url,
      disableCertValidation,
      authData,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error testing FHIR connection:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
