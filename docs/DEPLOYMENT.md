# Deployment

## Recommended hosting model

ConvertStation is a server-backed conversion app for documents, ebooks, archives, and vector files. Choose one of these deployment models:

- **Docker host:** self-host the conversion engines on Fly.io, Render, Railway, Azure Container Apps, or a private VPS.

The browser can handle media conversion locally, while document, archive, ebook, and vector requests require the conversion binaries in the Docker image.

Keep uploaded files on private, short-lived storage and document any future external processor before enabling it. This application requires a Docker-capable host because server-side conversions depend on system binaries; a standard serverless deployment is not supported.

## Anonymous public access

Sign-in is not required. Keep the service stateless from the operator's perspective:

- Do not create user accounts or require passwords.
- Process each upload as a short-lived conversion job.
- Delete source and output files automatically after completion or expiry.
- Apply IP-based rate limits, file-size limits, concurrency limits, and abuse protection.
- Avoid storing filenames, IP addresses, or conversion history unless the privacy policy explains the retention.

Use a queue, private temporary storage, and an external rate limiter when multiple anonymous users convert files concurrently.

The application accepts files up to 50 MB each and keeps a maximum of 25 files in the browser queue. Server conversion commands are limited to 50 seconds, within the route's 60-second duration. Configure the reverse proxy with equal or higher request limits and a timeout that allows the route to finish cleanly.

## Docker

Build and run locally:

```bash
docker build -t convertstation .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_LEGAL_NAME="Operator legal name or company" \
  -e NEXT_PUBLIC_LEGAL_CONTACT="legal@example.com" \
  convertstation
```

Open `http://localhost:3000`.

## Coolify

1. Create a project and add an application from the GitHub repository.
2. Select the `main` branch and choose Dockerfile deployment.
3. Set the application port to `3000`.
4. Set `NEXT_PUBLIC_LEGAL_NAME` and `NEXT_PUBLIC_LEGAL_CONTACT`.
5. Deploy, then test representative document, ebook, archive, and vector conversions.
6. Add a domain, enable automatic HTTPS, and redeploy after DNS points to the server.

No external conversion API key is required. The application uses the tools installed in the Docker image.

The production image includes:

- LibreOffice for documents, presentations, and spreadsheets
- Calibre for ebooks
- Inkscape and Ghostscript for vector/EPS work
- FFmpeg for the browser asset pipeline and media tooling

The app uses `/app/tmp` for short-lived conversion files. Use a private, non-persistent filesystem when possible. Do not mount a shared public volume for uploaded files.

## Environment variables

Copy `.env.example` to `.env.local` for local work. For deployment, configure secrets and public legal identity values in the hosting provider's environment settings.

- `LIBREOFFICE_PATH`, `CALIBRE_PATH`, `INKSCAPE_PATH`, and `GHOSTSCRIPT_PATH` are optional executable overrides.
- `NEXT_PUBLIC_LEGAL_NAME` identifies the operator on the legal pages.
- `NEXT_PUBLIC_LEGAL_CONTACT` provides a privacy/legal contact address.

Never expose API keys with a `NEXT_PUBLIC_` prefix.

## Production checklist

1. Set `NEXT_PUBLIC_LEGAL_NAME` and `NEXT_PUBLIC_LEGAL_CONTACT`.
2. Configure a real HTTPS domain and redirect HTTP to HTTPS at the host.
3. Set upload size and request time limits at the reverse proxy or host.
4. Keep `/app/tmp` private and verify failed jobs are cleaned up.
5. Test each advertised conversion with representative files.
6. Add monitoring and an abuse/rate-limit layer before public launch.
7. Publish the privacy policy and terms at the same domain as the app.
