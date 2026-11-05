import Link from "next/link";
import { ListChecks, Plus } from "lucide-react";
import { getContext } from "@/lib/context";
import { createTask, setTaskStatus } from "../actions";
import { STATUSES, PRIORITIES } from "@/lib/schemas";
import { PageHeader, StatusBadge, PriorityBadge, EmptyState, label } from "@/components/ui";
export default async function Tasks({ searchParams }: { searchParams: Promise<{ view?: string; status?: string; priority?: string }> }) {
  const q = await searchParams; const board = q.view === "board"; const today = new Date().toISOString().slice(0, 10);
  const { sb } = await getContext();
  let tq = sb.from("tasks").select("id, title, status, priority, due_date, projects(name)").order("created_at", { ascending: false }).limit(200);
  if (q.status && (STATUSES as readonly string[]).includes(q.status)) tq = tq.eq("status", q.status as any);
  if (q.priority && (PRIORITIES as readonly string[]).includes(q.priority)) tq = tq.eq("priority", q.priority as any);
  const [{ data: tasks }, { data: projects }] = await Promise.all([tq, sb.from("projects").select("id, name")]);
  const move = (id: string) => async (f: FormData) => { "use server"; await setTaskStatus(id, String(f.get("status"))); };
  const StatusForm = ({ id, status }: { id: string; status: string }) => (
    <form action={move(id)} className="flex items-center gap-1.5"><select name="status" defaultValue={status} aria-label="Status" className="input !w-32 !py-1 text-xs">{STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
      <button className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-indigo-50">Save</button></form>);
  const due = (t: any) => t.due_date && <span className={t.due_date < today && !["done", "cancelled"].includes(t.status) ? "font-medium text-err" : ""}>Due {t.due_date}</span>;
  const seg = (on: boolean) => `rounded-md px-3 py-1 text-sm font-medium transition-colors ${on ? "bg-white text-ink shadow-sm" : "text-sub hover:text-ink"}`;
  return (<div><PageHeader title="My Tasks" description="Create, filter and update work across your projects.">
      <div className="inline-flex rounded-lg bg-muted p-1"><Link href="/tasks" className={seg(!board)}>List</Link><Link href="/tasks?view=board" className={seg(board)}>Board</Link></div></PageHeader>
    {projects?.length ? <form action={createTask} className="card mb-4 grid gap-3 sm:grid-cols-[1.5fr_1fr_auto_auto_auto]"><input name="title" required maxLength={200} placeholder="What needs to be done?" className="input" aria-label="Title" />
      <select name="project_id" className="input" aria-label="Project">{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select name="priority" defaultValue="medium" className="input capitalize" aria-label="Priority">{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select>
      <input name="due_date" type="date" className="input" aria-label="Due date" /><button className="btn"><Plus size={16} />Add</button></form>
      : <div className="mb-4"><EmptyState icon={ListChecks} title="Create a project first" text="Tasks belong to a project. Head to Projects to make one." /></div>}
    {!board && <form method="get" className="mb-4 flex flex-wrap gap-2"><select name="status" defaultValue={q.status ?? ""} className="input !w-44 capitalize"><option value="">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
      <select name="priority" defaultValue={q.priority ?? ""} className="input !w-44 capitalize"><option value="">All priorities</option>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select><button className="btn-ghost">Apply filters</button></form>}
    {board ? <div className="flex gap-4 overflow-x-auto pb-3">{STATUSES.map(s => { const col = tasks?.filter(t => t.status === s) ?? []; return (
      <section key={s} className="w-72 shrink-0 rounded-card border border-line bg-slate-50 p-3"><div className="mb-3 flex items-center justify-between px-1"><StatusBadge s={s} /><span className="text-xs font-medium text-sub">{col.length}</span></div>
        <div className="space-y-2.5">{col.map(t => (<article key={t.id} className="rounded-lg border border-line bg-white p-3 shadow-sm transition-shadow hover:shadow-md"><Link href={`/tasks/${t.id}`} className="text-sm font-medium hover:text-brand">{t.title}</Link>
          <p className="mt-1 text-xs text-sub">{(t.projects as any)?.name}</p><div className="mt-2 flex items-center justify-between text-xs"><PriorityBadge p={t.priority} /><span className="text-sub">{due(t)}</span></div>
          <div className="mt-2 border-t border-line pt-2"><StatusForm id={t.id} status={t.status} /></div></article>))}
          {!col.length && <p className="px-1 py-4 text-center text-xs text-slate-400">No tasks</p>}</div></section>); })}</div>
    : !tasks?.length ? <EmptyState icon={ListChecks} title="No tasks match" text="Add a task above, or clear the filters." />
    : <div className="card divide-y divide-line !p-0">{tasks.map(t => (<div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50">
        <div className="min-w-0 flex-1"><Link href={`/tasks/${t.id}`} className="font-medium hover:text-brand">{t.title}</Link>
          <p className="mt-0.5 text-xs text-sub">{(t.projects as any)?.name}{t.due_date && <> · {due(t)}</>}</p></div>
        <PriorityBadge p={t.priority} /><StatusBadge s={t.status} /><StatusForm id={t.id} status={t.status} /></div>))}</div>}</div>);
}