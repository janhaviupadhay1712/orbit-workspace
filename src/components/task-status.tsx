"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTaskStatus } from "@/app/(workspace)/actions";
import { StatusBadge, label } from "@/components/ui";
import { STATUSES } from "@/lib/schemas";

// Changing the dropdown saves immediately: the badge updates at once (optimistic), the page data is refreshed
// when the server confirms, and the change is rolled back with a message if saving fails.
export default function TaskStatus({ id, status, showBadge = true }: { id: string; status: string; showBadge?: boolean }) {
  const router = useRouter(); const [pending, start] = useTransition();
  const [value, setValue] = useState(status); const [err, setErr] = useState("");
  useEffect(() => setValue(status), [status]); // follow the server value after a refresh
  function change(next: string) {
    const prev = value; setValue(next); setErr("");
    start(async () => {
      try { await setTaskStatus(id, next); router.refresh(); }
      catch { setValue(prev); setErr("Couldn’t save. Please try again."); }
    });
  }
  return (<div className="flex flex-wrap items-center gap-2">
    {showBadge && <StatusBadge s={value} />}
    <select value={value} onChange={e => change(e.target.value)} disabled={pending} aria-label="Change status" className="input !w-32 !py-1 text-xs">
      {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
    {pending && <span className="text-xs text-sub" role="status">Saving…</span>}
    {err && <span className="text-xs text-err" role="alert">{err}</span>}</div>);
}