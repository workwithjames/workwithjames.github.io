# Google Search Console setup

James SEO now contains the Google Search Console OAuth and data-sync implementation. Production activation requires a Google Cloud OAuth client.

## Google Cloud configuration

1. In Google Cloud Console, create or select a project for James SEO.
2. Enable the **Google Search Console API**.
3. Configure the OAuth consent screen.
4. Create an **OAuth 2.0 Client ID** of type **Web application**.
5. Add this exact authorized redirect URI:

   `https://seo.jamesrealty.uk/api/gsc/callback`

6. The application requests only:

   `https://www.googleapis.com/auth/webmasters.readonly`

## GitHub repository secrets

Add these under `workwithjames/workwithjames.github.io` → Settings → Secrets and variables → Actions:

- `GSC_CLIENT_ID` — Google OAuth client ID.
- `GSC_CLIENT_SECRET` — Google OAuth client secret.
- `GSC_TOKEN_ENCRYPTION_KEY` — a long random secret used to encrypt stored Google access/refresh tokens at rest. Use at least 32 random bytes / 43+ URL-safe characters and keep it stable across deployments.

The deployment workflow pushes these values into Cloudflare Worker Secrets when all three are present. If they are absent, the platform remains usable but Search Console shows a setup-required state.

## Product flow

Per project:

1. Open **Keywords**.
2. Choose **Connect Google**.
3. Authorize read-only Search Console access.
4. Select the matching Search Console property (`sc-domain:example.com` or URL-prefix property).
5. Run **Sync 28 Days**.

The platform stores the latest Search Console snapshots in D1 for Keywords and Content intelligence. Google Search Console performance data commonly trails by roughly 2–3 days, so the sync window intentionally ends three days before the current date.
