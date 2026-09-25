import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { replaceExtension } from "./formats";

let ffmpeg: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

const VIDEO_EXTENSIONS = new Set([
  "mp4", "m4v", "mpeg", "mpg", "mov", "avi", "mkv", "webm", "wmv", "flv", "ogv", "3gp", "3g2" , "gif",
]);
const AUDIO_EXTENSIONS = new Set([
  "mp3", "wav", "ogg", "aac", "flac", "m4a", "wma", "opus",
]);

function detectMediaKind(file: File) {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  return null;
}

export async function loadFFmpeg(onProgress?: (value: number) => void) {
  if (ffmpeg?.loaded) return ffmpeg;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const instance = new FFmpeg();
    instance.on("progress", ({ progress }) => onProgress?.(Math.round(progress * 100)));
    const base = "/api/ffmpeg";
    await instance.load({
      coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpeg = instance;
    return instance;
  })();

  try {
    return await ffmpegLoading;
  } finally {
    ffmpegLoading = null;
  }
}

export async function convertImage(file: File, target: string, quality: number) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not create an image canvas.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const mime = target === "jpg" || target === "jpeg" ? "image/jpeg" : `image/${target}`;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Image conversion failed.")), mime, quality / 100);
  });
  return { blob, name: replaceExtension(file.name, target) };
}

async function normalizeBitmapForTracing(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this image for vector conversion.");
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The image could not be prepared for vector conversion.")), "image/png");
  });
  return new File([blob], replaceExtension(file.name, "png"), { type: "image/png" });
}

export async function convertWithFFmpeg(
  file: File,
  target: string,
  onProgress?: (value: number) => void,
) {
  const instance = await loadFFmpeg(onProgress);
  const inputName = `input-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const outputName = `output-${Date.now()}.${target}`;
  await instance.writeFile(inputName, await fetchFile(file));

  const videoTargets = new Set(["mp4", "webm", "mov", "mkv", "avi", "gif"]);
  const isVideoInput = detectMediaKind(file) === "video";
  const isVideoOutput = videoTargets.has(target);
  const audioCodec = target === "mp3" ? "libmp3lame" : target === "ogg" ? "libvorbis" : target === "flac" ? "flac" : target === "wav" ? "pcm_s16le" : "aac";
  const defaultVideoCodec = target === "webm" ? "libvpx-vp9" : target === "gif" ? "gif" : "libx264";
  const fallbackVideoCodec = target === "webm" ? "libvpx" : defaultVideoCodec;
  const fallbackAudioCodec = target === "webm" ? "libvorbis" : "aac";

  const attempts = target === "gif"
    ? [["-y", "-i", inputName, "-vf", "fps=15,scale=trunc(iw/2)*2:trunc(ih/2)*2", outputName]]
    : isVideoInput && isVideoOutput
      ? [
          ["-y", "-i", inputName, "-c:v", defaultVideoCodec, "-c:a", "aac", outputName],
          ["-y", "-i", inputName, "-c:v", fallbackVideoCodec, "-pix_fmt", "yuv420p", "-c:a", fallbackAudioCodec, outputName],
        ]
      : [["-y", "-i", inputName, "-vn", "-c:a", audioCodec, outputName]];

  let exitCode = 1;
  for (const args of attempts) {
    exitCode = await instance.exec(args);
    if (exitCode === 0) break;
  }
  if (exitCode !== 0) throw new Error("FFmpeg could not convert this file. The selected format may not support the source streams.");
  const data = await instance.readFile(outputName);
  await instance.deleteFile(inputName).catch(() => undefined);
  await instance.deleteFile(outputName).catch(() => undefined);
  if (typeof data === "string") throw new Error("FFmpeg returned an invalid conversion result.");
  const bytes = new Uint8Array(data.byteLength);
  bytes.set(data);
  const blob = new Blob([bytes.buffer], { type: isVideoOutput ? `video/${target}` : `audio/${target}` });
  return { blob, name: replaceExtension(file.name, target) };
}

export async function convertWithLocal(file: File, target: string, onProgress?: (value: number) => void) {
  onProgress?.(10);
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("target", target);
  const response = await fetch("/api/convert", { method: "POST", body: form });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "The local conversion service failed.");
  }
  const blob = await response.blob();
  onProgress?.(100);
  return {
    blob,
    name: response.headers.get("x-output-filename") ?? replaceExtension(file.name, target),
  };
}

export async function convertFile(file: File, target: string, quality = 90, onProgress?: (value: number) => void, category?: string) {
  const isVectorConversion = target === "svg" || category === "vector";
  if ((category === "image" || (!category && file.type.startsWith("image/"))) && !isVectorConversion) {
    onProgress?.(15);
    const result = await convertImage(file, target, quality);
    onProgress?.(100);
    return result;
  }
  if (target === "svg" && category === "image") {
    onProgress?.(15);
    const normalizedFile = await normalizeBitmapForTracing(file);
    return convertWithLocal(normalizedFile, target, onProgress);
  }
  if (isVectorConversion) return convertWithLocal(file, target, onProgress);
  if (category === "audio" || category === "video" || (!category && (file.type.startsWith("audio/") || file.type.startsWith("video/")))) {
    return convertWithFFmpeg(file, target, onProgress);
  }
  return convertWithLocal(file, target, onProgress);
}
