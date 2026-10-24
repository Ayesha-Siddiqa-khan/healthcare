import type { Metadata } from "next";
import { PatientsPanel } from "@/features/clinic/patients-panel";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  return <><div className="page-heading"><div><span className="eyebrow">CARE RECORDS</span><h1>Patients</h1><p>Add, search, edit and remove patient records.</p></div></div><PatientsPanel /></>;
}
