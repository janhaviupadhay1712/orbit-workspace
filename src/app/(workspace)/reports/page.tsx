import Link from "next/link";
import { getContext } from "@/lib/context";
import { summarize } from "@/lib/report";
export default async function Reports({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const raw = Number((await searchParams).days); const days = [7, 30, 90].includes(raw) ? raw : 30;
  const today = new Date().toISOString().slice(0, 10); const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const c = await getContext();
  const [{ data: tasks }, { data: projects }, { data: members }] = await Promise.all([
    c.sb.from("tasks").select("status, assignee_id, due_date, updated_at").limit(5000),
    c.sb.from("projects").select("status"), c.sb.rpc("list_members", { o: c.orgId })]);
  const s = summarize((tasks as any[]) ?? [], today, since); const email = new Map(((members as any[]) ?? []).map(m => [m.user_id, m.full_name || m.email]));
  const pc: Record<string, number> = {}; projects?.forEach((p: any) => (pc[p.status] = (pc[p.status] ?? 0) + 1));
  const tab = (d: number) => `rounded-lg px-3 py-1.5 text-sm ${d === days ? "bg-brand text-white" : "bg-white border border-line"}`;
  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Reports</h1>
    <div className="flex gap-2">{[7, 30, 90].map(d => <Link key={d} href={`/reports?days=${d}`} className={tab(d)}>{d}d</Link>)}</div></div>
    <div className="grid gap-4 sm:grid-cols-3">{[["Total tasks", s.total], [`Done in last ${days}d*`, s.completedInRange], ["Overdue (open)", s.overdue]].map(([l, n]) =>
      <div key={l as string} className="card"><p className="text-sm text-sub">{l}</p><p className="text-2xl font-semibold">{n}</p></div>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="card"><h2 className="font-medium mb-2">Tasks by status</h2>{Object.entries(s.byStatus).map(([k, v]) => <p key={k} className="flex justify-between text-sm"><span className="capitalize">{k.replace("_", " ")}</span>{v}</p>)}{!s.total && <p className="text-sm text-sub">No tasks yet.</p>}</section>
      <section className="card"><h2 className="font-medium mb-2">Projects by status</h2>{Object.entries(pc).map(([k, v]) => <p key={k} className="flex justify-between text-sm"><span className="capitalize">{k.replace("_", " ")}</span>{v}</p>)}{!projects?.length && <p className="text-sm text-sub">No projects yet.</p>}</section></div>
    <section className="card"><h2 className="font-medium mb-2">Open tasks by assignee</h2>
      {Object.entries(s.openByAssignee).sort((a, b) => b[1] - a[1]).map(([id, n]) => <p key={id} className="flex justify-between text-sm"><span>{email.get(id) ?? "Former member"}</span>{n}</p>)}
      <p className="flex justify-between text-sm text-sub"><span>Unassigned</span>{s.unassigned}</p></section>
    <p className="text-xs text-sub">Rules: overdue = open task with a due date before today. *Done in range = tasks currently Done and last updated in the range (no completion timestamp is stored, so this is approximate). Reports show counts of work, not individual performance scoring.</p></div>);
}
