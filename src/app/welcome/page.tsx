import Link from "next/link";
import { Sparkles, LayoutList, Users, ShieldCheck, MessageSquareText, Eye, CheckCircle2 } from "lucide-react";
import WaitlistForm from "./waitlist-form";
export const metadata = { title: "Orbit Workspace: describe the work, Orbit organizes it", description: "A team workspace where an AI assistant turns plain-language requests into projects and tasks. You review every change before it happens." };
const steps = [{ Icon: MessageSquareText, t: "Tell Orbit what you need", d: "Type it the way you’d say it: “Create tasks for our product launch.”" },
  { Icon: Eye, t: "Review the preview", d: "Orbit shows exactly what it will create or change. Nothing happens yet." },
  { Icon: CheckCircle2, t: "Approve and track", d: "One click applies it. Your projects and tasks update right away." }];
const features = [{ Icon: Sparkles, t: "AI that asks first", d: "Every change the assistant proposes waits for your approval, so you stay in control." },
  { Icon: LayoutList, t: "Projects and tasks", d: "List, board and calendar views, subtasks, dependencies and comments." },
  { Icon: Users, t: "Built for teams", d: "Invite people and give them the right role: owner, admin or member." },
  { Icon: ShieldCheck, t: "Private by design", d: "Each organization’s data is separated at the database level." }];
export default async function Welcome({ searchParams }: { searchParams: Promise<{ src?: string }> }) {
  const source = ((await searchParams).src ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 50) || "direct"; // which post or link brought them
  return (<div className="min-h-screen bg-bg">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><div className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-base font-bold text-white">O</div>
      <span className="text-lg"><b className="font-bold">Orbit</b> Workspace</span></div><Link href="/login" className="btn-ghost">Sign in</Link></header>
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 lg:grid-cols-2 lg:pt-16">
        <div><span className="inline-flex items-center gap-1.5 rounded-full bg-ai-bg px-3 py-1 text-xs font-medium text-ai"><Sparkles size={13} />Early access</span>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Describe the work.<br /><span className="text-brand">Orbit organizes it.</span></h1>
          <p className="mt-5 max-w-xl text-lg text-sub">Orbit is a team workspace where an AI assistant turns plain-language requests into projects and tasks. You review every change before it happens.</p>
          <div className="mt-8 max-w-xl"><WaitlistForm source={source} /></div></div>
        <div className="card !p-5 shadow-md" aria-label="Example of the approval preview"><p className="text-xs font-medium uppercase tracking-wider text-sub">Example</p>
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">Create 3 tasks for our product launch in Website Redesign</p>
          <div className="mt-3 rounded-lg border border-ai/30 bg-white p-3 text-sm"><p className="flex items-center gap-2 font-medium"><Sparkles size={15} className="text-ai" />Proposed changes <span className="text-xs font-normal text-sub">· nothing happens until you approve</span></p>
            <ul className="mt-2 space-y-1">{["Write launch announcement", "Prepare demo video", "Set up analytics"].map(t => <li key={t} className="rounded bg-emerald-50 px-2 py-1">+ New task: <b>{t}</b></li>)}</ul>
            <div className="mt-3 flex gap-2"><span className="btn pointer-events-none">Approve</span><span className="btn-ghost pointer-events-none">Discard</span></div></div></div></section>
      <section className="border-y border-line bg-white"><div className="mx-auto max-w-6xl px-5 py-16"><h2 className="text-center text-2xl font-bold tracking-tight">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">{steps.map(({ Icon, t, d }, i) => (<div key={t} className="card"><div className="mb-3 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-brand"><Icon size={20} /></div><span className="text-sm font-medium text-sub">Step {i + 1}</span></div>
          <h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-sub">{d}</p></div>))}</div></div></section>
      <section className="mx-auto max-w-6xl px-5 py-16"><h2 className="text-center text-2xl font-bold tracking-tight">Everything your team needs to stay on track</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{features.map(({ Icon, t, d }) => (<div key={t}><div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-brand"><Icon size={20} /></div><h3 className="font-semibold">{t}</h3><p className="mt-1 text-sm text-sub">{d}</p></div>))}</div></section>
      <section className="bg-white"><div className="mx-auto max-w-2xl px-5 py-16 text-center"><h2 className="text-2xl font-bold tracking-tight">Be one of the first to try Orbit</h2>
        <p className="mt-2 text-sub">Join the waitlist and tell us how you manage work today. It helps us build the right things first.</p><div className="mt-6 text-left"><WaitlistForm source={source} /></div></div></section>
    </main>
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-sub"><span>© {new Date().getFullYear()} Orbit Workspace</span><nav className="flex gap-5"><Link href="/privacy" className="hover:text-ink">Privacy</Link><Link href="/terms" className="hover:text-ink">Terms</Link><Link href="/login" className="hover:text-ink">Sign in</Link></nav></footer></div>);
}
