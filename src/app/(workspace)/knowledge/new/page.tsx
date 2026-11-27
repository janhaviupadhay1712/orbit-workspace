import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getContext } from "@/lib/context";
import { createDocument } from "../../actions";
export default async function NewDocument({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams; const { sb } = await getContext();
  const { data: projects } = await sb.from("projects").select("id, name").neq("status", "archived").order("name");
  return (<div className="mx-auto max-w-3xl space-y-4"><Link href="/knowledge" className="inline-flex items-center gap-1.5 text-sm text-sub hover:text-ink"><ArrowLeft size={15} />Knowledge</Link>
    <h1 className="text-2xl font-semibold tracking-tight">New document</h1>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-err">{error === "invalid" ? "Please add a title." : "Could not save the document."}</p>}
    <form action={createDocument} className="card space-y-4">
      <label className="block text-sm font-medium">Title<input name="title" required maxLength={200} placeholder="For example: Team handbook" className="input mt-1.5 font-normal" /></label>
      <label className="block text-sm font-medium">Project (optional)<select name="project_id" defaultValue="" className="input mt-1.5 font-normal"><option value="">None</option>{projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="block text-sm font-medium">Content<textarea name="body" rows={16} maxLength={50000} placeholder="Write here. You can use **bold**, lists with - or 1., headings with #, and `code`." className="input mt-1.5 font-mono text-[13px] font-normal leading-6" /></label>
      <button className="btn">Create document</button></form></div>);
}