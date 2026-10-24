export type Gender = "Female" | "Male" | "Other";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";
export type Patient = { id: string; name: string; age: number; gender: Gender; phone: string };
export type Appointment = {
  id: string; patient_id: string; patient_name: string; starts_at: string;
  visit_type: string; status: AppointmentStatus;
};
export type ClinicStats = { patients: number; appointments: number; scheduled: number };

export const appointmentStatuses: AppointmentStatus[] = ["scheduled", "completed", "cancelled"];

const clinicErrors: Record<string, string> = {
  database_unconfigured: "Supabase is not configured. Add SUPABASE_DB_URL to backend/.env, then restart the backend.",
  migration_required: "The clinic tables are missing. Run backend/sql/clinic_schema.sql in Supabase.",
  database_unavailable: "The database could not be reached. Try again shortly.",
  backend_unavailable: "The API is unavailable. Start the backend and try again.",
  patient_not_found: "This patient no longer exists. Refresh the list.",
  appointment_not_found: "This appointment no longer exists. Refresh the list.",
  request_failed: "The request was rejected. Check the form fields and try again.",
};

function apiErrorMessage(status: number, data: unknown): string {
  const detail = data && typeof data === "object" && "detail" in data ? data.detail : undefined;
  if (detail && typeof detail === "object" && !Array.isArray(detail) && "code" in detail) {
    const code = String(detail.code);
    return clinicErrors[code] ?? `${clinicErrors.request_failed} (${code})`;
  }
  if (Array.isArray(detail)) {
    return detail.map(item => `${String(item.loc?.at(-1))}: ${item.msg}`).join(". ");
  }
  if (status === 404) return "The API route was not found. Restart the backend so the clinic routes load.";
  if (typeof detail === "string") return `${clinicErrors.request_failed} (${detail})`;
  return `${clinicErrors.request_failed} (HTTP ${status})`;
}

export function errorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : "Something went wrong.";
}

export async function clinicRequest<T = unknown>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/clinic${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal,
  });
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(apiErrorMessage(response.status, data));
  return data as T;
}
