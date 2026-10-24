"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/core/ui/icon";
import { isSystemStatus, statusLabels, type SystemStatus } from "./types";

export function SystemStatusPanel({ detailed = false }: { detailed?: boolean }) {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  function refresh() {
    setLoading(true);
    setError(false);
    setRefreshKey(key => key + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/system", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok && response.status !== 503) throw new Error("Status request failed");
        const result: unknown = await response.json();
        if (!isSystemStatus(result)) throw new Error("Invalid status response");
        return result;
      })
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(() => { if (!controller.signal.aborted) { setData(null); setError(true); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refreshKey]);

  const services = [
    { name: "Web application", subtitle: "Next.js · App Router", icon: "monitor" as const, status: "healthy" as const, message: "Your workspace is running in this browser." },
    { name: "Backend API", subtitle: "Python · FastAPI", icon: "server" as const, status: data?.api.status, message: data?.api.message },
    { name: "Database", subtitle: "Supabase · PostgreSQL", icon: "database" as const, status: data?.database.status, message: data?.database.message },
  ];

  return <section className="system-section" aria-label="Connection status" aria-busy={loading}>
    <div className="section-heading"><div><h2>{detailed ? "Service connections" : "Your foundation, at a glance"}</h2><p>Live checks across your application.</p></div><button className="button button-secondary button-small" onClick={refresh} disabled={loading}><Icon name="refresh" size={15} />{loading ? "Checking…" : "Refresh"}</button></div>
    {error && <div className="error-notice" role="alert">Status check failed. Check your connection, then refresh to try again.</div>}
    <div className="status-grid">{services.map(service => <article className="card service-card" key={service.name}><div className="service-card-top"><span className="icon-box"><Icon name={service.icon} /></span><span className={`badge ${service.status ?? "unknown"}`}><span />{service.status ? statusLabels[service.status] : loading ? "Checking…" : "Not checked"}</span></div><h3>{service.name}</h3><p className="service-subtitle">{service.subtitle}</p><div className="service-description">{service.message ?? (loading ? "Checking the connection…" : "Connection status is unavailable.")}</div></article>)}</div>
    <div className="status-footnote" role="status">{loading ? "Checking your services…" : data ? `Last checked ${new Date(data.checked_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · Read-only checks` : "Service checks unavailable"}</div>
    {detailed && <div className="card connection-details"><div className="section-heading"><h2>How connections work</h2><span className="eyebrow">READ ONLY</span></div><div className="connection-flow"><span>Browser</span><Icon name="arrow" size={17} /><span>Next.js</span><Icon name="arrow" size={17} /><span>FastAPI</span><Icon name="arrow" size={17} /><span>Supabase</span></div><p>The web application checks FastAPI through a server-side route. The API checks PostgreSQL with <code>SELECT 1</code> over an encrypted, read-only connection. No clinical records are read or changed.</p><div className="detail-row"><span>API liveness</span><code>GET /health</code></div><div className="detail-row"><span>Connection diagnostics</span><code>GET /api/v1/system/status</code></div></div>}
  </section>;
}
