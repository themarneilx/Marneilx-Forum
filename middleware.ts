import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // CORS Headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Simple protected route check logic (placeholder)
  // In a real app with Firebase, we'd verify a session cookie here.
  // For this implementation, we rely on client-side auth guarding for UI
  // and server-side token verification for API routes.
  
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
