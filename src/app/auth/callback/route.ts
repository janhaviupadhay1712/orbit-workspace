import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// Return point for sign-in with Google/GitHub and for password-reset emails: swaps the ?code for a session cookie,
// then sends the user on (only to same-site paths).
export async function GET(req: Request) {
  const url = new URL(req.url); const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/"; const safe = /^\/(?!\/)/.test(next) ? next : "/";
  if (code) {
    const sb = await createClient(); const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safe, url.origin));
  }
  const failed = safe.startsWith("/reset-password") ? "/forgot-password?expired=1" : "/login?error=oauth";
  return NextResponse.redirect(new URL(failed, url.origin));
}