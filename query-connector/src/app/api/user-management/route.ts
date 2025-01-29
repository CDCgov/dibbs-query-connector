import { NextResponse } from "next/server";
import { addUserIfNotExists } from "@/app/backend/user-management";

/**
 * API route for adding a user to the user_management table.
 * @param req - The incoming request object.
 * @returns A response indicating success or failure.
 */
export async function POST(req: Request) {
  try {
    const userToken = await req.json();

    if (!userToken?.username) {
      return NextResponse.json(
        { error: "Invalid user token" },
        { status: 400 },
      );
    }

    const user = await addUserIfNotExists(userToken);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in user-management API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
