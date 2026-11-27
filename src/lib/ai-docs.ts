import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Rec } from "./ai-tools";

const searchArgs = z.object({ query: z.string().trim().min(2).max(200), limit: z.number().int().min(1).max(10).default(5) });
const readArgs = z.object({ id: z.string().uuid() });
export const docToolDefs = [
  { name: "search_documents", description: "Search the organization's documents (knowledge base) by keywords. Returns matching titles and relevant excerpts. Use read_document to read one in full.",
    parameters: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 10 } }, required: ["query"] } },
  { name: "read_document", description: "Read one document in full (up to 6000 characters). Use an id returned by search_documents.",
    parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
].map(f => ({ type: "function" as const, function: f }));

// Free/small models send null or "" for options they don't use; drop those before validating.
const clean = (v: unknown): unknown => (v && typeof v === "object" && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== null && x !== "" && x !== "null")) : v);
const MAX = 6000;

// Runs as the signed-in user, so Row Level Security decides which documents are visible.
export async function runDocTool(sb: SupabaseClient, name: string, raw: string, recs: Rec[]): Promise<unknown> {
  let json: unknown; try { json = JSON.parse(raw || "{}"); } catch { return { error: "Invalid JSON arguments" }; }
  if (name === "search_documents") {
    const a = searchArgs.safeParse(clean(json));
    if (!a.success) return { error: "Invalid arguments: " + a.error.issues.map(i => `${i.path.join(".") || "args"}: ${i.message}`).join("; ") };
    const { data, error } = await sb.rpc("search_documents", { q: a.data.query, lim: a.data.limit });
    if (error) return { error: "Document search is unavailable right now." };
    const rows = (data ?? []) as { id: string; title: string; snippet: string; updated_at: string }[];
    rows.forEach(d => recs.push({ type: "document", id: d.id, label: d.title, href: `/knowledge/${d.id}` }));
    return rows.length ? { count: rows.length, results: rows.map(d => ({ id: d.id, title: d.title, excerpt: d.snippet, updated_at: d.updated_at })) }
      : { count: 0, note: "No matching documents. Say so; do not guess." };
  }
  if (name === "read_document") {
    const a = readArgs.safeParse(clean(json)); if (!a.success) return { error: "id must be a document id from search_documents" };
    const { data: d } = await sb.from("documents").select("id, title, body, updated_at").eq("id", a.data.id).maybeSingle();
    if (!d) return { error: "Document not found or not accessible" };
    recs.push({ type: "document", id: d.id, label: d.title, href: `/knowledge/${d.id}` });
    return { id: d.id, title: d.title, updated_at: d.updated_at, content: d.body.slice(0, MAX), truncated: d.body.length > MAX };
  }
  return { error: "Unknown tool" };
}