import Link from "next/link";
import { Check, Circle, Sparkles } from "lucide-react";
import { loadSampleProject, removeSampleProject } from "@/app/(workspace)/actions";
type Step = { label: string; href: string; done: boolean };
export default function GetStarted({ steps, canManage, hasSample }: { steps: Step[]; canManage: boolean; hasSample: boolean }) {
  const n = steps.filter(s => s.done).length;
  return (<section className="card mb-6 border-brand/20 bg-indigo-50/40"><div className="flex flex-wrap items-start justify-between gap-3"><div>
      <h2 className="font-semibold">Get started with Orbit</h2><p className="text-sm text-sub">{n} of {steps.length} done</p></div>
      {canManage && (hasSample
        ? <form action={removeSampleProject}><button className="btn-ghost">Remove sample project</button></form>
        : <form action={loadSampleProject}><button className="btn"><Sparkles size={16} />Load sample project</button></form>)}</div>
    <ul className="mt-4 grid gap-2 sm:grid-cols-2">{steps.map(s => (<li key={s.label}><Link href={s.href} className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2.5 text-sm shadow-sm transition-shadow hover:shadow-md">
      {s.done ? <Check size={16} className="shrink-0 text-ok" /> : <Circle size={16} className="shrink-0 text-slate-300" />}<span className={s.done ? "text-sub line-through" : ""}>{s.label}</span></Link></li>))}</ul>
    {canManage && !hasSample && <p className="mt-3 text-xs text-sub">The sample project adds example tasks so you can explore. It counts in reports until you remove it.</p>}</section>);
}