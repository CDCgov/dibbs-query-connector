import { NextResponse } from "next/server";

/**
 * @swagger
 * /api:
 *   get:
 *     description: Returns the health status of the API
 *     responses:
 *       200:
 *         description: Health check for Query Connector
 * @returns An indication for the health of the API
 */
export async function GET() {
  return NextResponse.json({ status: "OK" }, { status: 200 });
}
