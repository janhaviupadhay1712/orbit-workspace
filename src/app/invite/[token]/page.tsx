import { acceptInvite } from "../../(workspace)/actions";
export default async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (<main className="min-h-screen grid place-items-center p-4"><form action={acceptInvite} className="card w-full max-w-sm space-y-3">
    <h1 className="text-xl font-semibold">Join workspace</h1>
    <p className="text-sm text-sub">Accept this invitation with the account it was sent to. If you’re signed in with a different email, it will be rejected.</p>
    <input type="hidden" name="token" value={token} /><button className="btn">Accept invitation</button></form></main>);
}
