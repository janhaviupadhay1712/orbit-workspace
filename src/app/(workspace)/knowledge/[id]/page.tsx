import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getContext } from "@/lib/context";
import Markdown from "@/components/markdown";
import { updateDocument, deleteDocument } from "../../actions";
const ERR: Record<string, string> = { invalid: "Please check the form: a title is required.", save: "Could not save. Only the author or an admin can edit this document.", delete: "Could not delete. Only the author or an admin can delete this document." };
export default async function DocumentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const { id } = await params; const q = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const c = await getContext();
  const { data: d } = await c.sb.from("documents").select("id, org_id, title, body, project_id, created_by, updated_at, projects(name)").eq("id", id).maybeSingle();
  if (!d) notFound(); // also returned for other organizations' documents (RLS)
  const [{ data: members }, { data: projects }] = await Promise.all([c.sb.rpc("list_members", { o: d.org_id }), c.sb.from("projects").select("id, name").neq("status", "archived").order("name")]);
  const author = ((members as any[]) ?? []).find(m => m.user_id === d.created_by);
  const canEdit = c.role === "owner" || c.role === "admin" || d.created_by === c.user.id;
  return (<div className="mx-auto max-w-3xl space-y-6"><Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-sub hover:text-ink"><ArrowLeft size={15} />Knowledge</Link>
    {q.saved && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-ok">Document saved.</p>}
    {q.error && ERR[q.error] && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-err">{ERR[q.error]}</p>}
    <article className="card !p-6 sm:!p-8"><h1 className="text-2xl font-semibold tracking-tight">{d.title}</h1>
      <p className="mt-1 text-xs text-sub">{author ? author.full_name || author.email : "Unknown author"} · updated {new Date(d.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        {(d.projects as any)?.name && <> · <Link href={`/projects/${d.project_id}`} className="text-brand hover:underline">{(d.projects as any).name}</Link></>}</p>
      <div className="mt-6">{d.body.trim() ? <Markdown text={d.body} /> : <p className="text-sm text-sub">This document is empty.</p>}</div></article>
    {canEdit && <details className="card"><summary className="cursor-pointer font-medium">Edit document</summary>
      <form action={updateDocument} className="mt-4 space-y-4"><input type="hidden" name="id" value={d.id} />
        <label className="block text-sm font-medium">Title<input name="title" required maxLength={200} defaultValue={d.title} className="input mt-1.5 font-normal" /></label>
        <label className="block text-sm font-medium">Project<select name="project_id" defaultValue={d.project_id ?? ""} className="input mt-1.5 font-normal"><option value="">None</option>{projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label className="block text-sm font-medium">Content<textarea name="body" rows={16} maxLength={50000} defaultValue={d.body} className="input mt-1.5 font-mono text-[13px] font-normal leading-6" /></label>
        <button className="btn">Save changes</button></form></details>}
    {canEdit && <details className="card border-red-200"><summary className="cursor-pointer text-sm font-medium text-err">Delete document</summary>
      <p className="mt-2 text-sm text-sub">This permanently deletes the document. It can’t be undone.</p>
      <form action={deleteDocument} className="mt-3"><input type="hidden" name="id" value={d.id} /><button className="rounded-lg bg-err px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700">Yes, delete this document</button></form></details>}</div>);
}