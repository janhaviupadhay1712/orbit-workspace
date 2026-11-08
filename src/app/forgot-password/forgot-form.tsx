"use client";
import { useActionState } from "react";
import { Check } from "lucide-react";
import { requestPasswordReset, type ResetState } from "./actions";
export default function ForgotForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, null);
  if (state?.ok) return (<p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-ok"><Check size={18} className="mt-0.5 shrink-0" />{state.message}</p>);
  return (<form action={action} className="space-y-4">
    <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Enter your email" aria-label="Email" className="input !py-3" />
    {state && !state.ok && <p role="alert" className="text-sm text-err">{state.message}</p>}
    <button className="btn w-full !py-3" disabled={pending}>{pending ? "Sending…" : "Send reset link"}</button></form>);
}