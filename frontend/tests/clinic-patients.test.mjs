import { test } from "node:test";
import assert from "node:assert/strict";

const base = process.env.APP_URL ?? "http://127.0.0.1:3000";

test("add patient through the frontend proxy saves to Supabase and appears in the list", async () => {
  const name = `E2E Test ${Date.now()}`;
  const created = await fetch(`${base}/api/clinic/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, age: 40, gender: "Other", phone: "+1 555 010 0199" }),
  });
  assert.equal(created.status, 201, await created.clone().text());
  const patient = await created.json();

  const list = await fetch(`${base}/api/clinic/patients?search=${encodeURIComponent(name)}`, { cache: "no-store" });
  assert.equal(list.status, 200);
  assert.ok((await list.json()).some(row => row.id === patient.id));
});
