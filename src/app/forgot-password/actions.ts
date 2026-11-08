"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ratelimit";
export type ResetState = { ok: boolean; message: string } | null;
export async function requestPasswordReset(_prev: ResetState, f: FormData): Promise<ResetState> {
  const email = z.string().trim().toLowerCase().email().max(254).safeParse(f.get("email"));
  if (!email.success) return { ok: false, message: "Please enter a valid email address." };
  const h = await headers(); const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`reset-ip:${ip}`, 5, 15 * 60_000) || !rateLimit(`reset-email:${email.data}`, 3, 15 * 60_000)) return { ok: false, message: "Too many requests. Please try again in a few minutes." };
  const host = h.get("host") ?? ""; const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const sb = await createClient();
  const { error } = await sb.auth.resetPasswordForEmail(email.data, { redirectTo: `${proto}://${host}/auth/callback?next=/reset-password` });
  if (error) {
    console.error("[reset-password]", error.status, error.message); // details stay in the server log
    if (error.status === 429) return { ok: false, message: "Too many emails were sent recently. Please wait a few minutes and try again." };
  }
  // Same answer whether or not the account exists, so this form can't be used to find out who has an account.
  return { ok: true, message: "If an account exists for that email, we’ve sent a link to reset the password. Open it in this same browser." };
}