import Link from "next/link";
import { Sparkles, Search } from "lucide-react";
import { getContext } from "@/lib/context";
import Nav from "@/components/nav";
import { createOrg, signOut } from "./actions";
export default async function Shell({ children }: { children: React.ReactNode }) {
  const c = await getContext();
  if (!c.orgId) return (<main className="grid min-h-screen place-items-center p-4"><form action={createOrg} className="card w-full max-w-sm space-y-4">
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">O</div>
    <div><h1 className="text-xl font-semibold">Create your organization</h1><p className="mt-1 text-sm text-sub">This is your team’s workspace. You’ll be its owner.</p></div>
    <input name="name" required maxLength={120} className="input" placeholder="Acme Inc." /><button className="btn w-full">Create organization</button></form></main>);
  return (<div className="min-h-screen md:flex"><Nav orgName={c.orgName ?? ""} email={c.user.email ?? ""} displayName={c.displayName} avatarUrl={c.avatarUrl} signOut={signOut} />
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-8">
      <form action="/search" className="relative w-full max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input name="q" placeholder="Search projects and tasks…" aria-label="Search" className="input !bg-muted/60 !pl-9" /></form>
      <Link href="/ai" className="btn !bg-ai shrink-0 hover:!bg-violet-600"><Sparkles size={15} /><span className="hidden sm:inline">Ask AI</span></Link></header>
      <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main></div></div>);
}