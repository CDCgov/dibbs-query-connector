import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Path to the JWKS file
    const jwksPath = path.join(process.cwd(), "keys", "jwks.json");

    // Read the JWKS file
    const jwksContent = fs.readFileSync(jwksPath, "utf-8");
    const jwks = JSON.parse(jwksContent);

    // Return the JWKS as JSON
    return NextResponse.json(jwks, {
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error serving JWKS:", error);
    return NextResponse.json({ error: "Failed to load JWKS" }, { status: 500 });
  }
}
