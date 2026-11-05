"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, FolderKanban, Sparkles, Search, Bell, CalendarDays, Settings, BarChart3, LogOut } from "lucide-react";
const groups = [
  { title: "Workspace", items: [{ href: "/", label: "Home", Icon: Home }, { href: "/tasks", label: "My Tasks", Icon: CheckSquare }, { href: "/inbox", label: "Inbox", Icon: Bell },
    { href: "/projects", label: "Projects", Icon: FolderKanban }, { href: "/calendar", label: "Calendar", Icon: CalendarDays }, { href: "/search", label: "Search", Icon: Search }] },
  { title: "AI", items: [{ href: "/ai", label: "AI Command Center", Icon: Sparkles }] },
  { title: "Manage", items: [{ href: "/reports", label: "Reports", Icon: BarChart3 }, { href: "/settings", label: "Settings", Icon: Settings }] }];
type Props = { orgName: string; email: string; displayName: string; avatarUrl: string | null; signOut: () => Promise<void> };
export default function Nav({ orgName, email, displayName, avatarUrl, signOut }: Props) {
  const path = usePathname(); const on = (h: string) => (h === "/" ? path === "/" : path === h || path.startsWith(h + "/"));
  const initials = displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (<aside className="flex shrink-0 flex-col border-b border-line bg-white md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
    <div className="flex items-center gap-2.5 px-5 py-4"><div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white">O</div>
      <div className="min-w-0"><p className="text-sm font-semibold leading-tight">Orbit</p><p className="truncate text-xs text-sub">{orgName}</p></div></div>
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0 md:overflow-y-auto md:pb-0" aria-label="Main">
      {groups.map(g => (<div key={g.title} className="flex gap-1 md:mb-4 md:flex-col"><p className="hidden px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 md:block">{g.title}</p>
        {g.items.map(({ href, label, Icon }) => { const ai = href === "/ai", active = on(href); return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${active ? (ai ? "bg-ai-bg font-medium text-ai" : "bg-indigo-50 font-medium text-brand") : "text-slate-600 hover:bg-muted hover:text-ink"}`}>
            <Icon size={17} className={active ? "" : ai ? "text-ai" : "text-slate-400"} />{label}</Link>); })}</div>))}</nav>
    <div className="hidden items-center gap-1 border-t border-line p-3 md:flex">
      <Link href="/profile" aria-current={on("/profile") ? "page" : undefined} title="Your profile" className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted ${on("/profile") ? "bg-indigo-50" : ""}`}>
        {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-brand">{initials}</span>}
        <span className="min-w-0"><span className="block truncate text-sm font-medium leading-tight">{displayName}</span><span className="block truncate text-xs text-sub">{email}</span></span></Link>
      <form action={signOut}><button title="Sign out" aria-label="Sign out" className="rounded-md p-2 text-slate-400 transition-colors hover:bg-muted hover:text-ink"><LogOut size={16} /></button></form></div></aside>);
}