import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return <><Navbar /><div className="app-layout"><Sidebar /><main className="main-content">{children}<footer className="site-footer"><span>ConvertStation</span><nav aria-label="Legal"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/legal">Legal</Link></nav></footer></main></div></>;
}
