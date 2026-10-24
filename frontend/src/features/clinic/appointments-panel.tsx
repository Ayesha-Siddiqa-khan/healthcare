"use client";

import { useEffect, useState, type FormEvent } from "react";
import { appointmentStatuses, clinicRequest, errorMessage, type Appointment, type AppointmentStatus, type Patient } from "./api";

const emptyForm = { patientId: "", startsAt: "", visitType: "Consultation" };
type FormState = typeof emptyForm;

function toLocalInput(iso: string) {
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function AppointmentsPanel() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      clinicRequest<Patient[]>("GET", "/patients", undefined, controller.signal),
      clinicRequest<Appointment[]>("GET", "/appointments", undefined, controller.signal),
    ])
      .then(([patientList, appointmentList]) => { setPatients(patientList); setAppointments(appointmentList); setError(null); })
      .catch(caught => { if (!controller.signal.aborted) setError(errorMessage(caught)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [version]);

  function cancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function edit(appointment: Appointment) {
    setEditingId(appointment.id);
    setForm({ patientId: appointment.patient_id, startsAt: toLocalInput(appointment.starts_at), visitType: appointment.visit_type });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      patient_id: form.patientId,
      starts_at: new Date(form.startsAt).toISOString(),
      visit_type: form.visitType,
    };
    try {
      if (editingId) await clinicRequest("PUT", `/appointments/${editingId}`, body);
      else await clinicRequest("POST", "/appointments", body);
      cancel();
      setVersion(value => value + 1);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(appointment: Appointment, status: AppointmentStatus) {
    setError(null);
    try {
      await clinicRequest("PATCH", `/appointments/${appointment.id}/status`, { status });
      setVersion(value => value + 1);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  async function remove(appointment: Appointment) {
    if (!window.confirm(`Delete the appointment for ${appointment.patient_name}?`)) return;
    setError(null);
    try {
      await clinicRequest("DELETE", `/appointments/${appointment.id}`);
      if (editingId === appointment.id) cancel();
      setVersion(value => value + 1);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return <div className="clinic-grid">
    <form className="card clinic-form" onSubmit={save}>
      <h2>{editingId ? "Edit appointment" : "New appointment"}</h2>
      <label>Patient<select required value={form.patientId} onChange={event => setForm({ ...form, patientId: event.target.value })}>
        <option value="" disabled>Select a patient</option>
        {patients.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
      </select></label>
      <label>Date and time<input type="datetime-local" required value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })} /></label>
      <label>Visit type<input required maxLength={80} value={form.visitType} onChange={event => setForm({ ...form, visitType: event.target.value })} /></label>
      {error && <div className="error-notice" role="alert">{error}</div>}
      <div className="clinic-actions">
        <button className="button button-primary" disabled={saving || patients.length === 0}>{saving ? "Saving..." : editingId ? "Save changes" : "Create appointment"}</button>
        {editingId && <button type="button" className="button button-secondary" onClick={cancel}>Cancel</button>}
      </div>
      {patients.length === 0 && !loading && <p className="field-help">Add a patient before booking an appointment.</p>}
    </form>
    <section className="card demo-table-card" aria-labelledby="appointments-heading">
      <div className="clinic-section-head"><h2 id="appointments-heading">Appointments</h2></div>
      <div className="clinic-table-body">
        {loading ? <p role="status">Loading appointments...</p> : appointments.length === 0 ? <p>No appointments yet.</p> : <div className="demo-table-scroll"><table>
          <thead><tr><th scope="col">Patient</th><th scope="col">Date and time</th><th scope="col">Visit</th><th scope="col">Status</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>{appointments.map(appointment => <tr key={appointment.id}>
            <td><strong>{appointment.patient_name}</strong></td>
            <td><time dateTime={appointment.starts_at}>{new Date(appointment.starts_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></td>
            <td>{appointment.visit_type}</td>
            <td><select className="clinic-row-select" aria-label={`Status for ${appointment.patient_name}`} value={appointment.status} onChange={event => changeStatus(appointment, event.target.value as AppointmentStatus)}>
              {appointmentStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select></td>
            <td><div className="clinic-actions">
              <button className="button button-secondary button-small" onClick={() => edit(appointment)}>Edit</button>
              <button className="button button-secondary button-small" onClick={() => remove(appointment)}>Delete</button>
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </section>
  </div>;
}
