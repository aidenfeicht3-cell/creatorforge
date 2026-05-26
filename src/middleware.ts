// Middleware intentionally disabled.
//
// Next.js 15 runs middleware on the Edge runtime, which doesn't allow the
// dynamic code generation that Supabase's SSR client relies on. Auth is
// already enforced server-side inside the dashboard layout (see
// src/app/dashboard/layout.tsx), so we don't need middleware to do it.

import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Empty matcher = middleware never runs.
  matcher: [],
};
