import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import sharp from "sharp";
import { CONVERSION_TIMEOUT_MS, MAX_UPLOAD_BYTES } from "@/lib/limits";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const maxDuration = 60;

type EngineName = "libreoffice" | "calibre" | "inkscape" | "archive";

function getConfiguredExecutable(environmentVariable: string, fallback: string) {
  return process.env[environmentVariable]?.trim() || fallback;
}

const ENGINE_PATHS = {
  libreoffice: getConfiguredExecutable("LIBREOFFICE_PATH", process.platform === "win32" ? "C:\\Program Files\\LibreOffice\\program\\soffice.exe" : "/usr/bin/soffice"),
  calibre: getConfiguredExecutable("CALIBRE_PATH", process.platform === "win32" ? "C:\\Program Files\\Calibre2\\ebook-convert.exe" : "/usr/bin/ebook-convert"),
  inkscape: getConfiguredExecutable("INKSCAPE_PATH", process.platform === "win32" ? "C:\\Program Files\\Inkscape\\bin\\inkscape.exe" : "/usr/bin/inkscape"),
} as const;

const FORMAT_MAPPING: Record<string, EngineName> = {
  pdf: "libreoffice",
  docx: "libreoffice",
  doc: "libreoffice",
  txt: "libreoffice",
  rtf: "libreoffice",
  html: "libreoffice",
  odt: "libreoffice",
  pptx: "libreoffice",
  ppt: "libreoffice",
  odp: "libreoffice",
  pps: "libreoffice",
  ppsx: "libreoffice",
  xlsx: "libreoffice",
  xls: "libreoffice",
  csv: "libreoffice",
  ods: "libreoffice",
  epub: "calibre",
  mobi: "calibre",
  azw: "calibre",
  azw3: "calibre",
  fb2: "calibre",
  svg: "inkscape",
  eps: "inkscape",
  png: "inkscape",
  jpg: "inkscape",
  jpeg: "inkscape",
  webp: "inkscape",
  zip: "archive",
  tar: "archive",
  gz: "archive",
  bz2: "archive",
  xz: "archive",
};

function contentTypeFor(extension: string) {
  const typeMap: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword",
    txt: "text/plain",
    rtf: "application/rtf",
    html: "text/html",
    odt: "application/vnd.oasis.opendocument.text",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint",
    odp: "application/vnd.oasis.opendocument.presentation",
    pps: "application/vnd.ms-powerpoint",
    ppsx: "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    numbers: "application/vnd.apple.numbers",
    epub: "application/epub+zip",
    mobi: "application/x-mobipocket-ebook",
    azw: "application/vnd.amazon.ebook",
    azw3: "application/vnd.amazon.ebook",
    fb2: "application/fb2+xml",
    cbz: "application/x-cbz",
    svg: "image/svg+xml",
    eps: "application/postscript",
    ai: "application/postscript",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    cdr: "application/cdr",
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
    bz2: "application/x-bzip2",
    xz: "application/x-xz",
  };

  return typeMap[extension] ?? "application/octet-stream";
}

