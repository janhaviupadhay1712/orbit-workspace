import Link from "next/link";
import { getContext } from "@/lib/context";
import { escapeLike } from "@/lib/schemas";
export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const term = ((await searchParams).q ?? "").trim().slice(0, 100);
  const { sb } = await getContext(); // RLS limits results to the user's organization
  const pat = `%${escapeLike(term)}%`;
  const [p, t] = term ? await Promise.all([
    sb.from("projects").select("id, name").ilike("name", pat).limit(10),
    sb.from("tasks").select("id, title, status").ilike("title", pat).limit(20)]) : [null, null];
  return (<div className="space-y-6"><h1 className="text-2xl font-semibold">Search</h1>
    <form method="get" className="flex gap-2"><input name="q" defaultValue={term} placeholder="Search projects and tasks" className="input" autoFocus /><button className="btn">Search</button></form>
    {term && !p?.data?.length && !t?.data?.length && <p className="text-sm text-sub">No results for “{term}”.</p>}
    {!!p?.data?.length && <section className="card"><h2 className="font-medium mb-2">Projects</h2>{p.data.map(x => <Link key={x.id} href="/projects" className="block py-1 text-sm text-brand">{x.name}</Link>)}</section>}
    {!!t?.data?.length && <section className="card"><h2 className="font-medium mb-2">Tasks</h2>{t.data.map(x => <Link key={x.id} href="/tasks" className="block py-1 text-sm"><span className="text-brand">{x.title}</span> <span className="text-sub">· {x.status.replace("_", " ")}</span></Link>)}</section>}</div>);
}
