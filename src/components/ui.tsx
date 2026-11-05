import type { LucideIcon } from "lucide-react";
export const label = (s: string) => s.replace(/_/g, " ");
export const humanize = (a: string) => { const t = label(a.replace(".", " ")); return t.charAt(0).toUpperCase() + t.slice(1); };
const base = "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset";
const STATUS: Record<string, string> = {
  backlog: "bg-slate-50 text-slate-600 ring-slate-200", todo: "bg-sky-50 text-sky-700 ring-sky-200", in_progress: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  in_review: "bg-amber-50 text-amber-700 ring-amber-200", done: "bg-emerald-50 text-emerald-700 ring-emerald-200", cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
  planning: "bg-slate-50 text-slate-600 ring-slate-200", active: "bg-emerald-50 text-emerald-700 ring-emerald-200", on_hold: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-indigo-50 text-indigo-700 ring-indigo-200", archived: "bg-slate-100 text-slate-500 ring-slate-200" };
const PRIO: Record<string, string> = { low: "bg-slate-400", medium: "bg-sky-500", high: "bg-orange-500", urgent: "bg-red-600" };
export const StatusBadge = ({ s }: { s: string }) => <span className={`${base} ${STATUS[s] ?? STATUS.backlog}`}>{label(s)}</span>;
export const PriorityBadge = ({ p }: { p: string }) => <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-sub"><span className={`h-2 w-2 rounded-full ${PRIO[p] ?? "bg-slate-400"}`} />{p}</span>;
export const ProgressBar = ({ pct }: { pct: number }) => (<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand transition-all duration-200" style={{ width: `${pct}%` }} /></div>);
export function PageHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (<div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    {description && <p className="mt-1 text-sm text-sub">{description}</p>}</div>{children}</div>);
}
export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (<div className="flex flex-col items-center rounded-card border border-dashed border-line bg-white px-6 py-12 text-center"><div className="mb-3 rounded-full bg-muted p-3"><Icon size={20} className="text-sub" /></div>
    <p className="font-medium">{title}</p><p className="mt-1 max-w-sm text-sm text-sub">{text}</p></div>);
}