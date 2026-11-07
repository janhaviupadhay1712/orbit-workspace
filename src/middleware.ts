import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
// Fast gate: checks the session cookie locally (refreshing it when expired) instead of calling Supabase Auth on every navigation.
// This is only a redirect convenience. Every page, server action and API route still verifies the user with auth.getUser(), and the database enforces RLS.
export async function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (p.startsWith("/login") || p.startsWith("/auth/") || p.startsWith("/welcome")) return NextResponse.next(); // public: sign-in, OAuth callback, landing page
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: (list: { name: string; value: string; options?: any }[]) => {
      list.forEach(({ name, value }) => req.cookies.set(name, value));
      res = NextResponse.next({ request: req });
      list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)); } } });
  const { data: { session } } = await sb.auth.getSession();
  // Visitors who aren't signed in see the landing page at "/", and the sign-in page everywhere else.
  if (!session) return NextResponse.redirect(new URL(p === "/" ? "/welcome" : "/login?next=" + encodeURIComponent(p), req.url));
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"] };
