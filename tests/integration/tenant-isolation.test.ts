// Runs against a REAL Supabase project (use a throwaway/test project, never production).
// Set TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_ROLE_KEY. Skipped when unset.
// The service-role key is used only here to create/delete test users; the app never uses it.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const { TEST_SUPABASE_URL: url, TEST_SUPABASE_ANON_KEY: anon, TEST_SUPABASE_SERVICE_ROLE_KEY: svc } = process.env;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
type U = { id: string; email: string; sb: SupabaseClient };

describe.skipIf(!url || !anon || !svc)("tenant isolation & permissions (RLS)", () => {
  const admin = createClient(url!, svc!, opts); const run = Date.now();
  const users: U[] = []; const orgs: string[] = [];
  let A: U, B: U, C: U, orgA: string, orgB: string, projA: string, taskA: string;

  async function mk(tag: string): Promise<U> {
    const email = `rls-${tag}-${run}@example.test`, password = "Test-pass-12345";
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true }); if (error) throw error;
    const sb = createClient(url!, anon!, opts); const s = await sb.auth.signInWithPassword({ email, password }); if (s.error) throw s.error;
    const u = { id: data.user!.id, email, sb }; users.push(u); return u;
  }
  beforeAll(async () => {
    [A, B, C] = [await mk("a"), await mk("b"), await mk("c")];
    orgA = (await A.sb.rpc("create_organization", { org_name: "Org A" })).data; orgB = (await B.sb.rpc("create_organization", { org_name: "Org B" })).data;
    orgs.push(orgA, orgB);
    projA = (await A.sb.from("projects").insert({ org_id: orgA, name: "Secret", owner_id: A.id }).select("id").single()).data!.id;
    taskA = (await A.sb.from("tasks").insert({ org_id: orgA, project_id: projA, title: "Private task", created_by: A.id }).select("id").single()).data!.id;
  });
  afterAll(async () => { // orgs cascade to all tenant data; then remove users
    for (const o of orgs) await admin.from("organizations").delete().eq("id", o);
    for (const u of users) await admin.auth.admin.deleteUser(u.id);
  });

  it("outsider cannot read another org's data", async () => {
    for (const t of ["projects", "tasks", "organizations", "organization_members", "activities", "comments"]) {
      const { data } = await B.sb.from(t).select("*").eq(t === "organizations" ? "id" : "org_id", orgA); expect(data ?? []).toHaveLength(0);
    }
    expect((await B.sb.from("tasks").select("id").eq("id", taskA)).data).toHaveLength(0);
    expect((await B.sb.rpc("list_members", { o: orgA })).data ?? []).toHaveLength(0);
  });
  it("outsider cannot write into another org", async () => {
    expect((await B.sb.from("projects").insert({ org_id: orgA, name: "x" })).error).not.toBeNull();
    expect((await B.sb.from("tasks").insert({ org_id: orgA, project_id: projA, title: "x", created_by: B.id })).error).not.toBeNull();
    await B.sb.from("tasks").update({ title: "hacked" }).eq("id", taskA);
    await B.sb.from("projects").delete().eq("id", projA);
    const { data } = await A.sb.from("tasks").select("title").eq("id", taskA).single(); expect(data!.title).toBe("Private task");
    expect((await A.sb.from("projects").select("id").eq("id", projA)).data).toHaveLength(1);
  });
  it("a task cannot point at a project from a different org", async () => {
    const { data: pB } = await B.sb.from("projects").insert({ org_id: orgB, name: "B proj" }).select("id").single();
    expect((await B.sb.from("tasks").insert({ org_id: orgB, project_id: projA, title: "x", created_by: B.id })).error).not.toBeNull();
    expect(pB!.id).toBeTruthy();
  });
  it("invitations: only the addressed email can accept; plain members cannot manage", async () => {
    const inv = await A.sb.from("invitations").insert({ org_id: orgA, email: B.email, role: "member", invited_by: A.id }).select("token").single();
    expect(inv.error).toBeNull();
    expect((await B.sb.from("invitations").select("id").eq("org_id", orgA)).data).toHaveLength(0); // not yet a member
    expect((await C.sb.rpc("accept_invitation", { invite_token: inv.data!.token })).error).not.toBeNull(); // wrong account
    expect((await B.sb.rpc("accept_invitation", { invite_token: inv.data!.token })).error).toBeNull();
    // B is now a plain member of A:
    expect((await B.sb.from("tasks").select("id").eq("id", taskA)).data).toHaveLength(1);
    expect((await B.sb.from("invitations").insert({ org_id: orgA, email: "z@example.test", role: "admin", invited_by: B.id })).error).not.toBeNull();
    expect((await B.sb.rpc("set_member_role", { o: orgA, u: B.id, new_role: "admin" })).error).not.toBeNull();
    expect((await B.sb.rpc("remove_member", { o: orgA, u: A.id })).error).not.toBeNull(); // cannot remove the owner
    await B.sb.from("tasks").delete().eq("id", taskA); // admin-only delete
    expect((await A.sb.from("tasks").select("id").eq("id", taskA)).data).toHaveLength(1);
  });
  it("owner can change roles; used invites cannot be reused", async () => {
    expect((await A.sb.rpc("set_member_role", { o: orgA, u: B.id, new_role: "admin" })).error).toBeNull();
    expect((await A.sb.rpc("set_member_role", { o: orgA, u: B.id, new_role: "owner" })).error).not.toBeNull();
  });
  it("users only see their own notifications", async () => {
    await B.sb.from("comments").insert({ task_id: taskA, body: "hi", author_id: B.id });
    expect((await A.sb.from("notifications").select("id").eq("user_id", A.id)).data!.length).toBeGreaterThan(0);
    expect((await B.sb.from("notifications").select("id").eq("user_id", A.id)).data).toHaveLength(0);
    expect((await C.sb.from("notifications").select("id")).data).toHaveLength(0);
  });
  it("dependencies: no self/cross-org links, and cycles (direct and transitive) are rejected", async () => {
    const mkT = async (title: string) => (await A.sb.from("tasks").insert({ org_id: orgA, project_id: projA, title, created_by: A.id }).select("id").single()).data!.id as string;
    const [t2, t3] = [await mkT("t2"), await mkT("t3")]; const dep = (u: U, a: string, b: string) => u.sb.from("task_dependencies").insert({ task_id: a, depends_on_id: b, created_by: u.id });
    expect((await dep(A, t2, taskA)).error).toBeNull();
    expect((await dep(A, taskA, t2)).error).not.toBeNull();   // direct cycle
    expect((await dep(A, t3, t2)).error).toBeNull();
    expect((await dep(A, taskA, t3)).error).not.toBeNull();   // transitive cycle
    expect((await dep(A, t2, t2)).error).not.toBeNull();      // self
    const pB = (await C.sb.rpc("create_organization", { org_name: "Org C" })).data as string; orgs.push(pB);
    const prjC = (await C.sb.from("projects").insert({ org_id: pB, name: "C" }).select("id").single()).data!.id;
    const tC = (await C.sb.from("tasks").insert({ org_id: pB, project_id: prjC, title: "c", created_by: C.id }).select("id").single()).data!.id;
    expect((await dep(C, tC, taskA)).error).not.toBeNull();   // cross-org, cannot even see taskA
  });
  it("subtasks: one level, same project", async () => {
    const sub = await A.sb.from("tasks").insert({ org_id: orgA, project_id: projA, title: "sub", parent_id: taskA, created_by: A.id }).select("id").single();
    expect(sub.error).toBeNull();
    expect((await A.sb.from("tasks").insert({ org_id: orgA, project_id: projA, title: "nested", parent_id: sub.data!.id, created_by: A.id })).error).not.toBeNull();
    const p2 = (await A.sb.from("projects").insert({ org_id: orgA, name: "Other" }).select("id").single()).data!.id;
    expect((await A.sb.from("tasks").insert({ org_id: orgA, project_id: p2, title: "x", parent_id: taskA, created_by: A.id })).error).not.toBeNull();
  });
});
