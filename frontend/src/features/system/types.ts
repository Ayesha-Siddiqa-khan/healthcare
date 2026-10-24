export type ServiceState = "healthy" | "unconfigured" | "unavailable" | "unknown";
export type ServiceCheck = { status: ServiceState; message: string };
export type SystemStatus = {
  status: "healthy" | "setup_required" | "degraded" | "unavailable";
  api: ServiceCheck;
  database: ServiceCheck;
  checked_at: string;
};

export const statusLabels: Record<ServiceState, string> = {
  healthy: "Connected", unconfigured: "Setup required", unavailable: "Unavailable", unknown: "Not checked",
};

function isService(value: unknown): value is ServiceCheck {
  if (!value || typeof value !== "object") return false;
  return "status" in value && typeof value.status === "string" &&
    Object.hasOwn(statusLabels, value.status) && "message" in value && typeof value.message === "string";
}

export function isSystemStatus(value: unknown): value is SystemStatus {
  if (!value || typeof value !== "object") return false;
  return "status" in value && typeof value.status === "string" &&
    ["healthy", "setup_required", "degraded", "unavailable"].includes(value.status) &&
    "api" in value && isService(value.api) && "database" in value && isService(value.database) &&
    "checked_at" in value && typeof value.checked_at === "string" && !Number.isNaN(Date.parse(value.checked_at));
}
