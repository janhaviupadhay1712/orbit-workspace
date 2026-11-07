import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STATUSES, PRIORITIES, escapeLike, type Proposal } from "./schemas";

const UUID = /^[0-9a-f-]{36}$/i;
const createArgs = z.object({ summary: z.string().max(300).optional(), tasks: z.array(z.object({ project: z.string().max(120), title: z.string().max(200),
  priority: z.enum(PRIORITIES).optional(), due_date: z.string().date().optional() })).min(1).max(20) });
const updateArgs = z.object({ summary: z.string().max(300).optional(), updates: z.array(z.object({ task: z.string().max(200),
  status: z.enum(STATUSES).optional(), priority: z.enum(PRIORITIES).optional(), due_date: z.string().date().optional() })).min(1).max(20) });

export const proposeToolDefs = [
  { name: "propose_create_tasks", description: "Prepare NEW tasks for the user to approve. Nothing is created until the user approves. 'project' is a project name or id.",
    parameters: { type: "object", properties: { summary: { type: "string" }, tasks: { type: "array", items: { type: "object", properties: {
      project: { type: "string" }, title: { type: "string" }, priority: { type: "string", enum: [...PRIORITIES] }, due_date: { type: "string", description: "YYYY-MM-DD" } }, required: ["project", "title"] } } }, required: ["tasks"] } },
  { name: "propose_update_tasks", description: "Prepare changes to EXISTING tasks (status, priority, due date) for the user to approve. 'task' is a task id or exact title.",
    parameters: { type: "object", properties: { summary: { type: "string" }, updates: { type: "array", items: { type: "object", properties: {
      task: { type: "string" }, status: { type: "string", enum: [...STATUSES] }, priority: { type: "string", enum: [...PRIORITIES] }, due_date: { type: "string", description: "YYYY-MM-DD" } }, required: ["task"] } } }, required: ["updates"] } },
].map(f => ({ type: "function" as const, function: f }));

// Free/small models send null or "" for unused fields and odd enum casing; normalize recursively before validating.
const tidy = (v: any): any => Array.isArray(v) ? v.map(tidy) : v && typeof v === "object"
  ? Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== "" && x !== "null")
      .map(([k, x]) => [k, (k === "status" || k === "priority") && typeof x === "string" ? x.trim().toLowerCase().replace(/[\s-]+/g, "_") : tidy(x)])) : v;

// Builds a preview only. It reads data under the caller's RLS session and never writes.
export async function runPropose(sb: SupabaseClient, name: string, raw: string, props: Proposal[]): Promise<unknown> {
  let json: unknown; try { json = JSON.parse(raw || "{}"); } catch { return { error: "Invalid JSON arguments" }; }
  const fail = (e: z.ZodError) => ({ error: "Invalid arguments: " + e.issues.map(i => `${i.path.join(".") || "args"}: ${i.message}`).join("; ") });
  const done = (p: Omit<Proposal, "id">, n: number) => { props.push({ id: crypto.randomUUID(), ...p });
    return { status: "awaiting_user_approval", items: n, message: "A preview was prepared. The user must approve it. Do not say it was done." }; };

  if (name === "propose_create_tasks") {
    const a = createArgs.safeParse(tidy(json)); if (!a.success) return fail(a.error);
    const { data: projects } = await sb.from("projects").select("id, name").limit(200); const list = (projects ?? []) as { id: string; name: string }[];
    const creates: Proposal["creates"] = [];
    for (const t of a.data.tasks) {
      const key = t.project.trim().toLowerCase();
      const pr = UUID.test(t.project) ? list.find(x => x.id === t.project) : list.find(x => x.name.trim().toLowerCase() === key);
      if (!pr) return { error: `Unknown project "${t.project}". Existing projects: ${list.map(x => x.name).join(", ") || "none"}. Use one of these names.` };
      creates.push({ project_id: pr.id, project_name: pr.name, title: t.title.trim(), priority: t.priority ?? "medium", due_date: t.due_date ?? null });
    }
    return done({ summary: a.data.summary ?? `Create ${creates.length} task(s)`, creates, updates: [] }, creates.length);
  }
  if (name === "propose_update_tasks") {
    const a = updateArgs.safeParse(tidy(json)); if (!a.success) return fail(a.error);
    const updates: Proposal["updates"] = [];
    for (const u of a.data.updates) {
      if (!u.status && !u.priority && !u.due_date) return { error: `No change given for "${u.task}". Provide status, priority or due_date.` };
      const q = sb.from("tasks").select("id, title").limit(2);
      const { data } = await (UUID.test(u.task) ? q.eq("id", u.task) : q.ilike("title", escapeLike(u.task.trim())));
      if (!data?.length) return { error: `Task not found: "${u.task}". Use search_tasks first and copy the exact title or id.` };
      if (data.length > 1) return { error: `More than one task is titled "${u.task}". Use the task id from search_tasks.` };
      updates.push({ task_id: data[0].id, task_title: data[0].title, status: u.status, priority: u.priority, due_date: u.due_date });
    }
    return done({ summary: a.data.summary ?? `Update ${updates.length} task(s)`, creates: [], updates }, updates.length);
  }
  return { error: "Unknown tool" };
}