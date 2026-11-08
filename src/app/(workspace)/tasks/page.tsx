import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { getContext } from "@/lib/context";
import { addTask } from "../actions";
import TaskStatus from "@/components/task-status";
import { STATUSES, PRIORITIES } from "@/lib/schemas";
import { PageHeader, StatusBadge, PriorityBadge, EmptyState, label } from "@/components/ui";
const short = (s: string) => (s.includes("@") ? s.split("@")[0] : s.split(" ")[0]);
export default async function Tasks({ searchParams }: { searchParams: Promise<{ view?: string; status?: string; priority?: string; assignee?: string }> }) {
  const q = await searchParams; const board = q.view === "board"; const today = new Date().toISOString().slice(0, 10);
  const c = await getContext(); const { sb, user } = c;
  let tq = sb.from("tasks").select("id, title, status, priority, due_date, assignee_id, projects(name)").order("created_at", { ascending: false }).limit(200);
  if (q.status && (STATUSES as readonly string[]).includes(q.status)) tq = tq.eq("status", q.status as any);
  if (q.priority && (PRIORITIES as readonly string[]).includes(q.priority)) tq = tq.eq("priority", q.priority as any);
  if (q.assignee === "me") tq = tq.eq("assignee_id", user.id);
  else if (q.assignee === "none") tq = tq.is("assignee_id", null);
  else if (q.assignee && /^[0-9a-f-]{36}$/i.test(q.assignee)) tq = tq.eq("assignee_id", q.assignee);
  const [{ data: tasks }, { data: projects }, { data: members }] = await Promise.all([tq, sb.from("projects").select("id, name"), sb.rpc("list_members", { o: c.orgId })]);
  const people = ((members as any[]) ?? []) as { user_id: string; email: string; full_name: string | null }[];
  const nm = new Map(people.map(m => [m.user_id, m.full_name || m.email]));
  const due = (t: any) => t.due_date && <span className={t.due_date < today && !["done", "cancelled"].includes(t.status) ? "font-medium text-err" : ""}>Due {t.due_date}</span>;
  const who = (t: any) => (t.assignee_id ? short(nm.get(t.assignee_id) ?? "Former member") : "Unassigned");
  const seg = (on: boolean) => `rounded-md px-3 py-1 text-sm font-medium transition-colors ${on ? "bg-white text-ink shadow-sm" : "text-sub hover:text-ink"}`;
  return (<div><PageHeader title="Tasks" description="Create, filter and update work across your projects.">
      <div className="inline-flex rounded-lg bg-muted p-1"><Link href="/tasks" className={seg(!board)}>List</Link><Link href="/tasks?view=board" className={seg(board)}>Board</Link></div></PageHeader>
    {projects?.length ? <form action={addTask} className="card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_auto_auto_auto]"><input name="title" required maxLength={200} placeholder="What needs to be done?" className="input sm:col-span-2 lg:col-span-1" aria-label="Title" />
      <select name="project_id" className="input" aria-label="Project">{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select name="assignee_id" defaultValue={user.id} className="input" aria-label="Assignee"><option value="">Unassigned</option>{people.map(m => <option key={m.user_id} value={m.user_id}>{m.user_id === user.id ? "Me" : m.full_name || m.email}</option>)}</select>
      <select name="priority" defaultValue="medium" className="input capitalize" aria-label="Priority">{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
      <input name="due_date" type="date" className="input" aria-label="Due date" /><button className="btn"><Plus size={16} />Add</button></form>
      : <div className="mb-4"><EmptyState icon={ListChecks} title="Create a project first" text="Tasks belong to a project. Head to Projects to make one." /></div>}
    {!board && <form method="get" className="mb-4 flex flex-wrap gap-2"><select name="status" defaultValue={q.status ?? ""} aria-label="Filter by status" className="input !w-40 capitalize"><option value="">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
      <select name="priority" defaultValue={q.priority ?? ""} aria-label="Filter by priority" className="input !w-40 capitalize"><option value="">All priorities</option>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
      <select name="assignee" defaultValue={q.assignee ?? ""} aria-label="Filter by assignee" className="input !w-48"><option value="">All assignees</option><option value="me">Assigned to me</option><option value="none">Unassigned</option>
        {people.filter(m => m.user_id !== user.id).map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}</select><button className="btn-ghost">Apply filters</button></form>}
    {board ? <div className="flex gap-4 overflow-x-auto pb-3">{STATUSES.map(s => { const col = tasks?.filter(t => t.status === s) ?? []; return (
      <section key={s} className="w-72 shrink-0 rounded-card border border-line bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between px-1"><StatusBadge s={s} /><span className="text-xs font-medium text-sub">{col.length}</span></div>
        <div className="space-y-2.5">{col.map(t => (<article key={t.id} className="rounded-lg border border-line bg-white p-3 shadow-sm transition-shadow hover:shadow-md"><Link href={`/tasks/${t.id}`} className="text-sm font-medium hover:text-brand">{t.title}</Link>
          <p className="mt-1 text-xs text-sub">{(t.projects as any)?.name} · {who(t)}</p><div className="mt-2 flex items-center justify-between text-xs"><PriorityBadge p={t.priority} /><span className="text-sub">{due(t)}</span></div>
          <div className="mt-2 border-t border-line pt-2"><TaskStatus id={t.id} status={t.status} showBadge={false} /></div></article>))}
          {!col.length && <p className="px-1 py-4 text-center text-xs text-slate-400">No tasks</p>}</div></section>); })}</div>
    : !tasks?.length ? <EmptyState icon={ListChecks} title="No tasks match" text="Add a task above, or clear the filters." />
    : <div className="card divide-y divide-line !p-0">{tasks.map(t => (<div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
        <div className="min-w-0 flex-1"><Link href={`/tasks/${t.id}`} className="font-medium hover:text-brand">{t.title}</Link>
          <p className="mt-0.5 text-xs text-sub">{(t.projects as any)?.name} · {who(t)}{t.due_date && <> · {due(t)}</>}</p></div>
        <PriorityBadge p={t.priority} /><TaskStatus id={t.id} status={t.status} /></div>))}</div>}</div>);
}