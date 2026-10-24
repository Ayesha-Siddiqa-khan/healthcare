import { isSystemStatus, type SystemStatus } from "@/features/system/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = { "Cache-Control": "no-store" };
  try {
    const base = process.env.API_BASE_URL || "http://127.0.0.1:8000";
    const response = await fetch(`${base.replace(/\/$/, "")}/api/v1/system/status`, {
      cache: "no-store", signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Backend unavailable");
    const data: unknown = await response.json();
    if (!isSystemStatus(data)) throw new Error("Invalid backend response");
    return Response.json(data, { headers });
  } catch {
    const data: SystemStatus = {
      status: "unavailable",
      api: { status: "unavailable", message: "Cannot reach FastAPI. Start the backend and check API_BASE_URL." },
      database: { status: "unknown", message: "Database status needs a working API connection." },
      checked_at: new Date().toISOString(),
    };
    return Response.json(data, { status: 503, headers });
  }
}
