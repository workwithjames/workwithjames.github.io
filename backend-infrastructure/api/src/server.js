import express from 'express';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const port = Number(process.env.API_PORT || 3000);

app.use(express.json({ limit: '1mb' }));

function requireApiKey(req, res, next) {
  if (req.path === '/health') return next();
  const provided = req.get('x-api-key');
  if (!provided || provided !== process.env.API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

app.use(requireApiKey);

app.get('/health', async (_req, res) => {
  try {
    const result = await pool.query('SELECT now() AS db_time');
    res.json({ ok: true, service: 'james-crm-api', db_time: result.rows[0].db_time });
  } catch (error) {
    res.status(503).json({ ok: false, error: 'database_unavailable' });
  }
});

app.get('/v1/contacts', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
  const offset = Math.max(Number(req.query.offset || 0), 0);
  const result = await pool.query(
    `SELECT c.*, co.name AS company_name, co.domain AS company_domain
     FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     ORDER BY c.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  res.json({ data: result.rows, limit, offset });
});

app.post('/v1/contacts', async (req, res) => {
  const body = req.body || {};
  const values = [
    body.company_id || null,
    body.first_name || null,
    body.last_name || null,
    body.full_name || [body.first_name, body.last_name].filter(Boolean).join(' ') || null,
    body.job_title || null,
    body.email || null,
    body.phone || null,
    body.linkedin_url || null,
    body.country || null,
    body.city || null,
    body.source || 'api'
  ];

  const result = await pool.query(
    `INSERT INTO contacts
      (company_id, first_name, last_name, full_name, job_title, email, phone, linkedin_url, country, city, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    values
  );
  res.status(201).json({ data: result.rows[0] });
});

app.get('/v1/companies', async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
  const result = await pool.query('SELECT * FROM companies ORDER BY created_at DESC LIMIT $1', [limit]);
  res.json({ data: result.rows });
});

app.post('/v1/companies', async (req, res) => {
  const body = req.body || {};
  if (!body.name) return res.status(400).json({ error: 'name_required' });
  const result = await pool.query(
    `INSERT INTO companies (name, domain, website, industry, country, city, linkedin_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [body.name, body.domain || null, body.website || null, body.industry || null, body.country || null, body.city || null, body.linkedin_url || null]
  );
  res.status(201).json({ data: result.rows[0] });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`CRM API listening on ${port}`);
});
