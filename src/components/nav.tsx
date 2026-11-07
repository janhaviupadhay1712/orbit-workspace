"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, FolderKanban, Sparkles, Search, Bell, CalendarDays, Settings, BarChart3, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
const groups = [
  { title: "Workspace", items: [{ href: "/", label: "Home", Icon: Home }, { href: "/tasks", label: "My Tasks", Icon: CheckSquare }, { href: "/inbox", label: "Inbox", Icon: Bell },
    { href: "/projects", label: "Projects", Icon: FolderKanban }, { href: "/calendar", label: "Calendar", Icon: CalendarDays }, { href: "/search", label: "Search", Icon: Search }] },
  { title: "AI", items: [{ href: "/ai", label: "AI Command Center", Icon: Sparkles }] },
  { title: "Manage", items: [{ href: "/reports", label: "Reports", Icon: BarChart3 }, { href: "/settings", label: "Settings", Icon: Settings }] }];
type Props = { orgName: string; email: string; displayName: string; avatarUrl: string | null; signOut: () => Promise<void>; collapsed: boolean; onToggle: () => void };
// On desktop the sidebar can collapse to a slim icon rail (like Claude's). On phones it stays a scrollable strip.
export default function Nav({ orgName, email, displayName, avatarUrl, signOut, collapsed, onToggle }: Props) {
  const path = usePathname(); const on = (h: string) => (h === "/" ? path === "/" : path === h || path.startsWith(h + "/"));
  const initials = displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hide = collapsed ? "md:hidden" : "";
  return (<aside className={`flex shrink-0 flex-col border-b border-line bg-white transition-[width] duration-200 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r ${collapsed ? "md:w-[68px]" : "md:w-64"}`}>
    <div className={`flex items-center gap-2.5 px-5 py-4 ${collapsed ? "md:justify-center md:px-0" : ""}`}>
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-white ${hide}`}>O</div>
      <div className={`min-w-0 flex-1 ${hide}`}><p className="text-sm font-semibold leading-tight">Orbit</p><p className="truncate text-xs text-sub">{orgName}</p></div>
      <button onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-expanded={!collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-muted hover:text-ink md:grid">{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
    <nav className={`flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:gap-0 md:overflow-y-auto md:pb-0 ${collapsed ? "md:px-2" : ""}`} aria-label="Main">
      {groups.map(g => (<div key={g.title} className="flex gap-1 md:mb-4 md:flex-col"><p className={`hidden px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 ${collapsed ? "" : "md:block"}`}>{g.title}</p>
        {g.items.map(({ href, label, Icon }) => { const ai = href === "/ai", active = on(href); return (
          <Link key={href} href={href} title={label} aria-label={label} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${collapsed ? "md:justify-center md:px-0" : ""} ${active ? (ai ? "bg-ai-bg font-medium text-ai" : "bg-indigo-50 font-medium text-brand") : "text-slate-600 hover:bg-muted hover:text-ink"}`}>
            <Icon size={17} className={active ? "" : ai ? "text-ai" : "text-slate-400"} /><span className={hide}>{label}</span></Link>); })}</div>))}</nav>
    <div className={`hidden border-t border-line p-3 md:flex ${collapsed ? "flex-col items-center gap-2" : "items-center gap-1"}`}>
      <Link href="/profile" title={displayName} aria-current={on("/profile") ? "page" : undefined} className={`flex min-w-0 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted ${collapsed ? "" : "flex-1"} ${on("/profile") ? "bg-indigo-50" : ""}`}>
        {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="h-8 w-8 shrink-0 rounded-full object-cover" />
          : <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-brand">{initials}</span>}
        <span className={`min-w-0 ${hide}`}><span className="block truncate text-sm font-medium leading-tight">{displayName}</span><span className="block truncate text-xs text-sub">{email}</span></span></Link>
      <form action={signOut}><button title="Sign out" aria-label="Sign out" className="rounded-md p-2 text-slate-400 transition-colors hover:bg-muted hover:text-ink"><LogOut size={16} /></button></form></div></aside>);
}