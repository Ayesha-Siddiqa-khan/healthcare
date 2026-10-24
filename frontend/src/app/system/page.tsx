import type { Metadata } from "next";
import { Icon } from "@/core/ui/icon";
import { SystemStatusPanel } from "@/features/system/system-status";

export const metadata: Metadata = { title: "System status" };

export default function SystemPage() {
  return <><div className="page-heading"><div><span className="eyebrow">CONNECTED FOUNDATION</span><h1>System status</h1><p>A real-time look at the services behind your workspace.</p></div></div><SystemStatusPanel detailed /><section className="setup-notice"><span className="icon-box"><Icon name="database" /></span><div><h2>Connect your Supabase database</h2><p>Copy <code>backend/.env.example</code> to <code>backend/.env</code>, add your project’s Session pooler connection string as <code>SUPABASE_DB_URL</code>, and restart FastAPI. Then refresh the connections above.</p><p className="field-help">Credentials stay on the backend. This check does not create tables or modify data.</p></div></section></>;
}
