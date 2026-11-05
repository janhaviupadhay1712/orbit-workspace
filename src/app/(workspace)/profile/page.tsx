import { getContext } from "@/lib/context";
import { PageHeader } from "@/components/ui";
import { updateProfile, changePassword, uploadAvatar, removeAvatar } from "../actions";
const OK: Record<string, string> = { profile: "Profile updated.", password: "Password changed.", photo: "Photo updated.", photo_removed: "Photo removed." };
const ERR: Record<string, string> = { name: "Name must be 1–80 characters.", save: "Could not save your profile. Make sure migrations 0005 and 0006 have been run.",
  short: "Password must be at least 8 characters.", mismatch: "The two passwords don’t match.", password: "Could not change the password. Try signing in again first.",
  photo_missing: "Choose an image first.", photo_size: "That image is larger than 2 MB.", photo_type: "Only real PNG, JPG or WebP images are allowed.",
  photo_upload: "Upload failed. Make sure migration 0006 has been run." };
export default async function Profile({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const q = await searchParams; const c = await getContext();
  const providers = (c.user.app_metadata?.providers as string[] | undefined) ?? [c.user.app_metadata?.provider as string];
  const hasPassword = providers.includes("email");
  const initials = c.displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (<div className="max-w-2xl"><PageHeader title="Profile" description="How you appear to your teammates." />
    {q.saved && OK[q.saved] && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-ok">{OK[q.saved]}</p>}
    {q.error && ERR[q.error] && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-err">{ERR[q.error]}</p>}
    <section className="card space-y-5"><div className="flex items-center gap-4">
        {c.avatarUrl ? <img src={c.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-20 w-20 rounded-full object-cover" />
          : <div className="grid h-20 w-20 place-items-center rounded-full bg-indigo-100 text-2xl font-semibold text-brand">{initials}</div>}
        <div><p className="font-semibold">{c.displayName}</p><p className="text-sm text-sub">{c.orgName} · {c.role}</p></div></div>
      <div className="space-y-2 border-t border-line pt-4"><p className="text-sm font-medium">Profile photo</p>
        <form action={uploadAvatar} encType="multipart/form-data" className="flex flex-wrap items-center gap-3">
          <input type="file" name="photo" accept="image/png,image/jpeg,image/webp" required className="text-sm text-sub file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand hover:file:bg-indigo-100" />
          <button className="btn">Upload photo</button></form>
        <div className="flex items-center gap-3"><p className="text-xs text-sub">JPG, PNG or WebP, up to 2 MB.</p>
          {c.avatarUrl && <form action={removeAvatar}><button className="text-xs font-medium text-err hover:underline">Remove photo</button></form>}</div></div>
      <form action={updateProfile} className="space-y-4 border-t border-line pt-4">
        <label className="block text-sm font-medium">Display name<input name="full_name" required maxLength={80} defaultValue={c.displayName} className="input mt-1.5 font-normal" /></label>
        <label className="block text-sm font-medium">Email<input value={c.user.email ?? ""} readOnly disabled className="input mt-1.5 bg-muted font-normal text-sub" /></label>
        <button className="btn">Save profile</button></form></section>
    <section className="card mt-6 space-y-4"><h2 className="font-semibold">Password</h2>
      {hasPassword ? <form action={changePassword} className="space-y-4">
        <label className="block text-sm font-medium">New password<input name="password" type="password" required minLength={8} autoComplete="new-password" className="input mt-1.5 font-normal" /></label>
        <label className="block text-sm font-medium">Confirm new password<input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input mt-1.5 font-normal" /></label>
        <button className="btn">Change password</button></form>
        : <p className="text-sm text-sub">You sign in with {providers.filter(Boolean).join(", ") || "a social account"}, so your password is managed there.</p>}</section></div>);
}