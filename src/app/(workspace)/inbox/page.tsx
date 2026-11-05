import Link from "next/link";
import { getContext } from "@/lib/context";
import { markRead } from "../actions";
export default async function Inbox() {
  const { sb, user } = await getContext();
  const { data } = await sb.from("notifications").select("id, title, link, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  const unread = data?.filter(n => !n.read_at).length ?? 0;
  return (<div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Inbox {unread > 0 && <span className="text-sm text-sub">({unread} unread)</span>}</h1>
    {unread > 0 && <form action={markRead}><input type="hidden" name="id" value="" /><button className="btn">Mark all as read</button></form>}</div>
    {!data?.length && <p className="text-sm text-sub">No notifications yet. You’ll be notified when someone comments on a task you own or created.</p>}
    <div className="card divide-y divide-line p-0">{data?.map(n => (<div key={n.id} className={`flex items-center justify-between gap-3 p-3 text-sm ${n.read_at ? "text-sub" : ""}`}>
      <div>{n.link ? <Link href={n.link} className={n.read_at ? "" : "font-medium text-brand"}>{n.title}</Link> : n.title}
        <p className="text-xs text-sub">{new Date(n.created_at).toLocaleString()}</p></div>
      {!n.read_at && <form action={markRead}><input type="hidden" name="id" value={n.id} /><button className="text-xs text-brand">Mark read</button></form>}</div>))}</div></div>);
}
