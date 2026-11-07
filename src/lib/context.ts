import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
// cache(): the layout and the page both call this, but within one request it runs only once (one auth check, one membership query).
export const getContext = cache(async () => {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser(); // verified with Supabase Auth: this is the authoritative check
  if (!user) redirect("/login");
  const [{ data: m }, { data: prof }] = await Promise.all([
    sb.from("organization_members").select("org_id, role, organizations(name)").eq("user_id", user.id).limit(1).maybeSingle(),
    sb.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle()]);
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>;
  const displayName: string = prof?.full_name || meta.full_name || meta.name || (user.email ?? "User").split("@")[0];
  const avatarUrl: string | null = prof?.avatar_url || meta.avatar_url || meta.picture || null;
  return { sb, user, displayName, avatarUrl, orgId: m?.org_id as string | undefined, role: m?.role as string | undefined, orgName: (m as any)?.organizations?.name as string | undefined };
});