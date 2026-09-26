"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, FileArchive, FileAudio, FileImage, FileText, FileVideo, Gauge, History, Home, Info, Presentation, Settings2, Shapes, Table2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { categoryLabels, getSupportedMediaFormats, supportedCategories } from "@/lib/formats";
import type { MediaCategory } from "@/lib/types";

const links = [
  ["/", "Overview", Home],
  ["/workspace", "Converter", Gauge],
  ["/history", "History", History],
  ["/settings", "Settings", Settings2],
];

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

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Image src="/images/convertstationlogo.svg" alt="ConvertStation" className="sidebar-brand-logo" width={1536} height={1024} />
      </div>
      <div className="side-section">
        <div className="side-label">WORKSTATION</div>
        {links.map(([href, label, Icon]) => {
          const I = Icon as typeof Home;
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href as string);
          return <Link key={href as string} href={href as string} className={active ? "side-link active" : "side-link"}><I size={18} /> {label as string}</Link>;
        })}
      </div>
      <div className="side-section">
        <div className="side-label">FORMATS</div>
        {supportedCategories.map((category) => {
          const Icon = categoryIcons[category];
          return <div className="format-link" key={category}>
            <Icon size={17} /> {categoryLabels[category]} <span>{getSupportedMediaFormats(category).map((format) => format.toUpperCase()).join(" · ")}</span>
          </div>;
        })}
      </div>
      <div className="side-bottom">
        <Link href="/about" className="side-link"><Info size={17} /> About ConvertStation</Link>
      </div>
    </aside>
  );
}
