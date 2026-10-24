import type { Metadata } from "next";
import { SettingsPanel } from "@/features/settings/settings-panel";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <><div className="page-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h1>Workspace settings</h1><p>A comfortable workspace, tailored to the way you work.</p></div><span className="badge neutral">Device preferences</span></div><SettingsPanel /></>;
}
