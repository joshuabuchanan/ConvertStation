"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Settings } from "lucide-react";
import ThemeToggle from "./theme-toggle";

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="topbar">
      <div className="brand-wrap">
        <Link href="/" className="brand" aria-label="ConvertStation home">
          <span className="brand-logo-frame">
            <img className="brand-logo" src="/images/cslogo.svg" alt="ConvertStation" width={260} height={74} />
          </span>
        </Link>
      </div>
      <nav className="topnav">
        <Link className={pathname === "/" || pathname === "/workspace" ? "active" : ""} href="/">Workspace</Link>
        <Link className={pathname === "/history" ? "active" : ""} href="/history"><History size={16} /> History</Link>
        <Link className={pathname === "/settings" ? "active" : ""} href="/settings"><Settings size={16} /> Settings</Link>
      </nav>
      <ThemeToggle />
    </header>
  );
}
