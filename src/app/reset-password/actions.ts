"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function setNewPassword(f: FormData) {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/forgot-password?expired=1");
  const pw = String(f.get("password") ?? ""), again = String(f.get("confirm") ?? "");
  if (pw.length < 8) redirect("/reset-password?error=short");
  if (pw !== again) redirect("/reset-password?error=mismatch");
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) redirect("/reset-password?error=failed");
  redirect("/profile?saved=password");
}