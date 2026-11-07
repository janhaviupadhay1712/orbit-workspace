// Shown instantly while the next page loads, so clicking a tab never feels frozen.
export default function Loading() {
  return (<div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
    <div className="h-8 w-56 rounded-lg bg-slate-200" />
    <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-24 rounded-card bg-slate-200/70" />)}</div>
    <div className="h-64 rounded-card bg-slate-200/70" /></div>);
}
