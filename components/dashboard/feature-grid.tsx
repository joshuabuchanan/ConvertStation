import { ArrowRight, Download, ShieldCheck, Sparkles, Wand2 } from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "Smart batch queue",
    text: "Drag in multiple files, pick an output format per item, and convert the whole queue without leaving the workstation.",
  },
  {
    icon: Download,
    title: "Instant downloads",
    text: "Download each converted asset as soon as it finishes, with browser-side results kept ready for quick retrieval.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first flow",
    text: "Everything is processed locally in-browser for images, and media files stay on-device unless you choose to download them.",
  },
  {
    icon: Sparkles,
    title: "Polished workflow",
    text: "A workstation-inspired dashboard keeps conversion history, controls, and all format families clearly visible in one place.",
  },
];

export default function FeatureGrid() {
  return (
    <section className="panel feature-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">WORKFLOW HIGHLIGHTS</p>
          <h2>Built for fast, quiet conversion work</h2>
        </div>
        <span className="text-link inline-link">
          Upgrade path <ArrowRight size={15} />
        </span>
      </div>

      <div className="feature-grid">
        {features.map(({ icon: Icon, title, text }) => (
          <article key={title} className="feature-card">
            <div className="feature-icon">
              <Icon size={18} />
            </div>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
