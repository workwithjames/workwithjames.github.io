import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const endpoint = process.env.AJMAN_SNAPSHOT_SOURCE || 'https://jamesrealty.uk/api/ajman-data';
const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
if (!response.ok) throw new Error(`Ajman snapshot source returned ${response.status}`);
const payload = await response.json();
if (!payload.ok || !Array.isArray(payload.sales) || !payload.sales.length) {
  throw new Error('Ajman snapshot source returned no usable sales rows');
}
delete payload.fallback;
delete payload.fallbackReason;
const target = path.join(root, 'data', 'ajman-market', 'latest.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(payload)}\n`);
console.log(`Saved ${payload.sales.length} sales rows and ${(payload.mortgages || []).length} mortgage rows.`);
