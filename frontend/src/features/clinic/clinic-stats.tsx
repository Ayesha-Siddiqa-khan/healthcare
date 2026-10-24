"use client";

import { useEffect, useState } from "react";
import { clinicRequest, errorMessage, type ClinicStats } from "./api";

export function ClinicStatsPanel() {
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    clinicRequest<ClinicStats>("GET", "/stats", undefined, controller.signal)
      .then(setStats)
      .catch(caught => { if (!controller.signal.aborted) setError(errorMessage(caught)); });
    return () => controller.abort();
  }, []);

  if (error) return <div className="error-notice" role="alert">{error}</div>;
  if (!stats) return <p role="status">Loading clinic counts...</p>;
  return <section className="demo-counts" aria-label="Clinic counts">
    <div className="card"><span>Patients</span><strong>{stats.patients}</strong></div>
    <div className="card"><span>Appointments</span><strong>{stats.appointments}</strong></div>
    <div className="card"><span>Scheduled</span><strong>{stats.scheduled}</strong></div>
  </section>;
}
