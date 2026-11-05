"use client";
import { useEffect, useState } from "react";
import { Layers, MessageSquare, Users, BarChart3, Sparkles, ShieldCheck, Mail, Lock, Eye, EyeOff, Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const features = [
  { Icon: Layers, label: "Projects & Tasks" }, { Icon: MessageSquare, label: "Comments & Collaboration" },
  { Icon: Users, label: "Invitations & Roles" }, { Icon: BarChart3, label: "Reports & Insights" },
  { Icon: Sparkles, label: "AI Assistant (Plan, Analyze, Ask)" }];

const GoogleIcon = () => (<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>);
function Logo({ dark }: { dark?: boolean }) {
  return (<div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">O</div>
    <span className={`text-xl ${dark ? "text-white" : "text-ink"}`}><b className="font-bold">Orbit</b> Workspace</span></div>);
}

export default function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => { if (new URLSearchParams(location.search).get("error") === "oauth") setMsg({ text: "Social sign-in failed. Please try again or use email.", ok: false }); }, []);
  async function oauth(provider: "google" | "github") {
    setMsg(null); setBusy(true);
    const next = new URLSearchParams(location.search).get("next") ?? "/";
    const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    if (error) { setBusy(false); setMsg({ text: error.message, ok: false }); } // on success the browser is redirected to the provider
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    setBusy(true); setMsg(null); const sb = createClient();
    const cred = { email: String(f.get("email")).trim(), password: String(f.get("password")) };
    const { data, error } = mode === "in" ? await sb.auth.signInWithPassword(cred) : await sb.auth.signUp(cred);
    setBusy(false);
    if (error) return setMsg({ text: error.message, ok: false });
    if (mode === "up" && !data.session) return setMsg({ text: "Account created. Check your email to confirm it, then sign in.", ok: true });
    const next = new URLSearchParams(location.search).get("next");
    location.href = next && /^\/(?!\/)/.test(next) ? next : "/";
  }

  return (<main className="min-h-screen lg:flex">
    {/* Left: brand panel (desktop only) */}
    <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#150d2e] via-[#2a1659] to-[#4b2b9c] p-12 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -bottom-80 -left-32 h-[600px] w-[1000px] rounded-[50%] bg-gradient-to-t from-violet-500/50 via-violet-500/20 to-transparent ring-1 ring-violet-300/30" />
      <div className="relative"><Logo dark /></div>
      <div className="relative max-w-xl">
        <h2 className="text-5xl font-bold leading-tight tracking-tight">Your Team’s <span className="text-violet-300">AI-Powered</span> Workspace</h2>
        <p className="mt-5 text-lg text-violet-100/80">Manage projects, tasks, collaborate, and get AI assistance — all in one secure, multi-tenant workspace.</p>
        <ul className="mt-10 grid grid-cols-5 gap-3">{features.map(({ Icon, label }) => (<li key={label} className="flex flex-col items-center gap-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15"><Icon size={22} className="text-violet-200" /></span>
          <span className="text-xs leading-snug text-violet-100/90">{label}</span></li>))}</ul></div>
      <div className="relative flex max-w-md items-start gap-4 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 backdrop-blur-sm">
        <ShieldCheck size={26} className="mt-0.5 shrink-0 text-violet-200" />
        <div><p className="font-semibold">Enterprise-grade Security</p><p className="mt-1 text-sm text-violet-100/80">Your organization’s data stays private with database-level security.</p></div></div>
    </section>

    {/* Right: form */}
    <section className="grid min-h-screen flex-1 place-items-center bg-white p-6 lg:min-h-0">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center"><Logo /></div>
        <h1 className="text-3xl font-bold tracking-tight">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-sub">{mode === "in" ? "Sign in to your workspace" : "Then set up your organization in a minute"}</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="relative"><Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="email" type="email" required autoComplete="email" placeholder="Enter your email" aria-label="Email" className="input !py-3 !pl-11" /></div>
          <div className="relative"><Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input name="password" type={show ? "text" : "password"} required minLength={8} autoComplete={mode === "in" ? "current-password" : "new-password"}
              placeholder="Enter your password" aria-label="Password" className="input !py-3 !pl-11 !pr-11" />
            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-ink">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
          {mode === "up" && <p className="text-xs text-sub">Use at least 8 characters.</p>}
          <div aria-live="polite">{msg && <p role="alert" className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-ok" : "bg-red-50 text-err"}`}>{msg.text}</p>}</div>
          <button className="btn w-full !py-3 text-base" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign In" : "Create account"}</button>
        </form>
        <div className="my-6 flex items-center gap-3 text-xs text-sub"><span className="h-px flex-1 bg-line" />or continue with<span className="h-px flex-1 bg-line" /></div>
        <div className="space-y-3">
          <button type="button" disabled={busy} onClick={() => oauth("google")} className="btn-ghost w-full !py-3 disabled:opacity-50"><GoogleIcon />Continue with Google</button>
          <button type="button" disabled={busy} onClick={() => oauth("github")} className="btn-ghost w-full !py-3 disabled:opacity-50"><Github size={18} />Continue with GitHub</button></div>
        <p className="mt-8 text-center text-sm text-sub">{mode === "in" ? "Don’t have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { setMode(m => (m === "in" ? "up" : "in")); setMsg(null); }} className="font-semibold text-brand hover:underline">
            {mode === "in" ? "Create an account" : "Sign in"}</button></p>
      </div>
    </section>
  </main>);
}