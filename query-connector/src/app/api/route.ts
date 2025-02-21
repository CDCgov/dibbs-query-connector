import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * @returns An indication for the health of the API
 */
export async function GET() {
  return NextResponse.json({ status: "OK" }, { status: 200 });
}
