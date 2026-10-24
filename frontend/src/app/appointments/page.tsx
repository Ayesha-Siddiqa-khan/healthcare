import type { Metadata } from "next";
import { AppointmentsPanel } from "@/features/clinic/appointments-panel";

export const metadata: Metadata = { title: "Appointments" };

export default function AppointmentsPage() {
  return <><div className="page-heading"><div><span className="eyebrow">SCHEDULE</span><h1>Appointments</h1><p>Book visits for existing patients and track their status.</p></div></div><AppointmentsPanel /></>;
}
