import Link from "next/link";
import { Icon } from "@/core/ui/icon";
import { SystemStatusPanel } from "@/features/system/system-status";
import { DemoPanel } from "@/features/demo/demo-panel";
import { ClinicStatsPanel } from "@/features/clinic/clinic-stats";

export default function OverviewPage() {
  return <>
    <div className="page-heading"><div><span className="eyebrow">YOUR CARE WORKSPACE</span><h1>A fresh start for better care.</h1><p>A clear, connected home for your healthcare application.</p></div><Link className="button button-secondary" href="/settings"><Icon name="settings" size={17} />Customize workspace</Link></div>
    <section className="welcome-banner"><div className="banner-copy"><span className="banner-tag"><span />FOUNDATION RELEASE</span><h2>Good care starts with<br />a strong foundation.</h2><p>Your workspace is taking shape. Check your connections, make it your own, and build from here.</p><Link className="button button-light" href="/system">View system status<Icon name="arrow" size={17} /></Link></div><div className="care-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="art-cross">+</div><span className="art-node node-one"><Icon name="activity" size={24} /></span><span className="art-node node-two"><Icon name="lock" size={22} /></span><span className="art-node node-three"><Icon name="database" size={22} /></span><span className="art-dot dot-one" /><span className="art-dot dot-two" /></div></section>
    <ClinicStatsPanel />
    <SystemStatusPanel />
    <DemoPanel />
    <div className="bottom-grid"><section className="card setup-card"><span className="eyebrow">GET STARTED</span><h2>A little setup. A solid start.</h2><p>Two simple steps to prepare your workspace.</p><Link className="setup-link" href="/system"><span className="step-number">01</span><div><strong>Check your connections</strong><span>Review the API and Supabase database status.</span></div><Icon name="arrow" size={18} /></Link><Link className="setup-link" href="/settings"><span className="step-number">02</span><div><strong>Make yourself at home</strong><span>Choose your theme and workspace density.</span></div><Icon name="arrow" size={18} /></Link></section><section className="foundation-note"><span className="note-icon"><Icon name="book" size={23} /></span><span className="eyebrow">BUILT WITH INTENTION</span><h2>Room to grow.<br />Clarity from day one.</h2><p>This release brings together your app shell, service connections, and personal preferences.</p><div className="note-divider" /><p className="note-small">Clinical workflows will be added as real features. No patient records are connected in this release.</p></section></div>
  </>;
}
