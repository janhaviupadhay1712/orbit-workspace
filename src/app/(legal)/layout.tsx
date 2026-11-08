import Link from "next/link";
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (<div className="min-h-screen bg-bg"><header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
      <Link href="/welcome" className="flex items-center gap-2.5"><div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-base font-bold text-white">O</div><span className="text-lg"><b className="font-bold">Orbit</b> Workspace</span></Link>
      <Link href="/login" className="btn-ghost">Sign in</Link></header>
    <main className="mx-auto max-w-3xl px-5 pb-16"><div className="card !p-6 sm:!p-10">{children}</div></main>
    <footer className="mx-auto flex max-w-3xl gap-5 px-5 pb-10 text-sm text-sub"><Link href="/privacy" className="hover:text-ink">Privacy</Link><Link href="/terms" className="hover:text-ink">Terms</Link></footer></div>);
}
