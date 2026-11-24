import { Fragment } from "react";
// A small, safe renderer for the formatting AI answers use: **bold**, `code`, [links](https://...), headings,
// bullet and numbered lists, and code fences. It builds React elements only and never injects raw HTML.
function inline(text: string, key: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g).map((part, i) => {
    const k = `${key}-${i}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={k} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(part)) return <code key={k} className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) return <a key={k} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-brand underline">{link[1]}</a>;
    return <Fragment key={k}>{part}</Fragment>;
  });
}
export default function Markdown({ text }: { text: string }) {
  const out: React.ReactNode[] = []; const lines = text.split("\n"); let i = 0;
  const ul = /^\s*[-*•]\s+(.*)$/, ol = /^\s*\d+[.)]\s+(.*)$/;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) { // code fence
      const code: string[] = []; i++; while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]); i++;
      out.push(<pre key={`p${i}`} className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-[13px] text-slate-100"><code>{code.join("\n")}</code></pre>); continue;
    }
    if (ul.test(line) || ol.test(line)) {
      const ordered = ol.test(line) && !ul.test(line); const re = ordered ? ol : ul; const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, "$1"));
      const Tag = ordered ? "ol" : "ul";
      out.push(<Tag key={`l${i}`} className={`${ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>{items.map((t, j) => <li key={j}>{inline(t, `li${i}-${j}`)}</li>)}</Tag>); continue;
    }
    const h = line.match(/^#{1,4}\s+(.*)$/);
    if (h) { out.push(<p key={`h${i}`} className="pt-1 font-semibold">{inline(h[1], `h${i}`)}</p>); i++; continue; }
    if (!line.trim()) { i++; continue; }
    out.push(<p key={`t${i}`}>{inline(line, `t${i}`)}</p>); i++;
  }
  return <div className="space-y-2.5 text-[15px] leading-7 text-ink">{out}</div>;
}