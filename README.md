# ConvertStation

ConvertStation is a browser-first file conversion workstation built with Next.js and TypeScript. Images, audio, and video can be processed in the browser; document, ebook, archive, and vector workflows run through local tools in the Docker image.

## Features

- Drag-and-drop batch conversion queue
- Browser-local image and media conversion with FFmpeg WebAssembly
- Server-side document, presentation, spreadsheet, ebook, archive, and vector conversion
- Downloadable results and browser-only conversion history
- Responsive dashboard with light and dark themes
- No account system or external conversion API dependency

## Supported engines

- LibreOffice for documents, presentations, and spreadsheets
- Calibre for ebooks
- Inkscape and Ghostscript for vector and EPS workflows
- FFmpeg WebAssembly for browser media conversion
- Native archive utilities for ZIP and tar-based workflows

## Local development

Requirements: Node.js 20 or newer. Server-side conversions additionally require the tools listed below, or Docker.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Local conversion setup

For non-Docker development, install the required host tools:

- LibreOffice: `C:\Program Files\LibreOffice\program\soffice.exe`
- Calibre: `C:\Program Files\Calibre2\ebook-convert.exe`
- Inkscape: `C:\Program Files\Inkscape\bin\inkscape.exe`
- Ghostscript: required for EPS input, with `gswin64c.exe` available on `PATH`

Optional overrides:

```env
LIBREOFFICE_PATH=C:\Program Files\LibreOffice\program\soffice.exe
CALIBRE_PATH=C:\Program Files\Calibre2\ebook-convert.exe
INKSCAPE_PATH=C:\Program Files\Inkscape\bin\inkscape.exe
GHOSTSCRIPT_PATH=C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe
```

These values are read by `app/api/convert/route.ts` and are not exposed to the browser. Copy `.env.example` to `.env.local` when overrides or legal identity values are needed.

## Docker deployment

The production image includes the conversion engines and listens on port `3000`.

```bash
docker build -t convertstation .
docker run --rm -p 3000:3000 \
	-e NEXT_PUBLIC_LEGAL_NAME="Operator legal name or company" \
	-e NEXT_PUBLIC_LEGAL_CONTACT="legal@example.com" \
	convertstation
```

For Coolify, connect the GitHub repository, select the `main` branch, choose Dockerfile deployment, expose port `3000`, and set the two legal identity variables. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Production checks

```bash
npm run build
npm start
```

The app uses `/app/tmp` for short-lived conversion files. Public deployments should add reverse-proxy upload limits, rate limiting, malware scanning, monitoring, and a queue/worker layer before handling substantial traffic. Review the [privacy policy](/privacy), [terms of use](/terms), and [legal notices](/legal) before launch.

The FFmpeg core is loaded on demand from the public unpkg CDN. Offline deployments should self-host those assets and update `lib/converter.ts`.

## License

The original source, design, and workflows are covered by the [ConvertStation Permissive Software and Design License](LICENSE). Third-party packages and conversion engines remain under their respective licenses.
