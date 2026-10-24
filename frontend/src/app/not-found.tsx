import Link from "next/link";

export default function NotFound() {
  return <div className="empty-page"><span className="eyebrow">404 · PAGE NOT FOUND</span><h1>Let’s get you back.</h1><p>This page isn’t part of your workspace.</p><Link className="button button-primary" href="/">Back to overview</Link></div>;
}
