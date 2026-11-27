import Link from "next/link";
import { BookOpen, FilePlus, Search } from "lucide-react";
import { getContext } from "@/lib/context";
import { PageHeader, EmptyState } from "@/components/ui";
const mark = (s: string) => s.split("**").map((t, i) => (i % 2 ? <mark key={i} className="rounded bg-amber-100 px-0.5">{t}</mark> : t));
export default async function Knowledge({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 200);
  const { sb } = await getContext();
  const [docs, hits] = await Promise.all([
    sb.from("documents").select("id, title, updated_at, projects(name)").order("updated_at", { ascending: false }).limit(100),
    q ? sb.rpc("search_documents", { q, lim: 20 }) : Promise.resolve({ data: null })]);
  const found = (hits.data ?? []) as { id: string; title: string; snippet: string }[];
  return (<div><PageHeader title="Knowledge" description="Team documents. The AI assistant can search and cite them."><Link href="/knowledge/new" className="btn"><FilePlus size={16} />New document</Link></PageHeader>
    <form method="get" className="relative mb-6 max-w-xl"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input name="q" defaultValue={q} placeholder="Search documents…" aria-label="Search documents" className="input !pl-9" /></form>
    {q ? (found.length ? <ul className="card divide-y divide-line !p-0">{found.map(d => (<li key={d.id}><Link href={`/knowledge/${d.id}`} className="block px-4 py-3 hover:bg-slate-50"><p className="font-medium">{d.title}</p><p className="mt-0.5 text-sm text-sub">{mark(d.snippet)}</p></Link></li>))}</ul>
        : <EmptyState icon={Search} title="No documents match" text="Try different keywords, or write a new document." />)
    : !docs.data?.length ? <EmptyState icon={BookOpen} title="No documents yet" text="Write your first document, such as a team handbook or a project brief. Then ask the AI a question about it." />
    : <ul className="card divide-y divide-line !p-0">{docs.data.map(d => (<li key={d.id}><Link href={`/knowledge/${d.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
        <span className="min-w-0"><span className="block truncate font-medium">{d.title}</span><span className="text-xs text-sub">{(d.projects as any)?.name ?? "No project"}</span></span>
        <time className="shrink-0 text-xs text-sub">{new Date(d.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</time></Link></li>))}</ul>}</div>);
}