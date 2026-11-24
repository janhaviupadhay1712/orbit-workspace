import Link from "next/link";
import { MessageSquarePlus, Sparkles, Trash2 } from "lucide-react";
import { getContext } from "@/lib/context";
import { deleteConversation } from "../actions";
import Chat, { type Msg } from "./chat";
import PlanGenerator from "./plan";
export default async function AI({ searchParams }: { searchParams: Promise<{ c?: string; tab?: string }> }) {
  const q = await searchParams; const plan = q.tab === "plan"; const cid = q.c && /^[0-9a-f-]{36}$/i.test(q.c) ? q.c : undefined;
  const { sb } = await getContext();
  const { data: convs } = await sb.from("ai_conversations").select("id, title").order("updated_at", { ascending: false }).limit(30); // null if migration 0010 isn't applied yet
  let messages: Msg[] = []; let applied: string[] = [];
  if (cid && !plan) {
    const { data } = await sb.from("ai_messages").select("role, content, records, proposals").eq("conversation_id", cid).order("created_at");
    messages = (data ?? []) as Msg[];
    const ids = messages.flatMap(m => (m.proposals ?? []).map(p => p.id));
    if (ids.length) { const { data: ap } = await sb.from("activities").select("entity_id").eq("action", "ai.proposal_applied").in("entity_id", ids); applied = (ap ?? []).map((a: { entity_id: string }) => a.entity_id); }
  }
  const active = (id: string) => id === cid && !plan;
  const list = convs?.map(c => (<div key={c.id} className={`group flex items-center rounded-lg ${active(c.id) ? "bg-ai-bg" : "hover:bg-slate-100"}`}>
    <Link href={`/ai?c=${c.id}`} aria-current={active(c.id) ? "page" : undefined} className={`min-w-0 flex-1 truncate px-3 py-2 text-sm ${active(c.id) ? "font-medium text-ai" : "text-slate-600"}`}>{c.title}</Link>
    <form action={deleteConversation}><input type="hidden" name="id" value={c.id} /><button aria-label={`Delete chat: ${c.title}`} title="Delete chat" className="mr-1 rounded-md p-1.5 text-slate-400 hover:text-err md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"><Trash2 size={14} /></button></form></div>));
  const empty = <p className="px-3 py-2 text-xs text-sub">Your saved chats will appear here.</p>;
  const tab = (on: boolean) => `rounded-md px-3 py-1 text-xs font-medium transition-colors ${on ? "bg-white text-ink shadow-sm" : "text-sub hover:text-ink"}`;
  return (<div className="flex h-[calc(100dvh-6rem)] min-h-[480px] overflow-hidden rounded-card border border-line bg-white shadow-sm md:h-[calc(100dvh-8.5rem)]">
    <aside aria-label="Chat history" className="hidden w-64 shrink-0 flex-col border-r border-line bg-slate-50/70 md:flex">
      <div className="p-3"><Link href="/ai" className="btn-ghost w-full !justify-start"><MessageSquarePlus size={16} />New chat</Link></div>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">{list?.length ? list : empty}</nav></aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-ai-bg text-ai"><Sparkles size={16} /></span>
          <div><h1 className="text-sm font-semibold leading-tight">AI Command Center</h1><p className="text-xs text-sub">You approve every change</p></div></div>
        <div className="flex items-center gap-2">
          <details className="relative md:hidden"><summary className="btn-ghost cursor-pointer list-none !px-2.5 !py-1.5 text-xs">History</summary>
            <div className="absolute right-0 z-20 mt-2 max-h-72 w-64 space-y-0.5 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-lg"><Link href="/ai" className="btn-ghost mb-1 w-full !justify-start text-xs"><MessageSquarePlus size={14} />New chat</Link>{list?.length ? list : empty}</div></details>
          <div className="inline-flex rounded-lg bg-muted p-0.5"><Link href="/ai" className={tab(!plan)}>Chat</Link><Link href="/ai?tab=plan" className={tab(plan)}>Plan a project</Link></div></div></header>
      {plan ? <div className="min-h-0 flex-1 overflow-y-auto"><PlanGenerator /></div> : <Chat key={cid ?? "new"} conversationId={cid} initialMessages={messages} appliedIds={applied} />}</div></div>);
}