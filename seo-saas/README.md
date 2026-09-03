# James SEO MVP

A multi-tenant-ready SEO intelligence application intended for `seo.jamesrealty.uk`.

## Working in this MVP

- Cloudflare Worker + static application shell
- Live technical site audit API
- Same-origin crawl up to 25 pages per run
- Robots.txt awareness
- HTTP status, title, meta description, H1, canonical, lang, viewport, image alt, thin-content, internal-link and response-time checks
- Site health scoring and page-level diagnostics
- SaaS navigation shell for Projects, Keywords, Rank Tracking, Competitors, Backlinks, Content and AI Search
- D1 multi-tenant schema prepared for users, workspaces, projects, audits, keywords, rankings, competitors and metered usage

## Deployment target

Cloudflare Workers Static Assets + Worker API. Cloudflare currently recommends Workers Static Assets for full-stack Worker applications.

1. `npm install`
2. `npm run check`
3. `npx wrangler whoami`
4. `npm run deploy:dry`
5. `npm run deploy`

The feature branch also includes `.github/workflows/deploy-seo-saas-preview.yml`. On pushes that change `seo-saas/**`, GitHub Actions validates the JavaScript and deploys the isolated `james-seo-mvp` Worker using the repository-level Cloudflare account ID and API token secrets.

For production persistence, create D1 and add the binding to `wrangler.jsonc`, then apply `migrations/0001_initial.sql`.

A custom domain such as `seo.jamesrealty.uk` should be attached only after the Cloudflare account/zone is verified, so the existing James Realty routing is not disturbed.
