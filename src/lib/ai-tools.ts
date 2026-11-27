import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STATUSES, PRIORITIES, escapeLike, progress } from "./schemas";

export type Rec = { type: "task" | "project" | "document"; id: string; label: string; href: string };
const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "archived"] as const;
const args = {
  search_tasks: z.object({ query: z.string().max(100).optional(), status: z.enum(STATUSES).optional(), priority: z.enum(PRIORITIES).optional(),
    overdue_only: z.boolean().optional(), limit: z.number().int().min(1).max(25).default(15) }),
  list_projects: z.object({ status: z.enum(PROJECT_STATUSES).optional() }),
  get_project_status: z.object({ project_id: z.string().uuid() }),
};
export const toolDefs = [
  { name: "search_tasks", description: "Search tasks in the user's workspace. Use overdue_only for overdue tasks.", parameters: { type: "object", properties: {
      query: { type: "string" }, status: { type: "string", enum: [...STATUSES] }, priority: { type: "string", enum: [...PRIORITIES] },
      overdue_only: { type: "boolean" }, limit: { type: "integer", minimum: 1, maximum: 25 } } } },
  { name: "list_projects", description: "List projects, optionally by status.", parameters: { type: "object", properties: { status: { type: "string", enum: [...PROJECT_STATUSES] } } } },
  { name: "get_project_status", description: "Task counts, progress and overdue count for one project.", parameters: { type: "object", properties: { project_id: { type: "string" } }, required: ["project_id"] } },
].map(f => ({ type: "function" as const, function: f }));

// Models (especially free ones) often send null/"" for unused options, "true" as a string, or "In Progress" for enums.
// Normalize that before validating, so a harmless quirk doesn't make the model retry in a loop.
const clean = (v: unknown): unknown => {
  if (!v || typeof v !== "object" || Array.isArray(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
    if (x === null || x === "" || x === "null") continue;
    if (x === "true" || x === "false") out[k] = x === "true";
    else if (k === "limit" && typeof x === "string" && /^\d+$/.test(x)) out[k] = Number(x);
    else if ((k === "status" || k === "priority") && typeof x === "string") out[k] = x.trim().toLowerCase().replace(/[\s-]+/g, "_");
    else out[k] = x;
  }
  return out;
};
// Trusted executors: run under the caller's own RLS session, so they can only ever see that user's organization.
export async function runTool(sb: SupabaseClient, name: string, raw: string, recs: Rec[]): Promise<unknown> {
  const schema = (args as Record<string, z.ZodTypeAny>)[name];
  if (!schema) return { error: "Unknown tool" };
  let json: unknown; try { json = JSON.parse(raw || "{}"); } catch { return { error: "Invalid JSON arguments" }; }
  const p = schema.safeParse(clean(json));
  if (!p.success) return { error: "Invalid arguments: " + p.error.issues.map(i => `${i.path.join(".") || "args"}: ${i.message}`).join("; ") + ". project_id must be a UUID taken from list_projects or search results." };
  const today = new Date().toISOString().slice(0, 10);
  if (name === "search_tasks") {
    const a = p.data as z.infer<typeof args.search_tasks>;
    let q = sb.from("tasks").select("id, title, status, priority, due_date, projects(name)").order("due_date", { ascending: true, nullsFirst: false }).limit(a.limit);
    if (a.query) q = q.ilike("title", `%${escapeLike(a.query)}%`);
    if (a.status) q = q.eq("status", a.status); if (a.priority) q = q.eq("priority", a.priority);
    if (a.overdue_only) q = q.lt("due_date", today).not("status", "in", "(done,cancelled)");
    const { data, error } = await q; if (error) return { error: "Query failed" };
    data!.forEach((t: any) => recs.push({ type: "task", id: t.id, label: t.title, href: `/tasks/${t.id}` }));
    return { today, count: data!.length, tasks: data!.map((t: any) => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, due_date: t.due_date, project: t.projects?.name })) };
  }
  if (name === "list_projects") {
    const a = p.data as z.infer<typeof args.list_projects>;
    let q = sb.from("projects").select("id, name, status, target_date").limit(50); if (a.status) q = q.eq("status", a.status);
    const { data, error } = await q; if (error) return { error: "Query failed" };
    data!.forEach((x: any) => recs.push({ type: "project", id: x.id, label: x.name, href: "/projects" }));
    return { count: data!.length, projects: data };
  }
  const a = p.data as z.infer<typeof args.get_project_status>;
  const { data: pr } = await sb.from("projects").select("id, name, status, target_date, tasks(status, due_date)").eq("id", a.project_id).maybeSingle();
  if (!pr) return { error: "Project not found or not accessible" };
  const ts = (pr.tasks as any[]) ?? []; recs.push({ type: "project", id: pr.id, label: pr.name, href: "/projects" });
  const by: Record<string, number> = {}; ts.forEach(t => (by[t.status] = (by[t.status] ?? 0) + 1));
  return { name: pr.name, status: pr.status, target_date: pr.target_date, task_counts: by, progress_percent: progress(ts.map(t => t.status)),
    overdue: ts.filter(t => t.due_date && t.due_date < today && !["done", "cancelled"].includes(t.status)).length };
}