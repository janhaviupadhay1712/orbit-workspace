import Link from "next/link";
import { notFound } from "next/navigation";
import { getContext } from "@/lib/context";
import { STATUSES, PRIORITIES } from "@/lib/schemas";
import { updateTask, addComment, addSubtask, addDependency, removeDependency, setTaskStatus } from "../../actions";
const isDone = (s: string) => s === "done" || s === "cancelled";
export default async function TaskDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params; const { error: err } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb } = await getContext();
  const { data: t } = await sb.from("tasks").select("id, org_id, title, description, status, priority, due_date, assignee_id, updated_at, parent_id, projects(name)").eq("id", id).maybeSingle();
  if (!t) notFound(); // also returned for other organizations' tasks (RLS)
  const { data: members } = await sb.rpc("list_members", { o: t.org_id });
  const [{ data: comments }, { data: subs }, { data: by }, { data: blocks }, { data: parent }, { data: all }] = await Promise.all([
    sb.from("comments").select("id, body, created_at").eq("task_id", id).order("created_at"),
    sb.from("tasks").select("id, title, status").eq("parent_id", id).order("created_at"),
    sb.from("task_dependencies").select("depends_on_id").eq("task_id", id), sb.from("task_dependencies").select("task_id").eq("depends_on_id", id),
    t.parent_id ? sb.from("tasks").select("id, title").eq("id", t.parent_id).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("tasks").select("id, title, status").neq("id", id).order("created_at", { ascending: false }).limit(200)]);
  const byIds = new Set(by?.map(d => d.depends_on_id)); const blockIds = new Set(blocks?.map(d => d.task_id));
  const get = (i: string) => all?.find(x => x.id === i);
  const blockers = [...byIds].map(get).filter(Boolean) as { id: string; title: string; status: string }[];
  const blocked = blockers.some(b => !isDone(b.status));
  return (<div className="space-y-6 max-w-2xl"><Link href="/tasks" className="text-sm text-brand">← Tasks</Link>    {err && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-err">{err === "cycle" ? "That would create a circular dependency, so it wasn't added." : "Could not add that dependency."}</p>}
    <div className="card space-y-1">{parent && <Link href={`/tasks/${parent.id}`} className="text-xs text-sub">Subtask of {parent.title}</Link>}
      <h1 className="text-xl font-semibold">{t.title} {blocked && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-normal text-warn">Blocked</span>}</h1>
      <p className="text-sm text-sub">{(t.projects as any)?.name} · {t.status.replace("_", " ")} · {t.priority}{t.due_date ? ` · due ${t.due_date}` : ""}</p>
      {t.description && <p className="text-sm pt-2 whitespace-pre-wrap">{t.description}</p>}</div>
    <details className="card"><summary className="cursor-pointer font-medium">Edit task</summary>
      <form action={updateTask} className="mt-3 grid gap-3 sm:grid-cols-2"><input type="hidden" name="id" value={t.id} /><input type="hidden" name="loaded_at" value={t.updated_at} />
        <label className="text-sm sm:col-span-2">Title<input name="title" required maxLength={200} defaultValue={t.title} className="input mt-1" /></label>
        <label className="text-sm sm:col-span-2">Description<textarea name="description" rows={3} maxLength={4000} defaultValue={t.description ?? ""} className="input mt-1" /></label>
        <label className="text-sm">Status<select name="status" defaultValue={t.status} className="input mt-1">{STATUSES.map(x => <option key={x} value={x}>{x.replace("_", " ")}</option>)}</select></label>
        <label className="text-sm">Priority<select name="priority" defaultValue={t.priority} className="input mt-1">{PRIORITIES.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Due date<input name="due_date" type="date" defaultValue={t.due_date ?? ""} className="input mt-1" /></label>
        <label className="text-sm">Assignee<select name="assignee_id" defaultValue={t.assignee_id ?? ""} className="input mt-1"><option value="">Unassigned</option>
          {(members as any[] | null)?.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}</select></label>
        <div className="sm:col-span-2"><button className="btn">Save changes</button></div></form></details>
    {!t.parent_id && <section className="card space-y-2"><h2 className="font-medium">Subtasks</h2>
      {!subs?.length && <p className="text-sm text-sub">No subtasks.</p>}
      {subs?.map(s => <form key={s.id} action={async () => { "use server"; await setTaskStatus(s.id, s.status === "done" ? "todo" : "done"); }} className="flex items-center justify-between text-sm">
        <Link href={`/tasks/${s.id}`} className={s.status === "done" ? "line-through text-sub" : ""}>{s.title}</Link><button className="text-xs text-brand">{s.status === "done" ? "Reopen" : "Mark done"}</button></form>)}
      <form action={addSubtask} className="flex gap-2"><input type="hidden" name="parent_id" value={t.id} /><input name="title" required maxLength={200} placeholder="Add a subtask" className="input" /><button className="btn">Add</button></form></section>}
    <section className="card space-y-2"><h2 className="font-medium">Dependencies</h2>
      <p className="text-xs text-sub">Blocked by (must finish first):</p>
      {!blockers.length && <p className="text-sm text-sub">None.</p>}
      {blockers.map(b => <form key={b.id} action={removeDependency} className="flex items-center justify-between text-sm"><input type="hidden" name="task_id" value={t.id} /><input type="hidden" name="depends_on_id" value={b.id} />
        <Link href={`/tasks/${b.id}`}>{b.title} <span className="text-sub">· {b.status.replace("_", " ")}</span></Link><button className="text-xs text-err">Remove</button></form>)}
      {!!blockIds.size && <p className="text-xs text-sub pt-2">Blocking: {[...blockIds].map(get).filter(Boolean).map(x => x!.title).join(", ")}</p>}
      <form action={addDependency} className="flex gap-2"><input type="hidden" name="task_id" value={t.id} />
        <select name="depends_on_id" required className="input" defaultValue=""><option value="" disabled>Choose a blocking task</option>
          {all?.filter(x => !byIds.has(x.id)).map(x => <option key={x.id} value={x.id}>{x.title}</option>)}</select><button className="btn">Add</button></form>
      <p className="text-xs text-sub">Circular dependencies are rejected.</p></section>
    <section className="card space-y-3"><h2 className="font-medium">Comments</h2>
      {!comments?.length && <p className="text-sm text-sub">No comments yet.</p>}
      {comments?.map(c => <div key={c.id} className="border-b border-line pb-2 last:border-0"><p className="text-sm whitespace-pre-wrap">{c.body}</p>
        <p className="text-xs text-sub">{new Date(c.created_at).toLocaleString()}</p></div>)}
      <form action={addComment} className="flex gap-2"><input type="hidden" name="task_id" value={t.id} />
        <input name="body" required maxLength={4000} placeholder="Write a comment" className="input" /><button className="btn">Post</button></form></section></div>);
}