async function pathExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isValidBitmapFile(filePath: string, extension: string) {
  const header = await fs.open(filePath, "r");
  try {
    const bytes = Buffer.alloc(12);
    await header.read(bytes, 0, bytes.length, 0);
    if (extension === ".png") return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if (extension === ".jpg" || extension === ".jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (extension === ".webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    return true;
  } finally {
    await header.close();
  }
}

async function convertWithLibreOffice(inputPath: string, outputDir: string, target: string) {
  const configuredExecutable = ENGINE_PATHS.libreoffice;
  const consoleExecutable = path.join(path.dirname(configuredExecutable), "soffice.com");
  const executable = (await pathExists(consoleExecutable)) ? consoleExecutable : configuredExecutable;
  if (!(await pathExists(configuredExecutable))) {
    throw new Error("LibreOffice is not installed on this server. Install it and set LIBREOFFICE_PATH if it is not in the default Windows location.");
  }

  const profileDir = path.join(path.dirname(outputDir), "libreoffice-profile");
  await fs.mkdir(profileDir, { recursive: true });
  const environment = { ...process.env };
  delete environment.PYTHONHOME;
  delete environment.PYTHONPATH;

  const filters: Record<string, string> = {
    doc: "doc:MS Word 97",
    docx: "docx:Office Open XML Text",
    rtf: "rtf:Rich Text Format",
  };
  const filter = filters[target] ?? target;
  try {
    const result = await execFileAsync(executable, [
      "--headless",
      "--nodefault",
      "--norestore",
      "--nolockcheck",
      "--nologo",
      "--nofirststartwizard",
      `-env:UserInstallation=${pathToFileURL(profileDir).href}`,
      ...(path.extname(inputPath).toLowerCase() === ".pdf" ? ["--infilter=writer_pdf_import"] : []),
      "--convert-to",
      filter,
      inputPath,
      "--outdir",
      outputDir,
    ], { env: environment, timeout: 30_000, windowsHide: true });

    const outputPath = path.join(outputDir, `${path.parse(inputPath).name}.${target}`);
    const outputStats = await fs.stat(outputPath).catch(() => null);
    if (!outputStats?.size) {
      const diagnostics = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");
      throw new Error(diagnostics || "LibreOffice finished without producing a non-empty converted file.");
    }
  } catch (error) {
    if (error && typeof error === "object" && "killed" in error && error.killed) {
      throw new Error("LibreOffice timed out while converting the file. Repair or reinstall LibreOffice, then try again.");
    }
    if (error instanceof Error && error.message) throw error;
    throw new Error("LibreOffice failed to convert the file.");
  }

  const outputPath = path.join(outputDir, `${path.parse(inputPath).name}.${target}`);
  if (!(await pathExists(outputPath))) {
    throw new Error("LibreOffice finished without producing a converted file.");
  }

  return outputPath;
}

async function convertWithCalibre(inputPath: string, outputPath: string) {
  const executable = ENGINE_PATHS.calibre;
  if (!(await pathExists(executable))) {
    throw new Error("Calibre is not installed on this server. Install it and set CALIBRE_PATH if it is not in the default Windows location.");
  }

  await execFileAsync(executable, [inputPath, outputPath], { timeout: CONVERSION_TIMEOUT_MS, windowsHide: true });
}

async function findGhostscript() {
  const configured = process.env.GHOSTSCRIPT_PATH?.trim();
  if (configured && await pathExists(configured)) return configured;

  const command = process.platform === "win32" ? "where.exe" : "which";
  const candidates = process.platform === "win32" ? ["gswin64c.exe", "gswin32c.exe"] : ["gs"];
  for (const candidate of candidates) {
    try {
      const { stdout } = await execFileAsync(command, [candidate], { windowsHide: true });
      const resolved = stdout.split(/\r?\n/).map(value => value.trim()).find(Boolean);
      if (resolved) return resolved;
    } catch {
      // Try the next executable name.
    }
  }

  if (process.platform === "win32") {
    const programFiles = process.env.ProgramFiles ?? "C:\\Program Files";
    const ghostscriptRoot = path.join(programFiles, "gs");
    const installedVersions = await fs.readdir(ghostscriptRoot, { withFileTypes: true }).catch(() => []);
    for (const version of installedVersions
      .filter(entry => entry.isDirectory())
      .sort((left, right) => right.name.localeCompare(left.name, undefined, { numeric: true }))) {
      for (const executableName of ["gswin64c.exe", "gswin32c.exe"]) {
        const executablePath = path.join(ghostscriptRoot, version.name, "bin", executableName);
        if (await pathExists(executablePath)) return executablePath;
      }
    }
  }

  throw new Error("EPS conversion requires Ghostscript. Install Ghostscript and add its bin folder to PATH, or set GHOSTSCRIPT_PATH to gswin64c.exe.");
}

async function convertWithInkscape(inputPath: string, outputPath: string) {
  const executable = ENGINE_PATHS.inkscape;
  if (!(await pathExists(executable))) {
    throw new Error("Inkscape is not installed on this server. Install it and set INKSCAPE_PATH if it is not in the default Windows location.");
  }

  const inputExtension = path.extname(inputPath).toLowerCase();
  let inkscapeInputPath = inputPath;
  let intermediatePdfPath: string | null = null;
  if (inputExtension === ".eps") {
    const ghostscript = await findGhostscript();
    intermediatePdfPath = `${outputPath}.input.pdf`;
    try {
      await execFileAsync(ghostscript, [
        "-q",
        "-dSAFER",
        "-dBATCH",
        "-dNOPAUSE",
        "-dEPSCrop",
        "-sDEVICE=pdfwrite",
        `-sOutputFile=${intermediatePdfPath}`,
        inputPath,
      ], { timeout: CONVERSION_TIMEOUT_MS, windowsHide: true });
    } catch (error) {
      const details = error && typeof error === "object"
        ? ["stdout" in error ? String(error.stdout).trim() : "", "stderr" in error ? String(error.stderr).trim() : ""].filter(Boolean).join("\n")
        : "";
      throw new Error(details || "Ghostscript could not read this EPS file. Verify that the file is a valid Encapsulated PostScript document.");
    }
    inkscapeInputPath = intermediatePdfPath;
  }
  const isBitmapToVector = inputExtension === ".png" || inputExtension === ".jpg" || inputExtension === ".jpeg" || inputExtension === ".webp";
  if (isBitmapToVector && !(await isValidBitmapFile(inputPath, inputExtension))) {
    throw new Error(`The uploaded ${inputExtension.slice(1).toUpperCase()} file is invalid or does not match its file extension. Choose a real image file and try again.`);
  }
  const outputExtension = path.extname(outputPath).toLowerCase().slice(1);
  const needsRasterBridge = outputExtension === "jpg" || outputExtension === "jpeg" || outputExtension === "webp";
  const rasterPath = needsRasterBridge ? `${outputPath}.png` : outputPath;
  const args = isBitmapToVector
    ? [inkscapeInputPath, `--actions=select-all;object-trace:8,true,false,false,4,0.35,0.2`, `--export-filename=${rasterPath}`]
    : [inkscapeInputPath, `--export-filename=${rasterPath}`];
  let result;
  try {
    result = await execFileAsync(executable, args, { timeout: CONVERSION_TIMEOUT_MS, windowsHide: true });
  } catch (error) {
    const details = error && typeof error === "object"
      ? ["stdout" in error ? String(error.stdout).trim() : "", "stderr" in error ? String(error.stderr).trim() : ""].filter(Boolean).join("\n")
      : "";
    throw new Error(details || "Inkscape could not process this file. Verify that the image is valid.");
  } finally {
    if (intermediatePdfPath) await fs.rm(intermediatePdfPath, { force: true });
  }

  const outputStats = await fs.stat(rasterPath).catch(() => null);
  if (!outputStats?.size) {
    const diagnostics = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join("\n");
    throw new Error(diagnostics || `Inkscape did not produce a ${outputExtension.toUpperCase()} file. Verify that the input is valid and that this export format is supported.`);
  }

  if (needsRasterBridge) {
    await sharp(rasterPath).toFormat(outputExtension === "webp" ? "webp" : "jpeg").toFile(outputPath);
    await fs.rm(rasterPath, { force: true });
  } else if (isBitmapToVector) {
    const tracedSvg = await fs.readFile(outputPath, "utf8");
    const vectorOnlySvg = tracedSvg.replace(/\s*<image\b[\s\S]*?\/>/gi, "");
    await fs.writeFile(outputPath, vectorOnlySvg, "utf8");
  }
}

async function convertArchive(inputPath: string, outputPath: string, target: string) {
  const sourceDir = path.dirname(inputPath);
  const sourceName = path.basename(inputPath);

  if (target === "zip") {
    try {
      await execFileAsync("zip", ["-j", "-q", outputPath, inputPath], { timeout: CONVERSION_TIMEOUT_MS, windowsHide: true });
      return;
    } catch {
      throw new Error("ZIP creation failed. Ensure the zip utility is installed on this host.");
    }
  }

  const tarArgs: Record<string, string[]> = {
    tar: ["-cf", outputPath, "-C", sourceDir, sourceName],
    gz: ["-czf", outputPath, "-C", sourceDir, sourceName],
    bz2: ["-cjf", outputPath, "-C", sourceDir, sourceName],
    xz: ["-cJf", outputPath, "-C", sourceDir, sourceName],
  };

  const args = tarArgs[target];
  if (!args) {
    throw new Error(`Local archive conversion for .${target} is not supported on this host. Use zip or tar-based targets that have a native CLI available.`);
  }

  await execFileAsync("tar", args, { timeout: CONVERSION_TIMEOUT_MS, windowsHide: true });
}

export async function POST(request: Request) {
  let tempDir: string | null = null;
  let tempInputPath: string | null = null;
  let outputPath: string | null = null;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const target = String(form.get("target") ?? "").trim().toLowerCase();

    if (!(file instanceof File) || !target) {
      return NextResponse.json({ error: "A source file and target format are required." }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "Files must be 50 MB or smaller." }, { status: 413 });
    }

    const normalizedTarget = target.startsWith(".") ? target.slice(1) : target;
    const engine = FORMAT_MAPPING[normalizedTarget];
    if (!engine) {
      return NextResponse.json({ error: `Unsupported target format: ${normalizedTarget}` }, { status: 400 });
    }

    tempDir = path.join(process.cwd(), "tmp", crypto.randomUUID());
    const outputDir = path.join(tempDir, "output");
    await fs.mkdir(outputDir, { recursive: true });

    const sourceExtension = (file.name.split(".").pop() ?? "bin").toLowerCase();
    tempInputPath = path.join(tempDir, `input.${sourceExtension || "bin"}`);
    await fs.writeFile(tempInputPath, Buffer.from(await file.arrayBuffer()));

    if (engine === "libreoffice" && sourceExtension === "pdf" && normalizedTarget === "doc") {
      throw new Error("LibreOffice cannot export PDF to .doc in this installation. Use .docx, .pdf, .txt, .html, or .odt instead.");
    }

    outputPath = path.join(outputDir, `converted.${normalizedTarget}`);

    if (engine === "libreoffice") {
      outputPath = await convertWithLibreOffice(tempInputPath, outputDir, normalizedTarget);
    } else if (engine === "calibre") {
      await convertWithCalibre(tempInputPath, outputPath);
    } else if (engine === "inkscape") {
      await convertWithInkscape(tempInputPath, outputPath);
    } else {
      await convertArchive(tempInputPath, outputPath, normalizedTarget);
    }

    const outputStats = await fs.stat(outputPath).catch(() => null);
    if (!outputStats?.size) {
      throw new Error(`The converter did not produce a ${normalizedTarget.toUpperCase()} file. Verify the input file and try again.`);
    }

    const buffer = await fs.readFile(outputPath);
    const outputName = `${path.parse(file.name).name}.${normalizedTarget}`;

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentTypeFor(normalizedTarget),
        "X-Output-Filename": outputName,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Local conversion failed.",
      },
      { status: 500 },
    );
  }
}
