import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const pages = [
  ['emaar','emaar.jamesrealty.uk'],['aldar','aldar.jamesrealty.uk'],['damac','damac.jamesrealty.uk'],
  ['binghatti','binghatti.jamesrealty.uk'],['nakheel','nakheel.jamesrealty.uk'],['mudon','mudon.jamesrealty.uk'],
  ['uk','dubai.jamesrealty.uk'],['usa','dubairealestate.jamesrealty.uk'],['india','dubaiproperties.jamesrealty.uk'],
  ['ar','dubaiproperty.jamesrealty.uk'],
];
const errors = [];
const records = [];
const fail = (page,message)=>errors.push(`${page}: ${message}`);
const first = (html,re)=>html.match(re)?.[1] || '';
const strip = html => html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z#0-9]+;/gi,' ').replace(/\s+/g,' ').trim().toLowerCase();
const shingles = text => {
  const words = text.split(/\s+/).filter(Boolean);
  const set = new Set();
  for (let i=0;i<=words.length-5;i++) set.add(words.slice(i,i+5).join(' '));
  return set;
};

for (const [slug,host] of pages) {
  const file = path.join(ROOT,'landing',slug,'index.html');
  if (!fs.existsSync(file)) { fail(slug,'missing index.html'); continue; }
  const html = fs.readFileSync(file,'utf8');
  const title = first(html,/<title>([^<]+)<\/title>/i);
  const description = first(html,/<meta name="description" content="([^"]+)"/i);
  const canonical = first(html,/<link rel="canonical" href="([^"]+)"/i);
  const heroImage = first(html,/<img class="jr-hero__image" src="([^"]+)"/i);
  const heroAlt = first(html,/<img class="jr-hero__image"[^>]+alt="([^"]+)"/i);
  const h1s = (html.match(/<h1\b/gi)||[]).length;
  const h2s = (html.match(/<h2\b/gi)||[]).length;
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match=>match[1]));
  const anchorTargets = [...html.matchAll(/href="#([^"]+)"/g)].map(match=>match[1]);

  if (canonical !== `https://${host}/`) fail(slug,`wrong canonical: ${canonical}`);
  if (!/name="robots" content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/.test(html)) fail(slug,'fallback robots directive is missing');
  if (h1s !== 1) fail(slug,`expected one H1, found ${h1s}`);
  if (h2s < 5) fail(slug,`too few H2 sections: ${h2s}`);
  if (!heroAlt || heroAlt.length < 25) fail(slug,'hero ALT text is missing or weak');
  if (!heroImage.startsWith('https://jamesrealty.uk/images/landing/')) fail(slug,'hero image is not a local optimized asset');
  const imagePath = heroImage.replace('https://jamesrealty.uk/',ROOT + '/');
  if (!fs.existsSync(imagePath)) fail(slug,`hero image file missing: ${imagePath}`);
  if (!/width="1600" height="900"/.test(html)) fail(slug,'hero intrinsic dimensions missing');
  if (!/data-whatsapp-landing/.test(html) || !/name="name"/.test(html) || !/name="email"/.test(html) || !/name="phone"/.test(html) || !/name="budget"/.test(html)) fail(slug,'lead form fields are incomplete');
  if (!/landing-experience\.js/.test(html) || !/GTM-M74SL57L/.test(html)) fail(slug,'analytics or interaction script missing');
  if (!/FAQPage/.test(html) || !/RealEstateAgent/.test(html)) fail(slug,'required structured data missing');
  if (/assets\/(site|landing-pages|header-goal-nav)\.js|footer-shell|header-shell/.test(html)) fail(slug,'global site chrome remains on landing page');
  for (const target of anchorTargets) if (!ids.has(target)) fail(slug,`broken in-page anchor #${target}`);
  try {
    const json = first(html,/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    JSON.parse(json);
  } catch (error) { fail(slug,`invalid JSON-LD: ${error.message}`); }
  if (slug==='ar' && !/<html lang="ar-AE" dir="rtl">/.test(html)) fail(slug,'Arabic language or RTL direction missing');
  if (slug!=='ar' && /dir="rtl"/.test(html)) fail(slug,'unexpected RTL direction');

  records.push({slug,host,title,description,heroImage,text:strip(html)});
}

for (const field of ['title','description','heroImage']) {
  const values = new Map();
  for (const row of records) {
    if (values.has(row[field])) fail(row.slug,`duplicate ${field} with ${values.get(row[field])}`);
    values.set(row[field],row.slug);
  }
}

for (let i=0;i<records.length;i++) {
  for (let j=i+1;j<records.length;j++) {
    const a=shingles(records[i].text), b=shingles(records[j].text);
    const intersection=[...a].filter(value=>b.has(value)).length;
    const score=intersection/(a.size+b.size-intersection || 1);
    if (score>.34) fail(`${records[i].slug}/${records[j].slug}`,`copy similarity too high: ${score.toFixed(3)}`);
  }
}

const worker = fs.readFileSync(path.join(ROOT,'cloudflare','landing-subdomains-worker.js'),'utf8');
const wrangler = fs.readFileSync(path.join(ROOT,'cloudflare','wrangler.jsonc'),'utf8');
for (const [,host] of pages) {
  if (!worker.includes(`'${host}'`)) fail('worker',`missing host map for ${host}`);
  if (!wrangler.includes(`"pattern": "${host}"`)) fail('wrangler',`missing custom domain for ${host}`);
}
if (!worker.includes("headers.set('x-robots-tag', 'index, follow')")) fail('worker','indexable canonical response header missing');

console.log(JSON.stringify({
  pages:records.map(row=>({slug:row.slug,host:row.host,titleLength:row.title.length,descriptionLength:row.description.length,heroImage:path.basename(row.heroImage)})),
  summary:{pagesChecked:records.length,errors:errors.length},errors,
},null,2));

if (errors.length) process.exit(1);
