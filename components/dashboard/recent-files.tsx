"use client";

import Link from "next/link";
import { ArrowRight, Clock3, FileArchive } from "lucide-react";
import { useEffect, useState } from "react";
import { getHistory } from "@/lib/storage";
import { formatBytes } from "@/lib/utils";
import type { HistoryItem } from "@/lib/types";

export default function RecentFiles() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => { const update = () => setItems(getHistory().slice(0, 5)); update(); window.addEventListener("convertstation-history-change", update); return () => window.removeEventListener("convertstation-history-change", update); }, []);
  return <section className="panel recent-panel"><div className="panel-header"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Latest conversions</h2></div><Link href="/history" className="text-link">View history <ArrowRight size={15} /></Link></div>{items.length === 0 ? <div className="empty-state"><FileArchive size={28} /><p>Your completed conversions will appear here.</p><Link href="/workspace" className="button secondary">Start a conversion</Link></div> : <div className="recent-list">{items.map(item => <div className="recent-row" key={item.id}><div className="file-icon">{item.to.toUpperCase()}</div><div className="recent-main"><strong>{item.name}</strong><span>{item.from.toUpperCase()} → {item.to.toUpperCase()} · {formatBytes(item.outputSize ?? item.size)}</span></div><span className="status-dot complete"><Clock3 size={13} /> {new Date(item.createdAt).toLocaleDateString()}</span></div>)}</div>}</section>;
}
