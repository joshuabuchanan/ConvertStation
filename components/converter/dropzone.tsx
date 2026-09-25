"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { useDropzone } from "react-dropzone";
import { ArrowRight, BookOpen, CheckCircle2, Download, FileArchive, FileAudio, FileImage, FileText, FileVideo, LoaderCircle, Plus, Presentation, Shapes, Table2, Trash2, UploadCloud, XCircle } from "lucide-react";
import { convertFile } from "@/lib/converter";
import { detectCategory, getExtension, getQueueTargetFormats } from "@/lib/formats";
import { addHistory } from "@/lib/storage";
import { formatBytes, formatDuration } from "@/lib/utils";
import { MAX_QUEUE_FILES, MAX_UPLOAD_BYTES } from "@/lib/limits";
import type { MediaCategory } from "@/lib/types";

type QueueFile = { id: string; file: File; category: MediaCategory; target: string; status: "queued" | "converting" | "complete" | "error"; progress: number; output?: { blob: Blob; name: string }; error?: string; elapsed?: number };

const iconFor = (category: MediaCategory) => ({
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  archive: FileArchive,
  ebook: BookOpen,
  presentation: Presentation,
  spreadsheet: Table2,
  vector: Shapes,
}[category]);

function createQueueId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ConverterDropzone() {
  const [items, setItems] = useState<QueueFile[]>([]);
  const [quality, setQuality] = useState(90);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Drop files here or browse from your computer");

  useEffect(() => {
    const saved = Number(localStorage.getItem("convertstation-quality"));
    if (saved) setQuality(saved);
  }, []);

  const onDrop = useCallback((files: File[]) => {
    const accepted = files.map((file) => {
      const category = detectCategory(file);
      if (!category) return null;
      return { id: createQueueId(), file, category, target: getQueueTargetFormats(getExtension(file.name))[0], status: "queued" as const, progress: 0 };
    }).filter(Boolean) as QueueFile[];
    setItems((current) => [...current, ...accepted].slice(0, MAX_QUEUE_FILES));
    if (accepted.length) {
      const available = Math.max(0, MAX_QUEUE_FILES - items.length);
      const added = Math.min(accepted.length, available);
      setMessage(added ? `${added} file${added > 1 ? "s" : ""} added to the station` : `The queue supports up to ${MAX_QUEUE_FILES} files.`);
    }
  }, [items.length]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    multiple: true,
    maxFiles: MAX_QUEUE_FILES,
    maxSize: MAX_UPLOAD_BYTES,
    onDropRejected: (rejections) => {
      if (rejections.some(({ file }) => file.size > MAX_UPLOAD_BYTES)) setMessage("Files must be 50 MB or smaller.");
      else setMessage(`The queue supports up to ${MAX_QUEUE_FILES} files.`);
    },
    noClick: true,
    noKeyboard: true,
  });

  const totals = useMemo(() => ({ files: items.length, done: items.filter(x => x.status === "complete").length }), [items]);

  const update = (id: string, patch: Partial<QueueFile>) => setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));

  async function convertItem(item: QueueFile) {
    update(item.id, { status: "converting", progress: 0, error: undefined });
    const started = performance.now();
    try {
      const result = await convertFile(item.file, item.target, quality, (progress) => update(item.id, { progress }), item.category);
      const elapsed = Math.round(performance.now() - started);
      update(item.id, { status: "complete", progress: 100, output: result, elapsed });
      addHistory({ id: item.id, name: item.file.name, from: getExtension(item.file.name), to: item.target, size: item.file.size, outputSize: result.blob.size, category: item.category, status: "complete", createdAt: new Date().toISOString() });
    } catch (error) {
      update(item.id, { status: "error", error: error instanceof Error ? error.message : "Conversion failed." });
      addHistory({ id: item.id, name: item.file.name, from: getExtension(item.file.name), to: item.target, size: item.file.size, category: item.category, status: "error", createdAt: new Date().toISOString() });
    }
  }

  async function convertAll() {
    if (busy) return;
    setBusy(true);
    const pending = items.filter(item => item.status === "queued" || item.status === "error");
    for (const item of pending) await convertItem(item);
    setBusy(false);
  }

  async function download(item: QueueFile) {
    if (!item.output) return;
    const url = URL.createObjectURL(item.output.blob);
    const anchor = document.createElement("a");
    const supportsDownload = "download" in anchor;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    anchor.href = url;
    anchor.download = item.output.name;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    const canShareFiles = (isIos || !supportsDownload) && typeof navigator.share === "function" && typeof File !== "undefined" && !!navigator.canShare;
    if (canShareFiles) {
      const sharedFile = new File([item.output.blob], item.output.name, { type: item.output.blob.type || "application/octet-stream" });
      if (navigator.canShare({ files: [sharedFile] })) {
        setTimeout(async () => {
          try {
            await navigator.share({ files: [sharedFile], title: item.output?.name });
          } catch {
            // The browser may report cancellation after the download already succeeded.
          }
        }, 0);
      } else {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) setMessage("The browser blocked the file. Allow pop-ups, then tap Download again.");
      }
    } else if (isIos || !supportsDownload) {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) setMessage("The browser blocked the file. Allow pop-ups, then tap Download again.");
    }

    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function downloadAll() {
    const completed = items.filter((item) => item.status === "complete" && item.output);
    if (!completed.length) {
      setMessage("No completed files are ready to download yet.");
      return;
    }

    const zip = new JSZip();
    for (const item of completed) {
      if (!item.output) continue;
      zip.file(item.output.name, item.output.blob);
    }

    const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "converted-files.zip";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function remove(id: string) { setItems(current => current.filter(x => x.id !== id)); }
  function clear() { setItems([]); setMessage("Drop files here or browse from your computer"); }

  return <div className="converter-shell">
    <div {...getRootProps()} className={isDragActive ? "dropzone active" : "dropzone"}>
      <input {...getInputProps()} />
      <div className="drop-orbit"><UploadCloud size={30} /></div>
      <div><h2>{isDragActive ? "Release to add files" : "Load your files into the station"}</h2><p>{message}</p></div>
      <button className="button primary" type="button" onClick={open}><Plus size={17} /> Add files</button>
      <div className="drop-hint">Media converts in-browser · Documents and files use the configured remote engine</div>
    </div>

    {items.length > 0 && <div className="queue-panel">
      <div className="queue-toolbar"><div><p className="eyebrow">CONVERSION QUEUE</p><h2>{totals.files} file{totals.files !== 1 ? "s" : ""} · {totals.done} complete</h2></div><div className="toolbar-actions"><label className="quality-control">Quality <input type="range" min="50" max="100" value={quality} onChange={e => setQuality(Number(e.target.value))} /> <b>{quality}%</b></label><button className="button secondary" onClick={clear}><Trash2 size={16} /> Clear</button>{items.some((item) => item.status === "complete") && <button className="button primary" onClick={downloadAll}><Download size={16} /> Download all</button>}<button className="button primary" disabled={busy || !items.some(x => x.status === "queued" || x.status === "error")} onClick={convertAll}><LoaderCircle size={16} className={busy ? "spin" : ""} /> {busy ? "Converting…" : "Convert all"}</button></div></div>
      <div className="queue-list">{items.map(item => {
        const Icon = iconFor(item.category);
        return <div className="queue-row" key={item.id}>
          <div className="queue-file-icon"><Icon size={21} /></div>
          <div className="queue-file"><strong title={item.file.name}>{item.file.name}</strong><span>{formatBytes(item.file.size)} · {item.category}</span></div>
          <div className="format-flow"><span>{getExtension(item.file.name).toUpperCase()}</span><ArrowRight size={16} /><select value={item.target} disabled={item.status === "converting"} onChange={e => update(item.id, { target: e.target.value })}>{getQueueTargetFormats(getExtension(item.file.name)).map(format => <option key={format}>{format}</option>)}</select></div>
          <div className="queue-status">
            {item.status === "queued" && <span className="status-pill queued">Ready</span>}
            {item.status === "converting" && <div className="progress-wrap"><div className="progress-line"><span style={{ width: `${item.progress}%` }} /></div><small>{item.progress}%</small></div>}
            {item.status === "complete" && <button className="button success" onClick={() => download(item)}><Download size={15} /> Download</button>}
            {item.status === "error" && <span className="status-pill error"><XCircle size={14} /> Failed</span>}
          </div>
          {item.status === "complete" && <span className="elapsed"><CheckCircle2 size={15} /> {formatDuration(item.elapsed ?? 0)}</span>}
          <button className="remove-button" onClick={() => remove(item.id)} aria-label={`Remove ${item.file.name}`}><Trash2 size={16} /></button>
          {item.error && <div className="queue-error">{item.error}</div>}
        </div>;
      })}</div>
    </div>}

    <div className="support-strip"><span><CheckCircle2 size={15} /> No account required</span><span><CheckCircle2 size={15} /> Batch queue</span><span><CheckCircle2 size={15} /> Local image conversion</span><span><CheckCircle2 size={15} /> FFmpeg media engine</span></div>
  </div>;
}
