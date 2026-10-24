"use client";

import { useState } from "react";
import { usePreferences } from "@/core/preferences/preferences";
import { Icon } from "@/core/ui/icon";

export function SettingsPanel() {
  const { preferences, update, storageError } = usePreferences();
  const [changed, setChanged] = useState(false);

  return <div className="settings-stack">
    <section className="card settings-card"><div className="settings-title"><span className="icon-box"><Icon name="sun" /></span><div><h2>Appearance</h2><p>Make your workspace feel right for you.</p></div></div><fieldset className="theme-fieldset"><legend>Color theme</legend><div className="theme-options">{([
      { value: "light", label: "Light", icon: "sun" },
      { value: "dark", label: "Dark", icon: "moon" },
      { value: "system", label: "System", icon: "monitor" },
    ] as const).map(theme => <label className={`theme-option ${preferences.theme === theme.value ? "selected" : ""}`} key={theme.value}><input type="radio" name="theme" value={theme.value} checked={preferences.theme === theme.value} onChange={() => { update({ theme: theme.value }); setChanged(true); }} /><span className={`theme-preview preview-${theme.value}`}><span className="mini-sidebar" /><span className="mini-content"><span /><span /><span /></span></span><span className="theme-option-label"><Icon name={theme.icon} size={17} />{theme.label}<span className="radio-circle">{preferences.theme === theme.value && <span />}</span></span></label>)}</div></fieldset><p className="field-help">System follows your device’s light or dark appearance.</p></section>
    <section className="card settings-card"><div className="settings-title"><span className="icon-box"><Icon name="overview" /></span><div><h2>Workspace preferences</h2><p>Small adjustments for your everyday workspace.</p></div></div><label className="toggle-row"><span><strong>Compact layout</strong><span>Reduce spacing to fit more on your screen.</span></span><input type="checkbox" role="switch" checked={preferences.compact} onChange={event => { update({ compact: event.target.checked }); setChanged(true); }} /><span className="toggle-track" aria-hidden="true"><span /></span></label></section>
    <div className="settings-save" role="status"><Icon name={storageError ? "lock" : "check"} size={17} />{storageError ? "Browser storage is unavailable. Changes apply until you leave this page." : changed ? "Preferences saved on this device." : "Changes save automatically on this device."}</div>
    <p className="settings-note">Only display preferences are stored in your browser. No patient or clinical information is stored locally.</p>
  </div>;
}
