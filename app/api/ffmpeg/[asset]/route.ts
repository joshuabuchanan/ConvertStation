import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

const assets = {
  "ffmpeg-core.js": "text/javascript",
  "ffmpeg-core.wasm": "application/wasm",
} as const;

type AssetName = keyof typeof assets;

export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  const { asset: assetParam } = await params;
  const asset = assetParam as AssetName;
  const contentType = assets[asset];
  if (!contentType) return new NextResponse("Not found", { status: 404 });

  const localAsset = path.join(process.cwd(), "node_modules", "@ffmpeg", "core", "dist", "umd", asset);
  try {
    const buffer = await fs.readFile(localAsset);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    const upstream = await fetch(`https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd/${asset}`, {
      next: { revalidate: 86400 },
    }).catch(() => null);
    if (!upstream?.ok || !upstream.body) {
      return new NextResponse("FFmpeg asset unavailable", { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }
}