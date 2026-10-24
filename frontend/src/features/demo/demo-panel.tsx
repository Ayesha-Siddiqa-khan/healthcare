"use client";

import { useEffect, useRef, useState } from "react";
import { demoErrors, isDemoErrorCode, isDemoOverview, type DemoOverview } from "./types";

type State = { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "ready"; data: DemoOverview };
const formatTime = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Karachi",
});

export function DemoPanel() {
  const [state, setState] = useState<State>({ status: "idle" });
  const activeRequest = useRef<AbortController | null>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  async function load() {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setState({ status: "loading" });
    try {
      const response = await fetch("/api/demo", { cache: "no-store", signal: controller.signal });
      const data: unknown = await response.json();
      if (controller.signal.aborted) return;
      if (response.ok && isDemoOverview(data)) {
        setState({ status: "ready", data });
      } else {
        const code = data && typeof data === "object" && "code" in data && isDemoErrorCode(data.code) ? data.code : "data_invalid";
        setState({ status: "error", message: demoErrors[code] });
      }
    } catch {
      if (!controller.signal.aborted) setState({ status: "error", message: demoErrors.backend_unavailable });
    }
  }

  return <section className="demo-section" aria-labelledby="demo-heading" aria-busy={state.status === "loading"}>
    <div className="section-heading">
      <div><span className="eyebrow">SYNTHETIC DATA ONLY</span><h2 id="demo-heading">Your practice clinic</h2><p>Load patients, clinicians and appointments stored in your configured Supabase database.</p></div>
      <button className="button button-secondary button-small" onClick={load} disabled={state.status === "loading"}>
        {state.status === "loading" ? "Loading..." : state.status === "ready" ? "Refresh demo data" : "Load demo data"}
      </button>
    </div>
    {state.status === "idle" && <div className="card demo-notice"><h3>Check the complete data path</h3><p>Use the button to request synthetic records through Next.js and FastAPI. No sample records are hardcoded into this page.</p></div>}
    {state.status === "loading" && <p role="status">Reading the configured demo database...</p>}
    {state.status === "error" && <div className="error-notice" role="alert">{state.message}</div>}
    {state.status === "ready" && <>
      <div className="demo-counts">
        <div className="card"><span>Loaded patients</span><strong>{state.data.patients.length}</strong></div>
        <div className="card"><span>Loaded clinicians</span><strong>{state.data.clinicians.length}</strong></div>
        <div className="card"><span>Loaded appointments</span><strong>{state.data.appointments.length}</strong></div>
      </div>
      <div className="card demo-table-card"><h3>Practice patients</h3>
        {state.data.patients.length === 0 ? <p>No synthetic patients were returned. Check the seed and database read permissions.</p> : <div className="demo-table-scroll"><table><caption className="demo-caption">Synthetic patient records</caption><thead><tr><th scope="col">Patient</th><th scope="col">Age</th><th scope="col">Care status</th></tr></thead><tbody>{state.data.patients.map(patient => <tr key={patient.id}><td><strong>{patient.display_name}</strong><span className="demo-id">{patient.id}</span></td><td>{patient.age}</td><td>{patient.care_status.replaceAll("_", " ")}</td></tr>)}</tbody></table></div>}
      </div>
      <div className="card demo-table-card"><h3>Practice appointments</h3>
        {state.data.appointments.length === 0 ? <p>No synthetic appointments were returned.</p> : <div className="demo-table-scroll"><table><caption className="demo-caption">Synthetic appointments - Asia/Karachi time</caption><thead><tr><th scope="col">Patient</th><th scope="col">Clinician</th><th scope="col">Appointment time</th><th scope="col">Visit</th><th scope="col">Status</th></tr></thead><tbody>{state.data.appointments.map(appointment => <tr key={appointment.id}><td>{appointment.patient_name}</td><td>{appointment.clinician_name}</td><td><time dateTime={appointment.starts_at}>{formatTime.format(new Date(appointment.starts_at))}</time></td><td>{appointment.visit_type}</td><td>{appointment.status}</td></tr>)}</tbody></table></div>}
      </div>
      <p className="demo-footnote" role="status">Database response received {formatTime.format(new Date(state.data.fetched_at))} (Asia/Karachi). Up to 100 rows per list. This confirms reads, not migration or write permissions.</p>
    </>}
  </section>;
}
