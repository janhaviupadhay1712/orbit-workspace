import Link from "next/link";
import { ListChecks, AlertTriangle, FolderKanban, FolderPlus } from "lucide-react";
import { getContext } from "@/lib/context";
import { PageHeader, EmptyState, humanize } from "@/components/ui";
import GetStarted from "@/components/get-started";
import { SAMPLE_NAME } from "@/lib/sample";
const MSG: Record<string, string> = { failed: "Couldn’t load or remove the sample project. Please try again.", forbidden: "Only owners and admins can do that." };
export default async function Home({ searchParams }: { searchParams: Promise<{ sample?: string }> }) {
  const q = await searchParams; const { sb, user, displayName, role } = await getContext();
  const now = new Date(), today = now.toISOString().slice(0, 10), h = now.getHours();
  const greet = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const name = displayName.split(" ")[0];
  const openTasks = () => sb.from("tasks").select("id", { count: "exact", head: true }).not("status", "in", "(done,cancelled)");
  const count = (t: string) => sb.from(t).select("*", { count: "exact", head: true });
  const [mine, overdue, projects, acts, pAll, tAll, aiUse, members, invites, sample] = await Promise.all([
    openTasks().eq("assignee_id", user.id), openTasks().lt("due_date", today),
    sb.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("activities").select("id, action, created_at").order("created_at", { ascending: false }).limit(8),
    count("projects"), count("tasks"), sb.from("activities").select("id", { count: "exact", head: true }).in("action", ["ai.proposal_applied", "ai.plan_approved"]),
    count("organization_members"), count("invitations"), sb.from("projects").select("id").eq("name", SAMPLE_NAME).limit(1)]);
  const steps = [{ label: "Create a project", href: "/projects", done: (pAll.count ?? 0) > 0 }, { label: "Add a task", href: "/tasks", done: (tAll.count ?? 0) > 0 },
    { label: "Ask the AI to create tasks, then approve", href: "/ai", done: (aiUse.count ?? 0) > 0 }, { label: "Invite a teammate", href: "/settings", done: (members.count ?? 0) > 1 || (invites.count ?? 0) > 0 }];
  const stats = [{ l: "My open tasks", n: mine.count, Icon: ListChecks, c: "bg-indigo-50 text-brand", href: "/tasks" },
    { l: "Overdue tasks", n: overdue.count, Icon: AlertTriangle, c: "bg-red-50 text-err", href: "/tasks" },
    { l: "Active projects", n: projects.count, Icon: FolderKanban, c: "bg-teal-50 text-teal-600", href: "/projects" }];
  return (<div><PageHeader title={`${greet}, ${name}`} description={now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}>
      <Link href="/projects" className="btn"><FolderPlus size={16} />New project</Link></PageHeader>
    {q.sample && MSG[q.sample] && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-err">{MSG[q.sample]}</p>}
    {!steps.every(s => s.done) && <GetStarted steps={steps} canManage={role === "owner" || role === "admin"} hasSample={!!sample.data?.length} />}
    <div className="grid gap-4 sm:grid-cols-3">{stats.map(({ l, n, Icon, c, href }) => (
      <Link key={l} href={href} className="card flex items-center gap-4 transition-shadow duration-150 hover:shadow-md"><div className={`grid h-11 w-11 place-items-center rounded-xl ${c}`}><Icon size={20} /></div>
        <div><p className="text-sm text-sub">{l}</p><p className="text-2xl font-semibold tracking-tight">{n ?? 0}</p></div></Link>))}</div>
    <section className="card mt-6"><h2 className="mb-3 font-semibold">Recent activity</h2>
      {acts.data?.length ? <ul className="divide-y divide-line">{acts.data.map(a => (<li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
        <span className="flex items-center gap-2.5"><span className="h-2 w-2 rounded-full bg-brand/60" />{humanize(a.action)}</span>
        <time className="shrink-0 text-xs text-sub">{new Date(a.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time></li>))}</ul>
        : <EmptyState icon={FolderPlus} title="Nothing here yet" text="Create your first project, then add tasks. Your activity will show up here." />}</section></div>);
}