// src/middleware.js
import { NextResponse } from "next/server";

/**
 * Middleware function to handle URL redirection.
 * @param request - The incoming request object.
 * @returns The response after processing the middleware.
 */
export function middleware(request) {
  const url = request.nextUrl.clone();

  // Redirect only if the path is exactly '/' or empty
  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/query-connector";
    return NextResponse.redirect(url);
  }

  // Prevent any further redirects if the path already includes '/query-connector'
  if (url.pathname === "/query-connector") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export { auth as middleware } from "@/auth";
