"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { joinWaitlist, type WaitlistState } from "./actions";
const OPTIONS = ["Spreadsheets or notes", "Trello, Asana or ClickUp", "Notion", "WhatsApp or paper", "Nothing yet"];
export default function WaitlistForm({ source }: { source: string }) {
  const [state, action, pending] = useActionState<WaitlistState, FormData>(joinWaitlist, null);
  if (state?.ok) return (<p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-ok"><Check size={18} />{state.message}</p>);
  return (<form action={action} className="space-y-3">
    <input type="hidden" name="source" value={source} />
    <div aria-hidden="true" className="hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@company.com" aria-label="Email address" className="input !py-3 sm:flex-1" />
      <button className="btn !py-3 sm:shrink-0" disabled={pending}>{pending ? "Joining…" : "Get early access"}</button></div>
    <select name="use_case" defaultValue="" aria-label="What do you use for tasks today?" className="input text-sub"><option value="">What do you use for tasks today? (optional)</option>{OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select>
    {state && !state.ok && <p role="alert" className="text-sm text-err">{state.message}</p>}
    <p className="text-xs text-sub">Free to join. We’ll only use your email to tell you about Orbit. See our <Link href="/privacy" className="underline">Privacy Policy</Link>.</p></form>);
}