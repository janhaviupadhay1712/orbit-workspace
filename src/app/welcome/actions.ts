"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/ratelimit";
const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), use_case: z.string().trim().max(200).optional(), source: z.string().trim().max(50).optional() });
export type WaitlistState = { ok: boolean; message: string } | null;
export async function joinWaitlist(_prev: WaitlistState, f: FormData): Promise<WaitlistState> {
  const done = { ok: true, message: "You’re on the list! We’ll email you when early access opens." };
  if (String(f.get("website") ?? "")) return done; // honeypot: real people never see or fill this hidden field
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`waitlist:${ip}`, 5, 10 * 60_000)) return { ok: false, message: "Too many attempts. Please try again in a few minutes." };
  const p = schema.safeParse({ email: f.get("email"), use_case: f.get("use_case") || undefined, source: f.get("source") || undefined });
  if (!p.success) return { ok: false, message: "Please enter a valid email address." };
  const sb = await createClient();
  const { error } = await sb.from("waitlist").insert(p.data);
  if (error && error.code !== "23505") return { ok: false, message: "Something went wrong. Please try again." }; // 23505 = already signed up: show success, don't reveal who is on the list
  return done;
}