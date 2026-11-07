import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { getContext } from "@/lib/context";
import { createProject } from "../actions";
import { progress } from "@/lib/schemas";
import { PageHeader, StatusBadge, ProgressBar, EmptyState } from "@/components/ui";
export default async function Projects({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const showArchived = (await searchParams).show === "archived";
  const { sb } = await getContext();
  let pq = sb.from("projects").select("id, name, description, status, target_date, tasks(status)").order("created_at", { ascending: false });
  pq = showArchived ? pq.eq("status", "archived") : pq.neq("status", "archived");
  const { data } = await pq;
  return (<div><PageHeader title="Projects" description="Group related work. Progress is done tasks ÷ non-cancelled tasks.">
      <Link href={showArchived ? "/projects" : "/projects?show=archived"} className="btn-ghost">{showArchived ? "Back to active projects" : "View archived"}</Link></PageHeader>
    {!showArchived && <form action={createProject} className="card mb-6 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"><input name="name" required maxLength={120} placeholder="Project name" className="input" aria-label="Project name" />
      <input name="description" maxLength={2000} placeholder="Short description (optional)" className="input" aria-label="Description" /><button className="btn"><Plus size={16} />Create project</button></form>}
    {!data?.length ? <EmptyState icon={FolderKanban} title={showArchived ? "No archived projects" : "No projects yet"} text={showArchived ? "Projects you archive will appear here." : "Create a project above, or let the AI Command Center draft a plan for you."} />
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map(p => { const st = (p.tasks as any[]).map(t => t.status), pct = progress(st); return (
        <Link key={p.id} href={`/projects/${p.id}`} className="card flex flex-col gap-3 transition-shadow duration-150 hover:shadow-md"><div className="flex items-start justify-between gap-2"><h2 className="font-semibold leading-snug">{p.name}</h2><StatusBadge s={p.status} /></div>
          <p className="line-clamp-2 min-h-10 text-sm text-sub">{p.description || "No description"}</p>
          <div><div className="mb-1.5 flex justify-between text-xs text-sub"><span>{st.length} {st.length === 1 ? "task" : "tasks"}{p.target_date ? ` · due ${p.target_date}` : ""}</span><span className="font-medium text-ink">{pct}%</span></div><ProgressBar pct={pct} /></div></Link>); })}</div>}</div>);
}