import Link from "next/link";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { getContext } from "@/lib/context";
import { PageHeader } from "@/components/ui";
import { deleteConversation } from "../actions";
import Chat, { type Msg } from "./chat";
import PlanGenerator from "./plan";
export default async function AI({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const q = await searchParams; const cid = q.c && /^[0-9a-f-]{36}$/i.test(q.c) ? q.c : undefined;
  const { sb } = await getContext();
  const { data: convs } = await sb.from("ai_conversations").select("id, title").order("updated_at", { ascending: false }).limit(30); // null if migration 0010 isn't applied yet
  let messages: Msg[] = []; let applied: string[] = [];
  if (cid) {
    const { data } = await sb.from("ai_messages").select("role, content, records, proposals").eq("conversation_id", cid).order("created_at");
    messages = (data ?? []) as Msg[];
    const ids = messages.flatMap(m => (m.proposals ?? []).map(p => p.id));
    if (ids.length) { const { data: ap } = await sb.from("activities").select("entity_id").eq("action", "ai.proposal_applied").in("entity_id", ids); applied = (ap ?? []).map((a: { entity_id: string }) => a.entity_id); }
  }
  return (<div><PageHeader title="AI Command Center" description="Ask about your work, or tell Orbit what to create. You approve every change." />
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside aria-label="Chat history" className="space-y-1"><Link href="/ai" className="btn-ghost mb-2 w-full !justify-start"><MessageSquarePlus size={16} />New chat</Link>
        {!convs?.length && <p className="px-1 text-xs text-sub">Your saved chats will appear here.</p>}
        {convs?.map(c => (<div key={c.id} className={`group flex items-center gap-1 rounded-lg ${c.id === cid ? "bg-ai-bg" : "hover:bg-muted"}`}>
          <Link href={`/ai?c=${c.id}`} aria-current={c.id === cid ? "page" : undefined} className={`min-w-0 flex-1 truncate px-3 py-2 text-sm ${c.id === cid ? "font-medium text-ai" : "text-slate-600"}`}>{c.title}</Link>
          <form action={deleteConversation}><input type="hidden" name="id" value={c.id} /><button aria-label={`Delete chat: ${c.title}`} title="Delete chat" className="rounded-md p-1.5 text-slate-400 hover:text-err lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"><Trash2 size={14} /></button></form></div>))}</aside>
      <div className="min-w-0 space-y-6"><Chat key={cid ?? "new"} conversationId={cid} initialMessages={messages} appliedIds={applied} /><PlanGenerator /></div></div></div>);
}