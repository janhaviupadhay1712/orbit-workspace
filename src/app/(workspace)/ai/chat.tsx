"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ListPlus } from "lucide-react";
import { applyProposal } from "../actions";
import type { Proposal } from "@/lib/schemas";
type Rec = { type: string; id: string; label: string; href: string };
export type Msg = { role: "user" | "assistant"; content: string; records?: Rec[] | null; proposals?: Proposal[] | null; error?: boolean };
const EXAMPLES = ["What should I focus on today?", "Show overdue tasks across my projects.", "Create 3 tasks for a product launch in my first project", "Mark my overdue tasks as in progress"];
const lbl = (s: string) => s.replace(/_/g, " ");

function ProposalCard({ p, applied }: { p: Proposal; applied: boolean }) {
  const router = useRouter(); const [state, setState] = useState<"idle" | "applying" | "done" | "failed" | "discarded">(applied ? "done" : "idle"); const [msg, setMsg] = useState(applied ? "Already applied." : "");
  async function approve() {
    setState("applying"); setMsg("");
    try { const r = await applyProposal(p); setMsg(r.message); setState(r.ok ? "done" : "failed"); if (r.ok) router.refresh(); }
    catch { setMsg("Something went wrong, so nothing was confirmed. Check your tasks before retrying."); setState("failed"); }
  }
  return (<div className="mt-2 rounded-lg border border-ai/30 bg-white p-3 text-sm"><p className="flex items-center gap-2 font-medium"><ListPlus size={16} className="text-ai" />Proposed changes <span className="text-xs font-normal text-sub">· nothing happens until you approve</span></p>
    <p className="mt-1 text-xs text-sub">{p.summary}</p>
    <ul className="mt-2 space-y-1">{p.creates.map((t, i) => <li key={`c${i}`} className="rounded bg-emerald-50 px-2 py-1">+ New task: <b>{t.title}</b> <span className="text-sub">· {t.project_name} · {t.priority}{t.due_date ? ` · due ${t.due_date}` : ""}</span></li>)}
      {p.updates.map((u, i) => <li key={`u${i}`} className="rounded bg-indigo-50 px-2 py-1"><b>{u.task_title}</b> <span className="text-sub">→ {[u.status && `status ${lbl(u.status)}`, u.priority && `priority ${u.priority}`, u.due_date !== undefined && (u.due_date ? `due ${u.due_date}` : "no due date")].filter(Boolean).join(", ")}</span></li>)}</ul>
    {state === "done" ? <p role="status" className="mt-2 flex items-center gap-1.5 text-ok"><Check size={15} />{msg}</p>
      : state === "discarded" ? <p className="mt-2 text-sub">Discarded. Nothing was changed.</p>
      : <div className="mt-3 flex items-center gap-2"><button className="btn" disabled={state === "applying"} onClick={approve}>{state === "applying" ? "Applying…" : state === "failed" ? "Retry" : "Approve"}</button>
          <button className="btn-ghost" disabled={state === "applying"} onClick={() => setState("discarded")}>Discard</button>{state === "failed" && <span role="alert" className="text-xs text-err">{msg}</span>}</div>}</div>);
}

export default function Chat({ conversationId, initialMessages, appliedIds }: { conversationId?: string; initialMessages: Msg[]; appliedIds: string[] }) {
  const router = useRouter(); const [msgs, setMsgs] = useState<Msg[]>(initialMessages); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [status, setStatus] = useState("");
  const convRef = useRef<string | undefined>(conversationId); const ctl = useRef<AbortController | null>(null); const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, status]);
  const patchLast = (f: (m: Msg) => Msg) => setMsgs(m => m.map((x, i) => (i === m.length - 1 ? f(x) : x)));

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const hadConversation = !!convRef.current; let finalConv: string | null = null;
    setMsgs(m => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]); setInput(""); setBusy(true); setStatus("Thinking…"); ctl.current = new AbortController();
    const handle = (ev: any) => {
      if (ev.t === "conv") convRef.current = ev.id;
      else if (ev.t === "status") setStatus(ev.v);
      else if (ev.t === "delta") { setStatus(""); patchLast(m => ({ ...m, content: m.content + ev.v })); }
      else if (ev.t === "reset") patchLast(m => ({ ...m, content: "" }));
      else if (ev.t === "final") { patchLast(m => ({ ...m, records: ev.records, proposals: ev.proposals })); finalConv = ev.conversationId ?? null; }
      else if (ev.t === "error") patchLast(() => ({ role: "assistant", content: ev.v, error: true }));
    };
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.current.signal, body: JSON.stringify({ message: text, conversationId: convRef.current }) });
      if (!res.ok || !res.body) { const j = await res.json().catch(() => ({})); patchLast(() => ({ role: "assistant", content: j.error ?? "Something went wrong.", error: true })); return; }
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl: number; while ((nl = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1); if (line) handle(JSON.parse(line)); }
      }
      if (finalConv) { if (hadConversation) router.refresh(); else router.replace(`/ai?c=${finalConv}`); } // refresh the history list
    } catch (e: any) {
      patchLast(m => ({ ...m, content: m.content || (e.name === "AbortError" ? "Stopped." : "Network error. You can retry."), error: !m.content && e.name !== "AbortError" }));
    } finally { setBusy(false); setStatus(""); }
  }
  return (<section className="card space-y-3 border-ai/30"><h2 className="font-medium">Ask or tell Orbit <span className="text-xs text-sub">(changes need your approval)</span></h2>
    {!msgs.length && <div className="flex flex-wrap gap-2">{EXAMPLES.map(e => <button key={e} onClick={() => send(e)} className="rounded-lg bg-ai-bg px-3 py-1.5 text-xs text-ai">{e}</button>)}</div>}
    <div className="space-y-3" aria-live="polite">{msgs.map((m, i) => (<div key={i} className={m.role === "user" ? "text-right" : ""}>
      {m.content && <p className={`inline-block max-w-full whitespace-pre-wrap rounded-lg px-3 py-2 text-sm text-left ${m.role === "user" ? "bg-muted" : m.error ? "bg-red-50 text-err" : "bg-ai-bg"}`}>{m.content}</p>}
      {m.proposals?.map(p => <ProposalCard key={p.id} p={p} applied={appliedIds.includes(p.id)} />)}
      {!!m.records?.length && <div className="mt-1 flex flex-wrap gap-1.5"><span className="text-xs text-sub">Records used:</span>{m.records.map(r => <Link key={r.id} href={r.href} className="rounded bg-muted px-1.5 py-0.5 text-xs text-brand">{r.label}</Link>)}</div>}</div>))}
      {busy && status && <p className="text-sm text-sub">{status}</p>}<div ref={end} /></div>
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send(input); }}><input value={input} onChange={e => setInput(e.target.value)} maxLength={2000} placeholder="Ask a question, or tell Orbit what to create or change" className="input" />
      {busy ? <button type="button" className="btn-ghost" onClick={() => ctl.current?.abort()}>Stop</button> : <button className="btn !bg-ai" disabled={!input.trim()}>Send</button>}</form></section>);
}