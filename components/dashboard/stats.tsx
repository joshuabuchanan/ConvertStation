"use client";

import { Activity, CheckCircle2, Files, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getHistory } from "@/lib/storage";

export default function Stats() {
  const [count, setCount] = useState(0);
  const [completed, setCompleted] = useState(0);
  useEffect(() => {
    const update = () => { const h = getHistory(); setCount(h.length); setCompleted(h.filter(x => x.status === "complete").length); };
    update(); window.addEventListener("convertstation-history-change", update); return () => window.removeEventListener("convertstation-history-change", update);
  }, []);
  const stats = [[Files, "Files processed", count.toString()], [CheckCircle2, "Completed", completed.toString()], [Zap, "Local-first", "100%"], [Activity, "Active queue", "0"]] as const;
  return <div className="stats-grid">{stats.map(([Icon, label, value]) => <div className="stat-card" key={label}><div className="stat-icon"><Icon size={18} /></div><div><strong>{value}</strong><span>{label}</span></div></div>)}</div>;
}
