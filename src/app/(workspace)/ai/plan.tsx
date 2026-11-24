"use client";
import { useState } from "react";
import { approvePlan } from "../actions";
import type { Plan } from "@/lib/schemas";
export default function PlanGenerator() {
  const [prompt, setPrompt] = useState(""); const [plan, setPlan] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null); const [busy, setBusy] = useState(false);
  async function generate() {
    setBusy(true); setMsg(null); setPlan(null);
    try {
      const r = await fetch("/api/ai/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const j = await r.json(); r.ok ? setPlan(j.plan) : setMsg({ ok: false, text: j.error });
    } catch { setMsg({ ok: false, text: "Network error. Nothing was created." }); }
    setBusy(false);
  }
  async function approve() {
    if (!plan || busy) return; setBusy(true);
    const r = await approvePlan(plan); setBusy(false);
    if (r.ok) { setMsg({ ok: true, text: `Created the project with ${r.created} tasks.` }); setPlan(null); } else setMsg({ ok: false, text: r.error ?? "Failed" });
  }
  return (<div className="mx-auto w-full max-w-2xl space-y-5 p-4 md:p-8">
    <div><h2 className="text-lg font-semibold tracking-tight">Plan a project</h2><p className="mt-1 text-sm text-sub">Describe a goal. Orbit drafts the tasks for you to review. Nothing is created until you approve.</p></div>
    <div className="space-y-3"><textarea className="input" rows={4} maxLength={2000} value={prompt} onChange={e => setPrompt(e.target.value)} aria-label="Project goal" placeholder="For example: Plan a website redesign for our marketing site, launching in 6 weeks" />
      <button className="btn !bg-ai" disabled={busy || prompt.trim().length < 5} onClick={generate}>{busy && !plan ? "Drafting…" : "Draft a plan"}</button></div>
    {msg && <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-ok" : "bg-red-50 text-err"}`}>{msg.text}</p>}
    {plan && <div className="overflow-hidden rounded-xl border border-ai/30 bg-white shadow-sm"><div className="border-b border-ai/20 bg-ai-bg px-4 py-3"><h3 className="font-semibold">{plan.name}</h3>{plan.description && <p className="mt-0.5 text-sm text-sub">{plan.description}</p>}</div>
      <ul className="divide-y divide-line">{plan.tasks.map((t, i) => <li key={i} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm"><span>{t.title}</span><span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs capitalize text-sub">{t.priority}</span></li>)}</ul>
      <div className="flex gap-2 border-t border-line px-4 py-3"><button className="btn" disabled={busy} onClick={approve}>{busy ? "Creating…" : `Approve and create ${plan.tasks.length} tasks`}</button>
        <button className="btn-ghost" disabled={busy} onClick={() => setPlan(null)}>Discard</button></div></div>}</div>);
}