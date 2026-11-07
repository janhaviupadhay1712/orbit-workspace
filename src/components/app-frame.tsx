"use client";
import { useState } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import Nav from "@/components/nav";
type Props = { initialOpen: boolean; orgName: string; email: string; displayName: string; avatarUrl: string | null; signOut: () => Promise<void>; children: React.ReactNode };
// Holds the collapsed/expanded state of the sidebar. It is saved in a cookie so the server renders the right state on the next visit (no flicker).
export default function AppFrame({ initialOpen, children, ...nav }: Props) {
  const [open, setOpen] = useState(initialOpen);
  function toggle() {
    const next = !open; setOpen(next);
    document.cookie = `orbit_sidebar=${next ? "shown" : "hidden"}; path=/; max-age=31536000; samesite=lax`;
  }
  return (<div className="min-h-screen md:flex"><Nav {...nav} collapsed={!open} onToggle={toggle} />
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur md:px-8">
      <form action="/search" className="relative w-full max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input name="q" placeholder="Search projects and tasks…" aria-label="Search" className="input !bg-muted/60 !pl-9" /></form>
      <Link href="/ai" className="btn !bg-ai shrink-0 hover:!bg-violet-600"><Sparkles size={15} /><span className="hidden sm:inline">Ask AI</span></Link></header>
      <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main></div></div>);
}