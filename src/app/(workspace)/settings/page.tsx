import { headers } from "next/headers";
import { getContext } from "@/lib/context";
import { inviteMember, revokeInvite, changeRole, removeMember } from "../actions";
export default async function Settings() {
  const c = await getContext(); const isOwner = c.role === "owner", isAdmin = isOwner || c.role === "admin";
  const { data: members } = await c.sb.rpc("list_members", { o: c.orgId });
  const { data: invites } = isAdmin ? await c.sb.from("invitations").select("id, email, role, token, expires_at").is("accepted_at", null).gt("expires_at", new Date().toISOString()) : { data: [] };
  const h = await headers(); const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  return (<div className="space-y-6 max-w-3xl"><h1 className="text-2xl font-semibold">Settings</h1>
    <section className="card space-y-3"><h2 className="font-medium">Organization</h2><p className="text-sm">{c.orgName} <span className="text-sub">· your role: {c.role}</span></p></section>
    <section className="card space-y-3"><h2 className="font-medium">Members</h2>
      {(members as any[] | null)?.map(m => (<div key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-line pb-2 last:border-0">
        <span><span className="font-medium">{m.full_name || m.email}</span> {m.full_name && <span className="text-sub">{m.email}</span>} {m.user_id === c.user.id && <span className="text-sub">(you)</span>}</span>
        <div className="flex items-center gap-2">
          {isOwner && m.role !== "owner" ? <form action={changeRole} className="flex gap-2"><input type="hidden" name="user_id" value={m.user_id} />
            <select name="role" defaultValue={m.role} className="input w-28"><option>admin</option><option>member</option></select><button className="text-xs text-brand">Save</button></form>
            : <span className="rounded bg-muted px-2 py-0.5 text-xs">{m.role}</span>}
          {m.role !== "owner" && (isOwner || (isAdmin && m.role === "member") || m.user_id === c.user.id) &&
            <form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><button className="text-xs text-err">{m.user_id === c.user.id ? "Leave" : "Remove"}</button></form>}</div></div>))}</section>
    {isAdmin ? <section className="card space-y-3"><h2 className="font-medium">Invite people</h2>
      <form action={inviteMember} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input name="email" type="email" required placeholder="name@company.com" className="input" />
        <select name="role" className="input"><option>member</option><option>admin</option></select><button className="btn">Create invite</button></form>
      <p className="text-xs text-sub">Email delivery isn’t set up. Copy the link and send it yourself; it only works for the invited email address and expires in 7 days.</p>
      {(invites as any[] | null)?.map(i => (<div key={i.id} className="text-sm border-t border-line pt-2"><div className="flex justify-between"><span>{i.email} · {i.role}</span>
        <form action={revokeInvite}><input type="hidden" name="id" value={i.id} /><button className="text-xs text-err">Revoke</button></form></div>
        <code className="block break-all text-xs text-sub">{origin}/invite/{i.token}</code></div>))}</section>
      : <p className="text-sm text-sub">Only owners and admins can invite people.</p>}</div>);
}
