import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: { colors: {
  bg: "#F8FAFC", ink: "#172033", sub: "#64748B", line: "#E2E8F0", brand: "#4F46E5", "brand-hover": "#4338CA",
  ai: "#8B5CF6", "ai-bg": "#F5F3FF", muted: "#F1F5F9", ok: "#16A34A", warn: "#D97706", err: "#DC2626" },
  borderRadius: { card: "12px" } } }, plugins: [] } satisfies Config;
