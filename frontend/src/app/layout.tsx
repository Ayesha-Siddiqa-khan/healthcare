import type { Metadata } from "next";
import { AppShell } from "@/core/layout/app-shell";
import { PreferenceProvider } from "@/core/preferences/preferences";
import { preferenceScript } from "@/core/preferences/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Overview | Healthcare", template: "%s | Healthcare" },
  description: "Healthcare management workspace foundation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: preferenceScript }} /></head><body><PreferenceProvider><AppShell>{children}</AppShell></PreferenceProvider></body></html>;
}
