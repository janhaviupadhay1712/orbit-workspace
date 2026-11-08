import Link from "next/link";
import ForgotForm from "./forgot-form";
export default async function Forgot({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const expired = (await searchParams).expired;
  return (<main className="grid min-h-screen place-items-center bg-bg p-4"><div className="card w-full max-w-sm space-y-4 !p-7 shadow-md">
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">O</div>
    <div><h1 className="text-xl font-semibold tracking-tight">Reset your password</h1><p className="mt-1 text-sm text-sub">Enter your email and we’ll send you a link to choose a new password.</p></div>
    {expired && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-err">That reset link is invalid or has expired. Request a new one, and open it in the same browser you request it from.</p>}
    <ForgotForm /><p className="text-center text-sm text-sub"><Link href="/login" className="font-medium text-brand hover:underline">Back to sign in</Link></p></div></main>);
}