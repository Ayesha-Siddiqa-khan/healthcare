export type DemoPatient = {
  id: string; display_name: string; age: number; care_status: "stable" | "follow_up" | "new";
};
export type DemoClinician = { id: string; display_name: string; specialty: string };
export type DemoAppointment = {
  id: string; patient_name: string; clinician_name: string; starts_at: string;
  visit_type: string; status: "scheduled" | "completed" | "cancelled";
};
export type DemoOverview = {
  source: "supabase_postgres"; fetched_at: string;
  patients: DemoPatient[]; clinicians: DemoClinician[]; appointments: DemoAppointment[];
};

export const demoErrors = {
  demo_disabled: "The database demo is not enabled. Apply the reviewed demo setup, configure the backend, then set DEMO_ENABLED=true and restart the backend.",
  database_unconfigured: "Supabase is not configured. Add SUPABASE_DB_URL to backend/.env, then restart the backend.",
  migration_required: "The synthetic demo tables are missing. The reviewed demo setup has not been applied to this database.",
  database_unavailable: "The database could not be read. Check its availability and the backend connection permissions.",
  data_invalid: "The database returned an unexpected demo-data format.",
  backend_unavailable: "The demo API is unavailable. Restart the backend to load the new endpoint, then try again.",
} as const;
export type DemoErrorCode = keyof typeof demoErrors;

export function isDemoErrorCode(value: unknown): value is DemoErrorCode {
  return typeof value === "string" && Object.hasOwn(demoErrors, value);
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function timestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}
function patient(value: unknown): value is DemoPatient {
  return object(value) && typeof value.id === "string" && typeof value.display_name === "string" &&
    typeof value.age === "number" && Number.isInteger(value.age) && value.age >= 0 && value.age <= 120 &&
    typeof value.care_status === "string" && ["stable", "follow_up", "new"].includes(value.care_status);
}
function clinician(value: unknown): value is DemoClinician {
  return object(value) && typeof value.id === "string" && typeof value.display_name === "string" && typeof value.specialty === "string";
}
function appointment(value: unknown): value is DemoAppointment {
  return object(value) && typeof value.id === "string" && typeof value.patient_name === "string" &&
    typeof value.clinician_name === "string" && timestamp(value.starts_at) && typeof value.visit_type === "string" &&
    typeof value.status === "string" && ["scheduled", "completed", "cancelled"].includes(value.status);
}
export function isDemoOverview(value: unknown): value is DemoOverview {
  return object(value) && value.source === "supabase_postgres" && timestamp(value.fetched_at) &&
    Array.isArray(value.patients) && value.patients.length <= 100 && value.patients.every(patient) &&
    Array.isArray(value.clinicians) && value.clinicians.length <= 100 && value.clinicians.every(clinician) &&
    Array.isArray(value.appointments) && value.appointments.length <= 100 && value.appointments.every(appointment);
}
