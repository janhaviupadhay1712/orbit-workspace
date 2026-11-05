import Link from "next/link";
import { getContext } from "@/lib/context";
import { monthParam } from "@/lib/schemas";
export default async function Calendar({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const ym = monthParam((await searchParams).m); const [y, m] = ym.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate(), offset = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const shift = (d: number) => new Date(Date.UTC(y, m - 1 + d, 1)).toISOString().slice(0, 7);
  const start = `${ym}-01`, end = `${ym}-${String(days).padStart(2, "0")}`;
  const { sb } = await getContext();
  const [{ data: tasks }, { data: projects }] = await Promise.all([
    sb.from("tasks").select("id, title, due_date, status").gte("due_date", start).lte("due_date", end),
    sb.from("projects").select("id, name, target_date").gte("target_date", start).lte("target_date", end)]);
  const on = (d: number) => `${ym}-${String(d).padStart(2, "0")}`;
  return (<div className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Calendar · {ym}</h1>
    <div className="flex gap-2"><Link href={`/calendar?m=${shift(-1)}`} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm">Prev</Link>
      <Link href={`/calendar?m=${shift(1)}`} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm">Next</Link></div></div>
    <p className="text-xs text-sub">Shows task due dates and project target dates (dates are date-only, no time zone).</p>
    <div className="overflow-x-auto"><div className="grid grid-cols-7 gap-px min-w-[640px] bg-line border border-line rounded-card overflow-hidden">
      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="bg-muted p-2 text-xs font-medium">{d}</div>)}
      {Array.from({ length: offset }, (_, i) => <div key={`o${i}`} className="bg-bg min-h-24" />)}
      {Array.from({ length: days }, (_, i) => { const d = i + 1; return (<div key={d} className="bg-white min-h-24 p-1.5 space-y-1"><p className="text-xs text-sub">{d}</p>
        {tasks?.filter(t => t.due_date === on(d)).map(t => <Link key={t.id} href={`/tasks/${t.id}`} className={`block truncate rounded bg-muted px-1.5 py-0.5 text-xs ${t.status === "done" ? "line-through text-sub" : ""}`}>{t.title}</Link>)}
        {projects?.filter(p => p.target_date === on(d)).map(p => <Link key={p.id} href="/projects" className="block truncate rounded bg-ai-bg px-1.5 py-0.5 text-xs text-ai">◆ {p.name}</Link>)}</div>); })}
    </div></div></div>);
}
