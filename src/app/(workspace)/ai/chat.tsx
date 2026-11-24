"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowUp, Check, Copy, ListChecks, Pencil, Plus, RotateCcw, Sparkles, Square } from "lucide-react";
import Markdown from "@/components/markdown";
import { applyProposal } from "../actions";
import type { Proposal } from "@/lib/schemas";
type Rec = { type: string; id: string; label: string; href: string };
export type Msg = { role: "user" | "assistant"; content: string; records?: Rec[] | null; proposals?: Proposal[] | null; error?: boolean };
const SUGGESTIONS = [
  { Icon: ListChecks, title: "Plan my day", text: "What should I focus on today?" },
  { Icon: AlertCircle, title: "Find overdue work", text: "Show overdue tasks across my projects." },
  { Icon: Plus, title: "Create tasks", text: "Create 3 tasks for a product launch in my first project" },
  { Icon: Pencil, title: "Update tasks", text: "Mark my overdue tasks as in progress" }];
const lbl = (s: string) => s.replace(/_/g, " ");

function Typing({ status }: { status: string }) {
  return (<div className="flex items-center gap-2 py-1.5 text-sm text-sub" role="status"><span className="flex gap-1">{[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ai/60" style={{ animationDelay: `${i * 150}ms` }} />)}</span>{status || "Thinking…"}</div>);
}

function ProposalCard({ p, applied }: { p: Proposal; applied: boolean }) {
  const router = useRouter(); const [state, setState] = useState<"idle" | "applying" | "done" | "failed" | "discarded">(applied ? "done" : "idle"); const [msg, setMsg] = useState(applied ? "Already applied." : "");
  const n = p.creates.length + p.updates.length;
  async function approve() {
    setState("applying"); setMsg("");
    try { const r = await applyProposal(p); setMsg(r.message); setState(r.ok ? "done" : "failed"); if (r.ok) router.refresh(); }
    catch { setMsg("Something went wrong, so nothing was confirmed. Check your tasks before retrying."); setState("failed"); }
  }
  return (<div className="mt-3 overflow-hidden rounded-xl border border-ai/30 bg-white shadow-sm">
    <div className="flex flex-wrap items-center gap-x-2 border-b border-ai/20 bg-ai-bg px-4 py-2.5"><ListChecks size={16} className="text-ai" /><p className="text-sm font-medium">Review {n} proposed {n === 1 ? "change" : "changes"}</p><span className="ml-auto text-xs text-sub">Nothing happens until you approve</span></div>
    <div className="space-y-3 px-4 py-3">{p.summary && <p className="text-xs text-sub">{p.summary}</p>}
      <ul className="space-y-1.5">
        {p.creates.map((t, i) => <li key={`c${i}`} className="flex items-start gap-2.5 rounded-lg bg-emerald-50/70 px-3 py-2 text-sm"><Plus size={15} className="mt-0.5 shrink-0 text-ok" /><div className="min-w-0"><p className="font-medium">{t.title}</p><p className="text-xs text-sub">{t.project_name} · {t.priority} priority{t.due_date ? ` · due ${t.due_date}` : ""}</p></div></li>)}
        {p.updates.map((u, i) => <li key={`u${i}`} className="flex items-start gap-2.5 rounded-lg bg-indigo-50/70 px-3 py-2 text-sm"><Pencil size={14} className="mt-0.5 shrink-0 text-brand" /><div className="min-w-0"><p className="font-medium">{u.task_title}</p><p className="text-xs text-sub">{[u.status && `status → ${lbl(u.status)}`, u.priority && `priority → ${u.priority}`, u.due_date !== undefined && (u.due_date ? `due → ${u.due_date}` : "clear due date")].filter(Boolean).join(" · ")}</p></div></li>)}</ul>
      {state === "done" ? <p role="status" className="flex items-center gap-1.5 text-sm font-medium text-ok"><Check size={15} />{msg}</p>
        : state === "discarded" ? <p className="text-sm text-sub">Discarded. Nothing was changed.</p>
        : <div className="flex flex-wrap items-center gap-2"><button className="btn" disabled={state === "applying"} onClick={approve}>{state === "applying" ? "Applying…" : state === "failed" ? "Retry" : "Approve"}</button>
            <button className="btn-ghost" disabled={state === "applying"} onClick={() => setState("discarded")}>Discard</button>{state === "failed" && <span role="alert" className="text-xs text-err">{msg}</span>}</div>}</div></div>);
}

export default function Chat({ conversationId, initialMessages, appliedIds }: { conversationId?: string; initialMessages: Msg[]; appliedIds: string[] }) {
  const router = useRouter(); const [msgs, setMsgs] = useState<Msg[]>(initialMessages); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [status, setStatus] = useState(""); const [copied, setCopied] = useState<number | null>(null);
  const convRef = useRef<string | undefined>(conversationId); const ctl = useRef<AbortController | null>(null);
  const box = useRef<HTMLDivElement>(null); const stick = useRef(true); const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (stick.current) box.current?.scrollTo({ top: box.current.scrollHeight }); }, [msgs, status]);
  useEffect(() => { const el = area.current; if (!el) return; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 160)}px`; }, [input]);
  const patchLast = (f: (m: Msg) => Msg) => setMsgs(m => m.map((x, i) => (i === m.length - 1 ? f(x) : x)));
  const lastUser = [...msgs].reverse().find(m => m.role === "user")?.content;

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const hadConversation = !!convRef.current; let finalConv: string | null = null; stick.current = true;
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
  function retry() { if (!lastUser) return; setMsgs(m => m.slice(0, -2)); send(lastUser); } // drop the failed exchange, ask again
  async function copy(text: string, i: number) { try { await navigator.clipboard.writeText(text); setCopied(i); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard unavailable */ } }

  return (<section className="flex min-h-0 flex-1 flex-col">
    <div ref={box} onScroll={() => { const b = box.current; if (b) stick.current = b.scrollHeight - b.scrollTop - b.clientHeight < 120; }} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
      {!msgs.length ? (<div className="mx-auto flex max-w-2xl flex-col items-center pt-4 text-center md:pt-10">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ai-bg text-ai"><Sparkles size={26} /></span>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">How can I help with your work?</h2>
          <p className="mt-1 max-w-md text-sm text-sub">Ask about your projects and tasks, or tell Orbit what to create. You review every change before it happens.</p>
          <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">{SUGGESTIONS.map(({ Icon, title, text }) => (
            <button key={title} onClick={() => send(text)} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-left transition-colors hover:border-ai/40 hover:bg-ai-bg/40">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ai-bg text-ai"><Icon size={16} /></span>
              <span><span className="block text-sm font-medium">{title}</span><span className="mt-0.5 block text-xs text-sub">{text}</span></span></button>))}</div></div>)
      : (<div className="mx-auto max-w-3xl space-y-6" aria-live="polite">{msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="flex justify-end"><div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] leading-6 text-white">{m.content}</div></div>
        ) : (<div key={i} className="flex gap-3"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ai text-white"><Sparkles size={15} /></span>
          <div className="min-w-0 flex-1">
            {m.error ? (<div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-err"><AlertCircle size={16} className="mt-0.5 shrink-0" /><div><p>{m.content}</p>
                {lastUser && i === msgs.length - 1 && !busy && <button onClick={retry} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium underline"><RotateCcw size={12} />Try again</button>}</div></div>)
              : m.content ? <Markdown text={m.content} /> : busy && i === msgs.length - 1 ? <Typing status={status} /> : null}
            {m.proposals?.map(p => <ProposalCard key={p.id} p={p} applied={appliedIds.includes(p.id)} />)}
            {!!m.records?.length && <div className="mt-3 flex flex-wrap items-center gap-1.5"><span className="text-xs text-sub">Based on:</span>{m.records.map(r => <Link key={r.id} href={r.href} className="rounded-md bg-muted px-2 py-0.5 text-xs text-brand hover:bg-indigo-50">{r.label}</Link>)}</div>}
            {m.content && !m.error && !(busy && i === msgs.length - 1) && <button onClick={() => copy(m.content, i)} className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-ink">{copied === i ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}</button>}</div></div>))}</div>)}
    </div>
    <div className="border-t border-line bg-white px-4 py-3 md:px-8"><form className="mx-auto max-w-3xl" onSubmit={e => { e.preventDefault(); send(input); }}>
      <div className="flex items-end gap-2 rounded-2xl border border-line bg-white p-2 shadow-sm focus-within:border-ai focus-within:ring-2 focus-within:ring-ai/20">
        <textarea ref={area} rows={1} value={input} onChange={e => setInput(e.target.value)} maxLength={2000} aria-label="Message" placeholder="Message Orbit…"
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
          className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] outline-none placeholder:text-slate-400" />
        {busy ? <button type="button" onClick={() => ctl.current?.abort()} aria-label="Stop" title="Stop" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-800 text-white hover:bg-slate-700"><Square size={14} fill="currentColor" /></button>
          : <button aria-label="Send" title="Send" disabled={!input.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ai text-white transition-colors hover:bg-violet-600 disabled:bg-slate-200 disabled:text-slate-400"><ArrowUp size={18} /></button>}</div>
      <p className="mt-2 text-center text-xs text-slate-400">Enter to send · Shift+Enter for a new line · Orbit asks before changing anything</p></form></div></section>);
}