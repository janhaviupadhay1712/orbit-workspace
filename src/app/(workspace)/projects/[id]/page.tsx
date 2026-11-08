import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListChecks, Plus } from "lucide-react";
import { getContext } from "@/lib/context";
import { progress, PROJECT_STATUSES, PRIORITIES } from "@/lib/schemas";
import { StatusBadge, PriorityBadge, ProgressBar, EmptyState, label } from "@/components/ui";
import TaskStatus from "@/components/task-status";
import { updateProject, deleteProject, addTask } from "../../actions";
const ERR: Record<string, string> = { invalid: "Please check the form (name is required).", dates: "The target date can’t be before the start date.", save: "Could not save the project.",
  forbidden: "Only owners and admins can delete projects.", confirm: "The name you typed didn’t match, so nothing was deleted.", delete: "Could not delete the project." };
export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params; const q = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getContext(); const today = new Date().toISOString().slice(0, 10);
  const { data: p } = await c.sb.from("projects").select("id, name, description, status, start_date, target_date, owner_id").eq("id", id).maybeSingle();
  if (!p) notFound(); // also returned for other organizations' projects (RLS)
  const [{ data: tasks }, { data: members }] = await Promise.all([
    c.sb.from("tasks").select("id, title, status, priority, due_date").eq("project_id", id).is("parent_id", null).order("created_at", { ascending: false }),
    c.sb.rpc("list_members", { o: c.orgId })]);
  const all = (tasks as any[]) ?? []; const pct = progress(all.map(t => t.status));
  const open = all.filter(t => !["done", "cancelled"].includes(t.status)); const overdue = open.filter(t => t.due_date && t.due_date < today).length;
  const owner = ((members as any[]) ?? []).find(m => m.user_id === p.owner_id); const canDelete = c.role === "owner" || c.role === "admin";
  const stat = (l: string, v: string | number) => <div className="rounded-lg bg-muted/60 px-3 py-2"><p className="text-xs text-sub">{l}</p><p className="font-semibold">{v}</p></div>;
  return (<div className="space-y-6"><Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-sub hover:text-ink"><ArrowLeft size={15} />All projects</Link>
    {q.saved && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-ok">Project saved.</p>}
    {q.error && ERR[q.error] && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-err">{ERR[q.error]}</p>}
    <section className="card space-y-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">{p.name}</h1>
        <p className="mt-1 max-w-2xl text-sm text-sub">{p.description || "No description yet."}</p></div><StatusBadge s={p.status} /></div>
      <div><div className="mb-1.5 flex justify-between text-xs text-sub"><span>Progress = done ÷ non-cancelled tasks</span><span className="font-medium text-ink">{pct}%</span></div><ProgressBar pct={pct} /></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{stat("Tasks", all.length)}{stat("Open", open.length)}{stat("Overdue", overdue)}{stat("Start", p.start_date ?? "—")}{stat("Target", p.target_date ?? "—")}</div>
      <p className="text-xs text-sub">Owner: {owner ? owner.full_name || owner.email : "—"}</p></section>
    <details className="card"><summary className="cursor-pointer font-medium">Edit project</summary>
      <form action={updateProject} className="mt-4 grid gap-3 sm:grid-cols-2"><input type="hidden" name="id" value={p.id} />
        <label className="text-sm sm:col-span-2">Name<input name="name" required maxLength={120} defaultValue={p.name} className="input mt-1" /></label>
        <label className="text-sm sm:col-span-2">Description<textarea name="description" rows={3} maxLength={2000} defaultValue={p.description ?? ""} className="input mt-1" /></label>
        <label className="text-sm">Status<select name="status" defaultValue={p.status} className="input mt-1 capitalize">{PROJECT_STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-sm">Start<input name="start_date" type="date" defaultValue={p.start_date ?? ""} className="input mt-1" /></label>
          <label className="text-sm">Target<input name="target_date" type="date" defaultValue={p.target_date ?? ""} className="input mt-1" /></label></div>
        <div className="sm:col-span-2"><button className="btn">Save changes</button></div></form></details>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Tasks</h2></div>
      <form action={addTask} className="card mb-4 grid gap-3 sm:grid-cols-[1.5fr_1fr_auto_auto_auto]"><input type="hidden" name="project_id" value={p.id} />
        <input name="title" required maxLength={200} placeholder="Add a task to this project" aria-label="Title" className="input" />
        <select name="assignee_id" defaultValue={c.user.id} aria-label="Assignee" className="input"><option value="">Unassigned</option>{((members as any[]) ?? []).map(m => <option key={m.user_id} value={m.user_id}>{m.user_id === c.user.id ? "Me" : m.full_name || m.email}</option>)}</select>
        <select name="priority" defaultValue="medium" aria-label="Priority" className="input capitalize">{PRIORITIES.map(x => <option key={x}>{x}</option>)}</select>
        <input name="due_date" type="date" aria-label="Due date" className="input" /><button className="btn"><Plus size={16} />Add</button></form>
      {!all.length ? <EmptyState icon={ListChecks} title="No tasks yet" text="Add the first task above, or ask the AI Command Center to plan this project." />
        : <div className="card divide-y divide-line !p-0">{all.map(t => (<div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0 flex-1"><Link href={`/tasks/${t.id}`} className="font-medium hover:text-brand">{t.title}</Link>
              {t.due_date && <p className={`mt-0.5 text-xs ${t.due_date < today && !["done", "cancelled"].includes(t.status) ? "font-medium text-err" : "text-sub"}`}>Due {t.due_date}</p>}</div>
            <PriorityBadge p={t.priority} /><TaskStatus id={t.id} status={t.status} /></div>))}</div>}</section>
    {canDelete && <section className="card border-red-200"><h2 className="font-semibold text-err">Delete project</h2>
      <p className="mt-1 text-sm text-sub">This permanently deletes the project and all of its tasks. To confirm, type the project name: <b>{p.name}</b></p>
      <form action={deleteProject} className="mt-3 flex flex-wrap gap-2"><input type="hidden" name="id" value={p.id} /><input name="confirm" required placeholder="Project name" aria-label="Confirm project name" className="input !w-64" />
        <button className="rounded-lg bg-err px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700">Delete permanently</button></form></section>}</div>);
}