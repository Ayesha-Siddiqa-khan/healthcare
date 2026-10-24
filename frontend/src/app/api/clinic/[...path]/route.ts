export const dynamic = "force-dynamic";

async function proxy(request: Request, ctx: RouteContext<"/api/clinic/[...path]">) {
  const { path } = await ctx.params;
  const headers = { "Cache-Control": "no-store" };
  const base = process.env.API_BASE_URL || "http://127.0.0.1:8000";
  const target = `${base.replace(/\/$/, "")}/api/v1/clinic/${path.map(encodeURIComponent).join("/")}${new URL(request.url).search}`;
  try {
    const response = await fetch(target, {
      method: request.method,
      headers: { "Content-Type": "application/json" },
      body: request.method === "GET" || request.method === "DELETE" ? undefined : await request.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 204) return new Response(null, { status: 204, headers });
    return new Response(await response.text(), {
      status: response.status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch {
    return Response.json({ detail: { code: "backend_unavailable" } }, { status: 503, headers });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
