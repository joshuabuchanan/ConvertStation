export type MediaCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "ebook"
  | "presentation"
  | "spreadsheet"
  | "vector";
export type ConversionStatus = "queued" | "converting" | "complete" | "error";

export type HistoryItem = {
  id: string;
  name: string;
  from: string;
  to: string;
  size: number;
  outputSize?: number;
  category: MediaCategory;
  status: ConversionStatus;
  createdAt: string;
};
