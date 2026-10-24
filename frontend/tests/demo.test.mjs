import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "../node_modules/typescript/lib/typescript.js";

// Evaluate the real TypeScript modules with an in-memory backend; no server or database.
function load(relative, extras = {}) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(javascript, { exports, Response, AbortSignal, process: { env: {} }, ...extras });
  return exports;
}
const types = load("../src/features/demo/types.ts");
const overview = {
  source: "supabase_postgres", fetched_at: "2026-10-24T10:00:00Z",
  patients: [{ id: "DEMO-P001", display_name: "Demo Patient 01", age: 32, care_status: "stable" }],
  clinicians: [{ id: "DEMO-C001", display_name: "Demo Clinician A", specialty: "General medicine" }],
  appointments: [{ id: "DEMO-A001", patient_name: "Demo Patient 01", clinician_name: "Demo Clinician A", starts_at: "2026-10-25T04:00:00Z", visit_type: "Review", status: "scheduled" }],
};
function route(fetch) {
  return load("../src/app/api/demo/route.ts", { fetch, require: () => types });
}

test("valid data is accepted, malformed patient and appointment data rejected", () => {
  assert.equal(types.isDemoOverview(overview), true);
  assert.equal(types.isDemoOverview({ ...overview, fetched_at: "invalid" }), false);
  assert.equal(types.isDemoOverview({ ...overview, patients: [{ ...overview.patients[0], age: -1 }] }), false);
  assert.equal(types.isDemoOverview({ ...overview, patients: [{ ...overview.patients[0], care_status: { toString: () => "stable" } }] }), false);
  assert.equal(types.isDemoOverview({ ...overview, appointments: [{ ...overview.appointments[0], starts_at: "invalid" }] }), false);
  assert.equal(types.isDemoOverview({ ...overview, source: "hardcoded_preview" }), false);
});

test("proxy preserves valid database data and disables caching", async () => {
  const api = route(async (url, options) => {
    assert.equal(url, "http://127.0.0.1:8000/api/v1/demo/overview");
    assert.equal(options.cache, "no-store");
    return Response.json(overview);
  });
  const response = await api.GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), overview);
});

test("unconfigured backend remains a setup error, never fake successful data", async () => {
  const api = route(async () => Response.json({ detail: { code: "database_unconfigured" } }, { status: 503 }));
  const response = await api.GET();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "database_unconfigured" });
});

test("unknown backend errors do not disclose raw SQL or credentials", async () => {
  const api = route(async () => Response.json({ detail: "postgresql://secret@example/private" }, { status: 500 }));
  const response = await api.GET();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "backend_unavailable" });
});

test("invalid success payloads fail validation", async () => {
  const api = route(async () => Response.json({ patients: "invalid" }));
  const response = await api.GET();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "data_invalid" });
});

test("connection failures produce a stable unavailable response", async () => {
  const api = route(async () => { throw Error("private backend host"); });
  const response = await api.GET();
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { code: "backend_unavailable" });
});
