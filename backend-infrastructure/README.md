# James Platform Backend Infrastructure

This branch is isolated from the live GitHub Pages site. It contains a portable Docker-based backend for the future CRM, browser extension, API, and dynamic websites.

## Included

- PostgreSQL 16
- Initial CRM schema: companies, contacts, lists, campaigns, activities, suppressions
- Authenticated Node.js API
- Caddy HTTPS reverse proxy
- Docker Compose deployment
- Ubuntu bootstrap script
- PostgreSQL backup script

## Target domains

- `api.jamesrealty.uk` -> API server
- `crm.jamesrealty.uk` -> future CRM frontend
- `jamesrealty.uk` remains on GitHub Pages until intentionally migrated

## Server deployment

1. Provision Ubuntu 24.04 ARM64 or AMD64 VM.
2. Open inbound TCP 22, 80 and 443 in the cloud firewall/security list.
3. SSH into the server.
4. Install Git, then clone this repository on the `backend-infrastructure` branch.
5. Run `sudo bash backend-infrastructure/scripts/bootstrap-ubuntu.sh`.
6. `cd backend-infrastructure`.
7. Copy `.env.example` to `.env` and replace every `CHANGE_TO_...` value with a long random secret.
8. Point the `api.jamesrealty.uk` DNS record to the VM public IP.
9. Run `docker compose up -d --build`.
10. Test `https://api.jamesrealty.uk/health`.

## Security notes

- Never commit `.env` or database backups.
- PostgreSQL is not exposed to the public internet by this Compose configuration.
- Only Caddy exposes ports 80/443; API traffic is proxied internally.
- The initial API key is a bootstrap mechanism. Replace it with user authentication/JWT before multi-user CRM access.
- Keep the Oracle/VM network security rules limited to SSH, HTTP and HTTPS.

## API examples

Health check (no key required):

```bash
curl https://api.jamesrealty.uk/health
```

Create a company:

```bash
curl -X POST https://api.jamesrealty.uk/v1/companies \
  -H "x-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"name":"Example Properties","domain":"example.com","country":"UAE"}'
```

Create a contact:

```bash
curl -X POST https://api.jamesrealty.uk/v1/contacts \
  -H "x-api-key: YOUR_API_KEY" \
  -H "content-type: application/json" \
  -d '{"first_name":"Sarah","last_name":"Jones","job_title":"Marketing Director","email":"sarah.jones@example.com","source":"browser-extension"}'
```

## Backup

Run from the backend directory:

```bash
set -a; source .env; set +a
bash scripts/backup-postgres.sh
```

Backups should eventually be copied off-server to object storage as well.
