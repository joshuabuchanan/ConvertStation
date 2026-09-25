import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/theme-provider";
import AppShell from "@/components/app-shell";

export const metadata: Metadata = {
  title: "ConvertStation — Your Digital Conversion Workstation",
  description: "A browser-first file conversion workstation for media, documents, archives, ebooks, presentations, spreadsheets, and vectors.",
  icons: { icon: "/images/convertstationlogo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></body></html>;
}
