# Public release checklist

## Ownership and branding

- Confirm who owns the source code, logo, screenshots, and uploaded assets.
- Replace the copyright holder in `LICENSE` if `ConvertStation` is not the legal owner.
- Decide whether `ConvertStation` and the logo are unregistered marks or registered trademarks. Do not use a registration symbol unless registration exists.
- Confirm every third-party dependency, font, icon, image, and sample file has a compatible license.
- Remove private test files, uploaded samples, credentials, logs, and temporary conversion output before publishing.

## Legal information

- Set `NEXT_PUBLIC_LEGAL_NAME` and `NEXT_PUBLIC_LEGAL_CONTACT`.
- Review `/privacy`, `/terms`, and `/legal` with a qualified lawyer for the jurisdictions where the service will be offered.
- State the actual retention period, hosting providers, analytics, cookies, subprocessors, and support channel.
- Add a data deletion/contact process if the service stores personal data.

## Security and operations

- Deploy behind HTTPS.
- Add authentication or rate limiting if the endpoint is publicly reachable.
- Set maximum upload size and conversion timeouts at the host and reverse proxy.
- Keep temporary files outside the public web root and use a non-persistent volume where practical.
- Scan dependencies and container images before release.
- Test malformed files and interrupted conversions.

## GitHub and LinkedIn

- Create a new public GitHub repository owned by the correct account or organization.
- Add the repository URL, live demo URL, screenshots, feature list, architecture notes, and deployment instructions to `README.md`.
- Use a GitHub Actions build check before accepting changes.
- On LinkedIn, describe the work accurately as a portfolio project and link both the repository and deployed demo.
- Do not imply customer adoption, security certification, trademark registration, or production scale unless those claims are verifiable.
