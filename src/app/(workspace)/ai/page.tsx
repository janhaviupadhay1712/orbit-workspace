"use client";
import { useState } from "react";
import { approvePlan } from "../actions";
import Chat from "./chat";
import type { Plan } from "@/lib/schemas";
export default function AI() {
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
    if (r.ok) { setMsg({ ok: true, text: `Created project with ${r.created} verified tasks.` }); setPlan(null); } else setMsg({ ok: false, text: r.error ?? "Failed" });
  }
  return (<div className="space-y-4"><h1 className="text-2xl font-semibold">AI Command Center</h1><Chat />
    <div className="card border-ai/30 bg-ai-bg space-y-3"><textarea className="input" rows={3} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Create a project plan for our website redesign" />
      <button className="btn !bg-ai" disabled={busy || prompt.trim().length < 5} onClick={generate}>{busy && !plan ? "Working…" : "Generate plan"}</button></div>
    {msg && <p role="alert" className={`text-sm ${msg.ok ? "text-ok" : "text-err"}`}>{msg.text}</p>}
    {plan && <div className="card space-y-2"><h2 className="font-medium">{plan.name}</h2><p className="text-sm text-sub">{plan.description}</p>
      <ul className="text-sm list-disc pl-5">{plan.tasks.map((t, i) => <li key={i}>{t.title} <span className="text-sub">({t.priority})</span></li>)}</ul>
      <div className="flex gap-2"><button className="btn" disabled={busy} onClick={approve}>Approve &amp; create</button>
        <button className="rounded-lg border border-line px-3.5 py-2 text-sm" onClick={() => setPlan(null)}>Discard</button></div></div>}</div>);
}
