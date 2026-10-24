"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/core/ui/icon";

const navigation = [
  { href: "/", label: "Overview", icon: "overview" },
  { href: "/patients", label: "Patients", icon: "users" },
  { href: "/appointments", label: "Appointments", icon: "calendar" },
  { href: "/system", label: "System status", icon: "activity" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const current = navigation.find(item => item.href === pathname);

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar">
      <Link href="/" className="brand" aria-label="Healthcare home"><span className="brand-mark">+</span><span>Healthcare<span className="brand-caption">CARE, CONNECTED.</span></span></Link>
      <div className="workspace"><span className="workspace-icon">H</span><div><strong>Your workspace</strong><span>Foundation · v0.1</span></div><span className="workspace-dot" /></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav aria-label="Main navigation">{navigation.map(item => <Link key={item.href} href={item.href} className={`nav-link ${pathname === item.href ? "active" : ""}`} aria-current={pathname === item.href ? "page" : undefined}><Icon name={item.icon} /><span>{item.label}</span>{pathname === item.href && <span className="nav-active-dot" />}</Link>)}</nav>
      <div className="sidebar-footer"><Icon name="lock" size={18} /><div><strong>A considered foundation</strong><span>No clinical data connected</span></div></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{current?.label ?? "Page"}</strong></div><span className="environment"><span />Local workspace</span></header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="page-footer"><span>Healthcare <span className="footer-dot">·</span> A better foundation for care</span><span>Foundation release <strong>0.1.0</strong></span></footer>
    </div>
  </div>;
}
