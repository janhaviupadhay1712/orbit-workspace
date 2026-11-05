import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// OAuth return point: swaps the ?code for a session cookie, then sends the user on (only to same-site paths).
export async function GET(req: Request) {
  const url = new URL(req.url); const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/"; const safe = /^\/(?!\/)/.test(next) ? next : "/";
  if (code) {
    const sb = await createClient(); const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safe, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=oauth", url.origin));
}