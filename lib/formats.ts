import type { MediaCategory } from "./types";

export const categoryLabels: Record<MediaCategory, string> = {
  image: "Images",
  video: "Video",
  audio: "Audio",
  document: "Documents",
  archive: "Archives",
  ebook: "Ebooks",
  presentation: "Presentations",
  spreadsheet: "Spreadsheets",
  vector: "Vectors",
};

export const formats: Record<MediaCategory, string[]> = {
  image: ["png", "jpg", "jpeg", "webp", "svg"],
  video: ["mp4", "webm", "mov", "mkv", "avi", "gif", "mp3", "wav", "ogg", "aac", "flac", "m4a"],
  audio: ["mp3", "wav", "ogg", "aac", "flac", "m4a", "mp4"],
  document: ["pdf", "docx", "doc", "txt", "rtf", "html", "odt"],
  archive: ["zip", "tar", "gz", "bz2", "xz"],
  ebook: ["epub", "mobi", "azw3", "fb2"],
  presentation: ["pptx", "ppt", "odp", "pps", "ppsx"],
  spreadsheet: ["xlsx", "xls", "csv", "ods"],
  vector: ["svg", "pdf", "eps", "png", "jpg", "jpeg", "webp"],
};

const targetOverrides: Record<string, string[]> = {
  pdf: ["docx", "txt", "rtf", "html", "odt"],
};

export function getTargetFormats(source: string, category: MediaCategory) {
  const normalizedSource = source.toLowerCase().replace(/^\./, "");
  return (targetOverrides[normalizedSource] ?? formats[category]).filter((target) => target !== normalizedSource);
}

export const extensions: Record<MediaCategory, string[]> = {
  image: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "ico", "tif", "tiff", "raw", "tga"],
  video: ["mp4", "m4v", "mp4v", "3gp", "3g2", "avi", "mov", "wmv", "mkv", "flv", "ogv", "webm", "h264", "264", "hevc", "265"],
  audio: ["mp3", "wav", "ogg", "aac", "wma", "flac", "m4a"],
  document: ["pdf", "doc", "docx", "txt", "rtf", "html", "htm", "odt", "xps", "djvu"],
  archive: ["7z", "ace", "alz", "arc", "arj", "bz", "bz2", "cab", "cpio", "deb", "dmg", "gz", "iso", "jar", "lha", "lz", "lzma", "lzo", "rar", "rpm", "tar", "tar.gz", "tar.xz", "xz", "zip"],
  ebook: ["azw", "azw3", "azw4", "cb7", "cbr", "cbz", "chm", "epub", "fb2", "htmlz", "lit", "lrf", "mobi", "pdb", "pml", "prc", "rb", "tcr"],
  presentation: ["key", "odp", "pot", "pps", "ppsx", "ppt", "pptx"],
  spreadsheet: ["csv", "numbers", "ods", "xls", "xlsx"],
  vector: ["ai", "cdr", "eps", "pdf", "svg"],
};

export function getSourceCategory(source: string) {
  const normalizedSource = source.toLowerCase().replace(/^\./, "");
  return (Object.keys(extensions) as MediaCategory[]).find((category) => extensions[category].includes(normalizedSource)) ?? null;
}

export function getQueueTargetFormats(source: string) {
  const category = getSourceCategory(source);
  return category ? getTargetFormats(source, category) : [];
}

export function getSourceFormats(category: MediaCategory) {
  return extensions[category].filter((extension) => getSourceCategory(extension) === category);
}

export const acceptMap = {
  "image/*": extensions.image.map((x) => `.${x}`),
  "video/*": extensions.video.map((x) => `.${x}`),
  "audio/*": extensions.audio.map((x) => `.${x}`),
};

export const supportedCategories: MediaCategory[] = ["image", "video", "audio", "document", "archive", "ebook", "presentation", "spreadsheet", "vector"];

const hiddenSupportedMediaFormats = new Set([
  "cdr", "ai", "numbers", "pot", "key", "tcr", "rb", "prc", "pml", "pdb", "mobi", "lrf", "lit", "htmlz", "fb2", "chm", "cbz", "cb7", "azw4", "azw", "cbr", "wma",
  "tar.xz", "tar.gz", "rpm", "rar", "lzo", "lzma", "lz", "lha", "jar", "iso", "gz", "dmg", "deb", "cpio", "cab", "bz2", "bz", "arj", "arc", "alz", "ace", "7z",
  "djvu", "xps", "odt", "htm", "265", "hevc", "264", "h264", "ogv", "flv", "wmv", "3g2", "3gp", "mp4v", "m4v", "tga", "raw", "tiff", "tif", "ico", "bmp",
]);

export function getSupportedMediaFormats(category: MediaCategory) {
  return getSourceFormats(category).filter((source) => !hiddenSupportedMediaFormats.has(source));
}

export function detectCategory(file: File): MediaCategory | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? getSourceCategory(ext) : null;
}

export function getExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "file";
}

export function replaceExtension(name: string, extension: string) {
  const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name;
  return `${base}.${extension}`;
}
