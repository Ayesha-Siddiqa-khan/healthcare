"use client";

import { useEffect, useState, type FormEvent } from "react";
import { clinicRequest, errorMessage, type Gender, type Patient } from "./api";

const genders: Gender[] = ["Female", "Male", "Other"];
const emptyForm = { name: "", age: "", gender: "Female" as Gender, phone: "" };
type FormState = typeof emptyForm;

export function PatientsPanel() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    clinicRequest<Patient[]>("GET", `/patients${query}`, undefined, controller.signal)
      .then(data => { setPatients(data); setError(null); })
      .catch(caught => { if (!controller.signal.aborted) setError(errorMessage(caught)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, version]);

  function cancel() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function edit(patient: Patient) {
    setEditingId(patient.id);
    setForm({ name: patient.name, age: String(patient.age), gender: patient.gender, phone: patient.phone });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const body = { name: form.name, age: Number(form.age), gender: form.gender, phone: form.phone };
    try {
      if (editingId) await clinicRequest("PUT", `/patients/${editingId}`, body);
      else await clinicRequest("POST", "/patients", body);
      cancel();
      setVersion(value => value + 1);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function remove(patient: Patient) {
    if (!window.confirm(`Delete ${patient.name} and all of their appointments?`)) return;
    setError(null);
    try {
      await clinicRequest("DELETE", `/patients/${patient.id}`);
      if (editingId === patient.id) cancel();
      setVersion(value => value + 1);
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }

  return <div className="clinic-grid">
    <form className="card clinic-form" onSubmit={save}>
      <h2>{editingId ? "Edit patient" : "Add patient"}</h2>
      <label>Name<input required maxLength={120} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
      <label>Age<input type="number" required min={0} max={120} value={form.age} onChange={event => setForm({ ...form, age: event.target.value })} /></label>
      <label>Gender<select value={form.gender} onChange={event => setForm({ ...form, gender: event.target.value as Gender })}>{genders.map(gender => <option key={gender} value={gender}>{gender}</option>)}</select></label>
      <label>Phone<input required maxLength={30} value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} /></label>
      {error && <div className="error-notice" role="alert">{error}</div>}
      <div className="clinic-actions">
        <button className="button button-primary" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add patient"}</button>
        {editingId && <button type="button" className="button button-secondary" onClick={cancel}>Cancel</button>}
      </div>
    </form>
    <section className="card demo-table-card" aria-labelledby="patients-heading">
      <div className="clinic-section-head">
        <h2 id="patients-heading">Patients</h2>
        <input type="search" aria-label="Search patients" placeholder="Search name or phone" value={search} onChange={event => setSearch(event.target.value)} />
      </div>
      <div className="clinic-table-body">
        {loading ? <p role="status">Loading patients...</p> : patients.length === 0 ? <p>No patients found.</p> : <div className="demo-table-scroll"><table>
          <thead><tr><th scope="col">Name</th><th scope="col">Age</th><th scope="col">Gender</th><th scope="col">Phone</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
          <tbody>{patients.map(patient => <tr key={patient.id}>
            <td><strong>{patient.name}</strong></td><td>{patient.age}</td><td>{patient.gender}</td><td>{patient.phone}</td>
            <td><div className="clinic-actions">
              <button className="button button-secondary button-small" onClick={() => edit(patient)}>Edit</button>
              <button className="button button-secondary button-small" onClick={() => remove(patient)}>Delete</button>
            </div></td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </section>
  </div>;
}
