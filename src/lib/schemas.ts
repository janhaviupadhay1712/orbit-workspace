import { z } from "zod";
export const STATUSES = ["backlog","todo","in_progress","in_review","done","cancelled"] as const;
export const PRIORITIES = ["low","medium","high","urgent"] as const;
export const projectSchema = z.object({ name: z.string().trim().min(1).max(120), description: z.string().max(2000).optional() });
export const taskSchema = z.object({ project_id: z.string().uuid(), title: z.string().trim().min(1).max(200),
  priority: z.enum(PRIORITIES).default("medium"), due_date: z.string().date().optional().or(z.literal("")) });
export const planSchema = z.object({ name: z.string().min(1).max(120), description: z.string().max(2000).default(""),
  tasks: z.array(z.object({ title: z.string().min(1).max(200), description: z.string().max(1000).default(""),
    priority: z.enum(PRIORITIES).default("medium") })).min(1).max(40) });
export type Plan = z.infer<typeof planSchema>;
// Progress rule: done tasks / non-cancelled tasks, rounded to a whole percent.
export const progress = (s: string[]) => { const t = s.filter(x => x !== "cancelled"); return t.length ? Math.round(100 * t.filter(x => x === "done").length / t.length) : 0; };
// Escape LIKE wildcards so user input is matched literally.
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, c => "\\" + c);
export const commentSchema = z.object({ task_id: z.string().uuid(), body: z.string().trim().min(1).max(4000) });
// Calendar helper: validated YYYY-MM, defaulting to the current month.
export const monthParam = (v?: string) => (v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : new Date().toISOString().slice(0, 7));
export const inviteSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254), role: z.enum(["admin", "member"]) });
export const roleChangeSchema = z.object({ user_id: z.string().uuid(), role: z.enum(["admin", "member"]) });
export const taskEditSchema = z.object({ id: z.string().uuid(), title: z.string().trim().min(1).max(200), description: z.string().max(4000).default(""),
  status: z.enum(STATUSES), priority: z.enum(PRIORITIES), due_date: z.string().date().or(z.literal("")),
  assignee_id: z.string().uuid().or(z.literal("")), loaded_at: z.string().min(1) });

  // An AI-prepared change set. Nothing is written until the user approves it; the server re-validates it first.
export const proposalSchema = z.object({
  id: z.string().uuid(), summary: z.string().max(300),
  creates: z.array(z.object({ project_id: z.string().uuid(), project_name: z.string().max(120), title: z.string().trim().min(1).max(200),
    priority: z.enum(PRIORITIES).default("medium"), due_date: z.string().date().nullable().default(null) })).max(20).default([]),
  updates: z.array(z.object({ task_id: z.string().uuid(), task_title: z.string().max(200), status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(), due_date: z.string().date().nullable().optional() })).max(20).default([]) });
export type Proposal = z.infer<typeof proposalSchema>;

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "archived"] as const;
export const projectEditSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(1).max(120), description: z.string().max(2000).default(""),
  status: z.enum(PROJECT_STATUSES), start_date: z.string().date().or(z.literal("")), target_date: z.string().date().or(z.literal("")) });