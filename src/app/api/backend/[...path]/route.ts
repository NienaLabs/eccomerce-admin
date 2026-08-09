// Same-origin proxy for the admin API.
//
// Client components call `/api/backend/<path>` instead of hitting the backend
// directly. This route runs on the server, reads the httpOnly `admin_token`
// cookie, and injects the Authorization header — so the bearer token is NEVER
// serialized into the client bundle or readable by browser JS (the previous
// approach passed the raw token as a prop into client components).
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api";

async function forward(req: NextRequest, path: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const search = req.nextUrl.search; // preserve query string
  const target = `${API_BASE_URL}/${path.join("/")}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const method = req.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  const res = await fetch(target, {
    method,
    headers,
    body: hasBody ? await req.text() : undefined,
    cache: "no-store",
  });

  // Pass the backend response straight through.
  const body = await res.arrayBuffer();
  const resHeaders = new Headers();
  const resContentType = res.headers.get("content-type");
  if (resContentType) resHeaders.set("content-type", resContentType);
  return new NextResponse(body, { status: res.status, headers: resHeaders });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
