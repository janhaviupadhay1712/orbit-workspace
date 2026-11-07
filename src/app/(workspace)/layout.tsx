import { cookies } from "next/headers";
import { getContext } from "@/lib/context";
import AppFrame from "@/components/app-frame";
import { createOrg, signOut } from "./actions";
export default async function Shell({ children }: { children: React.ReactNode }) {
  const c = await getContext();
  if (!c.orgId) return (<main className="grid min-h-screen place-items-center p-4"><form action={createOrg} className="card w-full max-w-sm space-y-4">
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white">O</div>
    <div><h1 className="text-xl font-semibold">Create your organization</h1><p className="mt-1 text-sm text-sub">This is your team’s workspace. You’ll be its owner.</p></div>
    <input name="name" required maxLength={120} className="input" placeholder="Acme Inc." /><button className="btn w-full">Create organization</button></form></main>);
  const hidden = (await cookies()).get("orbit_sidebar")?.value === "hidden";
  return (<AppFrame initialOpen={!hidden} orgName={c.orgName ?? ""} email={c.user.email ?? ""} displayName={c.displayName} avatarUrl={c.avatarUrl} signOut={signOut}>{children}</AppFrame>);
}