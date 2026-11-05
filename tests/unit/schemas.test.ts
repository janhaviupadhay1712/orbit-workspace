import { describe, it, expect } from "vitest";
import { progress, escapeLike, planSchema, taskSchema } from "../../src/lib/schemas";
describe("progress", () => {
  it("is 0 with no tasks", () => expect(progress([])).toBe(0));
  it("ignores cancelled tasks", () => expect(progress(["done", "cancelled", "todo", "todo"])).toBe(33));
  it("is 100 when all active tasks are done", () => expect(progress(["done", "cancelled"])).toBe(100));
});
describe("escapeLike", () => it("escapes wildcards", () => expect(escapeLike("50%_x")).toBe("50\\%\\_x")));
describe("planSchema", () => {
  it("rejects empty task lists", () => expect(planSchema.safeParse({ name: "A", tasks: [] }).success).toBe(false));
  it("rejects unknown priorities", () => expect(planSchema.safeParse({ name: "A", tasks: [{ title: "x", priority: "asap" }] }).success).toBe(false));
  it("accepts a valid plan", () => expect(planSchema.safeParse({ name: "A", tasks: [{ title: "x" }] }).success).toBe(true));
});
describe("taskSchema", () => it("requires a uuid project", () => expect(taskSchema.safeParse({ project_id: "nope", title: "t" }).success).toBe(false)));
import { monthParam, commentSchema } from "../../src/lib/schemas";
describe("monthParam", () => {
  it("accepts YYYY-MM", () => expect(monthParam("2026-03")).toBe("2026-03"));
  it("falls back for invalid input", () => expect(monthParam("2026-13")).toMatch(/^\d{4}-\d{2}$/));
});
describe("commentSchema", () => it("rejects blank bodies", () => expect(commentSchema.safeParse({ task_id: "00000000-0000-4000-8000-000000000000", body: "  " }).success).toBe(false)));
import { inviteSchema, roleChangeSchema } from "../../src/lib/schemas";
describe("invitations", () => {
  it("normalizes email", () => expect(inviteSchema.parse({ email: " A@B.com ", role: "member" }).email).toBe("a@b.com"));
  it("cannot invite as owner", () => expect(inviteSchema.safeParse({ email: "a@b.com", role: "owner" }).success).toBe(false));
  it("cannot promote to owner", () => expect(roleChangeSchema.safeParse({ user_id: "00000000-0000-4000-8000-000000000000", role: "owner" }).success).toBe(false));
});
import { rateLimit } from "../../src/lib/ratelimit";
describe("rateLimit", () => {
  it("blocks after max and recovers after the window", () => {
    expect([1, 2, 3].map(i => rateLimit("k", 2, 1000, i))).toEqual([true, true, false]);
    expect(rateLimit("k", 2, 1000, 2000)).toBe(true);
  });
});
import { summarize } from "../../src/lib/report";
describe("summarize", () => {
  const t = (status: string, due: string | null, a: string | null = null, u = "2026-01-10T00:00:00Z") => ({ status, assignee_id: a, due_date: due, updated_at: u });
  it("counts overdue only for open tasks", () => expect(summarize([t("todo", "2026-01-01"), t("done", "2026-01-01"), t("cancelled", "2026-01-01"), t("todo", "2026-02-01")], "2026-01-15", "2026-01-01").overdue).toBe(1));
  it("counts done in range and workload", () => {
    const r = summarize([t("done", null, "u1", "2026-01-12T00:00:00Z"), t("done", null, "u1", "2025-12-01T00:00:00Z"), t("todo", null, "u1"), t("todo", null)], "2026-01-15", "2026-01-01");
    expect([r.completedInRange, r.openByAssignee.u1, r.unassigned]).toEqual([1, 1, 1]);
  });
});
import { taskEditSchema } from "../../src/lib/schemas";
describe("taskEditSchema", () => {
  const ok = { id: "00000000-0000-4000-8000-000000000000", title: "T", description: "", status: "todo", priority: "high", due_date: "", assignee_id: "", loaded_at: "x" };
  it("accepts empty due date and assignee", () => expect(taskEditSchema.safeParse(ok).success).toBe(true));
  it("rejects bad status, date and assignee", () => {
    expect(taskEditSchema.safeParse({ ...ok, status: "nope" }).success).toBe(false);
    expect(taskEditSchema.safeParse({ ...ok, due_date: "13/45/2026" }).success).toBe(false);
    expect(taskEditSchema.safeParse({ ...ok, assignee_id: "not-a-uuid" }).success).toBe(false);
  });
});
