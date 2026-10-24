import { isDemoErrorCode, isDemoOverview, type DemoErrorCode } from "@/features/demo/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  let code: DemoErrorCode = "backend_unavailable";
  try {
    const base = process.env.API_BASE_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/demo/overview`, {
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    const data: unknown = await response.json();
    if (response.ok) {
      if (isDemoOverview(data)) return Response.json(data, { headers });
      code = "data_invalid";
    } else if (data && typeof data === "object" && "detail" in data && data.detail && typeof data.detail === "object" && "code" in data.detail && isDemoErrorCode(data.detail.code)) {
      code = data.detail.code;
    }
  } catch {
    // A stable code prevents backend details or credentials reaching the browser.
  }
  return Response.json({ code }, { status: 503, headers });
}
