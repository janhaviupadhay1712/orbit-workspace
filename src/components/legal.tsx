import { legal } from "@/lib/legal";
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (<article><h1 className="text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-sub">Last updated: {legal.updated}</p>
    {legal.isDraft && <p role="note" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Draft: this document has not been reviewed by a lawyer. Replace every [bracketed] placeholder in <code>src/lib/legal.ts</code> and set <code>isDraft</code> to false before launch.</p>}
    <div className="mt-8 space-y-4 text-[15px] leading-7">{children}</div></article>);
}
export const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="pt-4 text-lg font-semibold">{children}</h2>;
export const Ul = ({ children }: { children: React.ReactNode }) => <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
