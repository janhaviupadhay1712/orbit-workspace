export type RTask = { status: string; assignee_id: string | null; due_date: string | null; updated_at: string };
const OPEN = (s: string) => s !== "done" && s !== "cancelled";
// Rules: overdue = open task with due_date before today. "Completed in range" = tasks currently Done whose
// updated_at is on/after `since` (the schema has no completed_at, so this is an approximation).
export function summarize(tasks: RTask[], today: string, since: string) {
  const byStatus: Record<string, number> = {}; const openByAssignee: Record<string, number> = {}; let overdue = 0, completedInRange = 0, unassigned = 0;
  for (const t of tasks) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    if (OPEN(t.status)) {
      if (t.due_date && t.due_date < today) overdue++;
      if (t.assignee_id) openByAssignee[t.assignee_id] = (openByAssignee[t.assignee_id] ?? 0) + 1; else unassigned++;
    }
    if (t.status === "done" && t.updated_at.slice(0, 10) >= since) completedInRange++;
  }
  return { total: tasks.length, byStatus, overdue, completedInRange, openByAssignee, unassigned };
}
