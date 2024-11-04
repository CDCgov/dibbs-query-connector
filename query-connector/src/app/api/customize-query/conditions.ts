import { NextResponse } from "next/server";
import { getConditionsData } from "@/app/database-service";

/**
 * Handles a GET request to fetch conditions data.
 * @returns Response with conditions data in JSON format.
 */
export async function GET() {
  try {
    const conditionsData = await getConditionsData();
    return NextResponse.json(conditionsData, { status: 200 });
  } catch (error) {
    console.error("Error fetching conditions data:", error);
    return NextResponse.json(
      { error: "Failed to fetch conditions data" },
      { status: 500 },
    );
  }
}
