"use server";
import { revalidatePath } from "next/cache";
import { getContext } from "@/lib/context";
import { projectSchema, taskSchema, planSchema, STATUSES, type Plan } from "@/lib/schemas";

async function log(c: Awaited<ReturnType<typeof getContext>>, action: string, entity: string, id?: string) {
  await c.sb.from("activities").insert({ org_id: c.orgId, actor_id: c.user.id, action, entity, entity_id: id });
}
export async function createOrg(f: FormData) {
  const { sb } = await getContext(); const name = String(f.get("name") ?? "").trim();
  if (!name) return; const { error } = await sb.rpc("create_organization", { org_name: name });
  if (error) throw new Error(error.message); revalidatePath("/", "layout");
}
export async function createProject(f: FormData) {
  const c = await getContext(); if (!c.orgId) throw new Error("No organization");
  const v = projectSchema.parse({ name: f.get("name"), description: f.get("description") || undefined });
  const { data, error } = await c.sb.from("projects").insert({ ...v, org_id: c.orgId, owner_id: c.user.id }).select("id").single();
  if (error) throw new Error(error.message); await log(c, "project.created", "project", data.id); revalidatePath("/projects");
}
export async function createTask(f: FormData) {
  const c = await getContext(); if (!c.orgId) throw new Error("No organization");
  const v = taskSchema.parse(Object.fromEntries(f));
  const { data, error } = await c.sb.from("tasks").insert({ ...v, due_date: v.due_date || null, org_id: c.orgId, created_by: c.user.id, assignee_id: c.user.id }).select("id").single();
  if (error) throw new Error(error.message); await log(c, "task.created", "task", data.id); revalidatePath("/", "layout");
}
export async function setTaskStatus(id: string, status: string) {
  const c = await getContext(); if (!(STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status");
  const { error } = await c.sb.from("tasks").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message); await log(c, "task.status_changed", "task", id); revalidatePath("/", "layout");
}
// Approved AI plan: re-validated server-side, created under the user's own RLS session, then verified by count.
export async function approvePlan(raw: Plan) {
  const c = await getContext(); if (!c.orgId) return { ok: false, error: "No organization" };
  const plan = planSchema.safeParse(raw); if (!plan.success) return { ok: false, error: "Invalid plan" };
  const { data: p, error } = await c.sb.from("projects").insert({ name: plan.data.name, description: plan.data.description, org_id: c.orgId, owner_id: c.user.id }).select("id").single();
  if (error) return { ok: false, error: error.message };
  const rows = plan.data.tasks.map(t => ({ ...t, status: "todo", project_id: p.id, org_id: c.orgId, created_by: c.user.id }));
  const { error: e2 } = await c.sb.from("tasks").insert(rows);
  if (e2) { await c.sb.from("projects").delete().eq("id", p.id); return { ok: false, error: e2.message }; }
  const { count } = await c.sb.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", p.id);
  await log(c, "ai.plan_approved", "project", p.id); revalidatePath("/", "layout");
  return count === rows.length ? { ok: true, projectId: p.id, created: count } : { ok: false, error: "Verification mismatch" };
}

export async function addComment(f: FormData) {
  const c = await getContext(); const { commentSchema } = await import("@/lib/schemas");
  const v = commentSchema.parse({ task_id: f.get("task_id"), body: f.get("body") });
  const { error } = await c.sb.from("comments").insert({ task_id: v.task_id, body: v.body, author_id: c.user.id });
  if (error) throw new Error(error.message);
  await log(c, "comment.created", "task", v.task_id); revalidatePath(`/tasks/${v.task_id}`);
}
export async function markRead(f: FormData) {
  const c = await getContext(); const id = String(f.get("id") ?? "");
  const q = c.sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", c.user.id).is("read_at", null);
  const { error } = await (id ? q.eq("id", id) : q); // empty id = mark all as read
  if (error) throw new Error(error.message); revalidatePath("/inbox");
}

// ---- Members & invitations (authorization is enforced by RLS + SECURITY DEFINER functions in SQL) ----
import { redirect } from "next/navigation";
import { inviteSchema, roleChangeSchema } from "@/lib/schemas";
export async function inviteMember(f: FormData) {
  const c = await getContext(); if (!c.orgId) throw new Error("No organization");
  const v = inviteSchema.parse({ email: f.get("email"), role: f.get("role") });
  const { error } = await c.sb.from("invitations").insert({ ...v, org_id: c.orgId, invited_by: c.user.id });
  if (error) throw new Error(error.code === "23505" ? "That email already has a pending invitation." : "Could not create invitation (admins only).");
  await log(c, "member.invited", "invitation"); revalidatePath("/settings");
}
export async function revokeInvite(f: FormData) {
  const c = await getContext(); const { error } = await c.sb.from("invitations").delete().eq("id", String(f.get("id")));
  if (error) throw new Error(error.message); revalidatePath("/settings");
}
export async function changeRole(f: FormData) {
  const c = await getContext(); const v = roleChangeSchema.parse({ user_id: f.get("user_id"), role: f.get("role") });
  const { error } = await c.sb.rpc("set_member_role", { o: c.orgId, u: v.user_id, new_role: v.role });
  if (error) throw new Error(error.message); revalidatePath("/settings");
}
export async function removeMember(f: FormData) {
  const c = await getContext(); const uid = String(f.get("user_id"));
  const { error } = await c.sb.rpc("remove_member", { o: c.orgId, u: uid });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout"); if (uid === c.user.id) redirect("/");
}
export async function acceptInvite(f: FormData) {
  const c = await getContext(); const token = String(f.get("token"));
  if (!/^[0-9a-f-]{36}$/i.test(token)) throw new Error("Invalid invitation");
  const { error } = await c.sb.rpc("accept_invitation", { invite_token: token });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout"); redirect("/");
}

// ---- Subtasks & dependencies (structure rules and cycle detection are enforced by DB triggers) ----
export async function addSubtask(f: FormData) {
  const c = await getContext(); const parent = String(f.get("parent_id")); const title = String(f.get("title") ?? "").trim().slice(0, 200);
  if (!title) return; if (!/^[0-9a-f-]{36}$/i.test(parent)) throw new Error("Invalid task");
  const { data: p } = await c.sb.from("tasks").select("org_id, project_id").eq("id", parent).maybeSingle(); if (!p) throw new Error("Task not found");
  const { data, error } = await c.sb.from("tasks").insert({ title, parent_id: parent, project_id: p.project_id, org_id: p.org_id, created_by: c.user.id, assignee_id: c.user.id }).select("id").single();
  if (error) throw new Error(error.message); await log(c, "subtask.created", "task", data.id); revalidatePath(`/tasks/${parent}`);
}
export async function addDependency(f: FormData) {
  const c = await getContext(); const task = String(f.get("task_id")), dep = String(f.get("depends_on_id")); const uuid = /^[0-9a-f-]{36}$/i;
  if (!uuid.test(task) || !uuid.test(dep)) throw new Error("Invalid task");
  const { error } = await c.sb.from("task_dependencies").insert({ task_id: task, depends_on_id: dep, created_by: c.user.id });
  if (error) redirect(`/tasks/${task}?error=${error.message.includes("cycle") ? "cycle" : "failed"}`);
  await log(c, "dependency.added", "task", task); revalidatePath(`/tasks/${task}`);
  redirect(`/tasks/${task}`);
}
 
export async function removeDependency(f: FormData) {
  const c = await getContext(); const task = String(f.get("task_id")), dep = String(f.get("depends_on_id"));
  const { error } = await c.sb.from("task_dependencies").delete().eq("task_id", task).eq("depends_on_id", dep);
  if (error) throw new Error(error.message); await log(c, "dependency.removed", "task", task); revalidatePath(`/tasks/${task}`);
}

// ---- Task editing ----
export async function updateTask(f: FormData) {
  const c = await getContext(); const { taskEditSchema } = await import("@/lib/schemas");
  const p = taskEditSchema.safeParse({ id: f.get("id"), title: f.get("title"), description: f.get("description") ?? "", status: f.get("status"),
    priority: f.get("priority"), due_date: f.get("due_date") ?? "", assignee_id: f.get("assignee_id") ?? "", loaded_at: f.get("loaded_at") });
  if (!p.success) throw new Error("Please check the form: " + p.error.issues[0].message);
  const v = p.data;
  if (v.assignee_id) { // the assignee must belong to this organization (never trust the client)
    const { data: m } = await c.sb.from("organization_members").select("user_id").eq("org_id", c.orgId).eq("user_id", v.assignee_id).maybeSingle();
    if (!m) throw new Error("Assignee is not a member of this organization.");
  }
  // Optimistic concurrency: only update if nobody changed the task since this form was loaded.
  const { data, error } = await c.sb.from("tasks").update({ title: v.title, description: v.description || null, status: v.status, priority: v.priority,
    due_date: v.due_date || null, assignee_id: v.assignee_id || null, updated_at: new Date().toISOString() }).eq("id", v.id).eq("updated_at", v.loaded_at).select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("This task was changed by someone else (or no longer exists). Reload and try again.");
  await log(c, "task.updated", "task", v.id); revalidatePath("/", "layout");
}


export async function signOut() {
  const { sb } = await getContext(); await sb.auth.signOut(); redirect("/login");
}


// ---- Profile ----
export async function updateProfile(f: FormData) {
  const c = await getContext(); const name = String(f.get("full_name") ?? "").trim();
  if (name.length < 1 || name.length > 80) redirect("/profile?error=name");
  const { error } = await c.sb.from("profiles").upsert({ id: c.user.id, full_name: name, updated_at: new Date().toISOString() });
  if (error) redirect("/profile?error=save");
  revalidatePath("/", "layout"); redirect("/profile?saved=profile");
}
export async function changePassword(f: FormData) {
  const c = await getContext(); const pw = String(f.get("password") ?? ""), again = String(f.get("confirm") ?? "");
  if (pw.length < 8) redirect("/profile?error=short");
  if (pw !== again) redirect("/profile?error=mismatch");
  const { error } = await c.sb.auth.updateUser({ password: pw });
  if (error) redirect("/profile?error=password");
  redirect("/profile?saved=password");
}

// ---- Profile photo (Supabase Storage bucket "avatars") ----
// The file's real type is checked from its first bytes, not from its name or the browser-reported type.
const IMG: Record<string, { ext: string; ok: (b: Uint8Array) => boolean }> = {
  "image/png": { ext: "png", ok: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "image/jpeg": { ext: "jpg", ok: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/webp": { ext: "webp", ok: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 } };
const avatarFiles = (uid: string) => ["png", "jpg", "webp"].map(e => `${uid}/avatar.${e}`);
export async function uploadAvatar(f: FormData) {
  const c = await getContext(); const file = f.get("photo");
  if (!(file instanceof File) || file.size === 0) redirect("/profile?error=photo_missing");
  if (file.size > 2 * 1024 * 1024) redirect("/profile?error=photo_size");
  const kind = IMG[file.type]; const bytes = new Uint8Array(await file.arrayBuffer());
  if (!kind || !kind.ok(bytes)) redirect("/profile?error=photo_type");
  await c.sb.storage.from("avatars").remove(avatarFiles(c.user.id)); // drop any older photo (any extension)
  const path = `${c.user.id}/avatar.${kind.ext}`;
  const { error } = await c.sb.storage.from("avatars").upload(path, bytes, { contentType: file.type, cacheControl: "3600" });
  if (error) redirect("/profile?error=photo_upload");
  const { data } = c.sb.storage.from("avatars").getPublicUrl(path);
  const { error: e2 } = await c.sb.from("profiles").upsert({ id: c.user.id, avatar_url: `${data.publicUrl}?v=${Date.now()}`, updated_at: new Date().toISOString() });
  if (e2) redirect("/profile?error=save");
  revalidatePath("/", "layout"); redirect("/profile?saved=photo");
}
export async function removeAvatar() {
  const c = await getContext();
  await c.sb.storage.from("avatars").remove(avatarFiles(c.user.id));
  await c.sb.from("profiles").update({ avatar_url: null, updated_at: new Date().toISOString() }).eq("id", c.user.id);
  revalidatePath("/", "layout"); redirect("/profile?saved=photo_removed");
}