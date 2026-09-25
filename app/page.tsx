import Link from "next/link";
import { ArrowRight, FileAudio, FileImage, FileVideo, FileText, FileArchive, BookOpen, Presentation, Table2, Shapes } from "lucide-react";
import Stats from "@/components/dashboard/stats";
import RecentFiles from "@/components/dashboard/recent-files";
import FeatureGrid from "@/components/dashboard/feature-grid";
import WorkflowPanel from "@/components/dashboard/workflow-panel";
import ConverterDropzone from "@/components/converter/dropzone";
import { categoryLabels, getQueueTargetFormats, getSupportedMediaFormats } from "@/lib/formats";
import type { MediaCategory } from "@/lib/types";

const categoryIcons: Record<MediaCategory, typeof FileText> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  archive: FileArchive,
  ebook: BookOpen,
  presentation: Presentation,
  spreadsheet: Table2,
  vector: Shapes,
};

function getMapSourceFormats(category: MediaCategory) {
  return getSupportedMediaFormats(category);
}

export default function Home() {
  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">CONVERTSTATION WORKSPACE</p>
          <h1>Convert anything. Keep the workflow moving.</h1>
          <p>
            A browser-first media converter built around a workstation dashboard, batch processing,
            and fast single-click exports for the files you need most.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/workspace">
              Open workstation <ArrowRight size={15} />
            </Link>
            <Link className="button secondary" href="/about">
              How it works
            </Link>
          </div>
        </div>

        <div className="hero-badges" aria-label="Station highlights">
          <span>Batch queue</span>
          <span>Browser-local</span>
          <span>FFmpeg engine</span>
        </div>
      </div>

      <Stats />

      <div className="home-grid">
        <div>
          <ConverterDropzone />
          <RecentFiles />
        </div>

        <aside className="side-card">
          <p className="eyebrow">SUPPORTED MEDIA</p>
          <h3>Nine format families, one station.</h3>
          <p>
            Load multiple files, choose a target format, convert, and keep your finished exports
            ready to download whenever the queue is complete.
          </p>

          {(Object.keys(categoryLabels) as MediaCategory[]).map((category) => {
            const Icon = categoryIcons[category];
            const local = ["image", "video", "audio"].includes(category);
            return <div className="mini-card" key={category}>
              <strong><Icon size={15} /> {categoryLabels[category]}</strong>
              <span>{getMapSourceFormats(category).map(format => format.toUpperCase()).join(" · ")} · {local ? "Browser" : "Remote"}</span>
            </div>;
          })}

          <div className="mini-card compact">
            <strong>Local delivery</strong>
            <span>Files stay in-browser until export.</span>
          </div>
        </aside>
      </div>

      <section className="conversion-map" aria-labelledby="conversion-map-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CONVERSION MAP</p>
            <h2 id="conversion-map-title">See what can become what.</h2>
          </div>
          <p>Choose a file family to see the formats available as export targets.</p>
        </div>
        <div className="conversion-map-list">
          {(Object.keys(categoryLabels) as MediaCategory[]).flatMap((category) => getMapSourceFormats(category).map((source) => (
            <div className="conversion-map-row" key={`${category}-${source}`}>
              <strong>{source.toUpperCase()}</strong>
              <ArrowRight className="conversion-map-arrow" size={17} aria-hidden="true" />
              <div className="format-tags" aria-label={`${source.toUpperCase()} export formats`}>
                {getQueueTargetFormats(source).map((format) => <span key={format}>{format.toUpperCase()}</span>)}
              </div>
            </div>
          )))}
        </div>
      </section>

      <WorkflowPanel />
      <FeatureGrid />
    </>
  );
}
