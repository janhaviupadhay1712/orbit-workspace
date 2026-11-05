"use client";
import { useRef, useState } from "react";
import Link from "next/link";
type Rec = { type: string; id: string; label: string; href: string };
type Msg = { role: "user" | "assistant"; content: string; records?: Rec[]; error?: boolean };
const EXAMPLES = ["What should I focus on today?", "Show overdue tasks across my projects.", "Which projects are active and how far along are they?"];
export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  async function send(text: string) {
    if (!text.trim() || busy) return; const history = msgs.filter(m => !m.error).slice(-6).map(({ role, content }) => ({ role, content }));
    setMsgs(m => [...m, { role: "user", content: text }]); setInput(""); setBusy(true); ctl.current = new AbortController();
    try {
      const r = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.current.signal, body: JSON.stringify({ message: text, history }) });
      const j = await r.json();
      setMsgs(m => [...m, r.ok ? { role: "assistant", content: j.answer, records: j.records } : { role: "assistant", content: j.error ?? "Something went wrong.", error: true }]);
    } catch (e: any) { setMsgs(m => [...m, { role: "assistant", content: e.name === "AbortError" ? "Cancelled." : "Network error. You can retry.", error: true }]); }
    setBusy(false);
  }
  return (<section className="card space-y-3 border-ai/30"><h2 className="font-medium">Ask about your work <span className="text-xs text-sub">(read-only)</span></h2>
    {!msgs.length && <div className="flex flex-wrap gap-2">{EXAMPLES.map(e => <button key={e} onClick={() => send(e)} className="rounded-lg bg-ai-bg px-3 py-1.5 text-xs text-ai">{e}</button>)}</div>}
    <div className="space-y-3" aria-live="polite">{msgs.map((m, i) => (<div key={i} className={m.role === "user" ? "text-right" : ""}>
      <p className={`inline-block max-w-full whitespace-pre-wrap rounded-lg px-3 py-2 text-sm text-left ${m.role === "user" ? "bg-muted" : m.error ? "bg-red-50 text-err" : "bg-ai-bg"}`}>{m.content}</p>
      {!!m.records?.length && <div className="mt-1 flex flex-wrap gap-1.5"><span className="text-xs text-sub">Records used:</span>{m.records.map(r => <Link key={r.id} href={r.href} className="rounded bg-muted px-1.5 py-0.5 text-xs text-brand">{r.label}</Link>)}</div>}</div>))}
      {busy && <p className="text-sm text-sub">Looking at your workspace…</p>}</div>
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); send(input); }}><input value={input} onChange={e => setInput(e.target.value)} maxLength={2000} placeholder="Ask a question" className="input" />
      {busy ? <button type="button" className="rounded-lg border border-line px-3.5 py-2 text-sm" onClick={() => ctl.current?.abort()}>Stop</button> : <button className="btn !bg-ai" disabled={!input.trim()}>Ask</button>}</form></section>);
}
