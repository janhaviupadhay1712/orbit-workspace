import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setNewPassword } from "./actions";
const ERR: Record<string, string> = { short: "Password must be at least 8 characters.", mismatch: "The two passwords don’t match.", failed: "Could not update the password. Request a new reset link and try again." };
export default async function ResetPassword({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/forgot-password?expired=1"); // no valid reset session: the link was expired or opened in a different browser
  return (<main className="grid min-h-screen place-items-center bg-bg p-4"><form action={setNewPassword} className="card w-full max-w-sm space-y-4 !p-7 shadow-md">
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">O</div>
    <div><h1 className="text-xl font-semibold tracking-tight">Choose a new password</h1><p className="mt-1 text-sm text-sub">Signed in as {user.email}</p></div>
    {error && ERR[error] && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-err">{ERR[error]}</p>}
    <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="New password (8+ characters)" aria-label="New password" className="input !py-3" />
    <input name="confirm" type="password" required minLength={8} autoComplete="new-password" placeholder="Confirm new password" aria-label="Confirm new password" className="input !py-3" />
    <button className="btn w-full !py-3">Update password</button></form></main>);
}