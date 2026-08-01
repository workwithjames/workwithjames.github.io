#!/usr/bin/env python3
from __future__ import annotations
import hashlib, html, json, re, sys, time
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import xml.etree.ElementTree as ET
import feedparser, requests
from bs4 import BeautifulSoup
from dateutil import parser as dtparse

ROOT=Path(__file__).resolve().parents[1]; SITE="https://jamesrealty.uk"
STATE=ROOT/'data/official-news-state.json'; BLOG=ROOT/'blog/index.html'; POSTS=ROOT/'blog/official-updates'; FEED=ROOT/'feed.xml'; MAP=ROOT/'sitemap.xml'
START='<!-- AUTO_OFFICIAL_UPDATES_START -->'; END='<!-- AUTO_OFFICIAL_UPDATES_END -->'; TZ=timezone(timedelta(hours=4))
UA='JamesRaviOfficialNewsMonitor/1.0 (+https://jamesrealty.uk/blog/)'
S=requests.Session(); S.headers.update({'User-Agent':UA,'Accept-Language':'en-AE,en;q=0.9'})
SOURCES=[
 {'id':'adrec','name':'Abu Dhabi Real Estate Centre (ADREC)','topic':'Abu Dhabi real estate','context':'ADREC announcements can affect Abu Dhabi property regulation, tenancy, market transparency, brokers, developers, owners, tenants and investors.','list':['https://adrec.gov.ae/en/News','https://adrec.gov.ae/en/news-center'],'feeds':[],'maps':['https://adrec.gov.ae/sitemap.xml','https://adrec.gov.ae/sitemap_index.xml'],'allow':r'^https://(?:www\.)?adrec\.gov\.ae/en/news/.+'},
 {'id':'dld','name':'Dubai Land Department (DLD)','topic':'Dubai real estate','context':'DLD announcements can affect Dubai property transactions, regulation, tenancy, brokerage, developer services, ownership and market participants.','list':['https://dubailand.gov.ae/en/','https://dubailand.gov.ae/en/news-media/'],'feeds':[],'maps':['https://dubailand.gov.ae/sitemap.xml','https://dubailand.gov.ae/sitemap_index.xml'],'allow':r'^https://(?:www\.)?dubailand\.gov\.ae/en/news-media/.+'},
 {'id':'dari','name':'DARI Abu Dhabi','topic':'Abu Dhabi digital real estate services','context':'DARI updates can affect Abu Dhabi digital property services, transaction processes, verified listings, brokers, developers, owners and tenants.','list':['https://services.dari.ae/news/'],'feeds':['https://services.dari.ae/news/feed/','https://services.dari.ae/feed/'],'maps':['https://services.dari.ae/wp-sitemap.xml','https://services.dari.ae/sitemap_index.xml'],'allow':r'^https://services\.dari\.ae/news/(?!page(?:/|$)|category(?:/|$)|tag(?:/|$)|author(?:/|$)).+'},
 {'id':'parkin','name':'Parkin Company PJSC','topic':'Dubai parking and mobility','context':'Parkin announcements can affect parking tariffs, zones, permits, subscriptions, mobility services, motorists, businesses and urban access.','list':['https://www.parkin.ae/news-room','https://www.parkin.ae/blog','https://www.parkin.ae/'],'feeds':[],'maps':['https://www.parkin.ae/sitemap.xml','https://www.parkin.ae/sitemap_index.xml'],'allow':r'^https://(?:www\.)?parkin\.ae/(?:news|blog)/.+'},
 {'id':'dmt','name':'Department of Municipalities and Transport (DMT/TAMM)','topic':'Abu Dhabi municipalities, planning and transport','context':'DMT announcements can affect Abu Dhabi planning, municipal services, roads, transport, infrastructure, public spaces, development approvals and government services delivered through TAMM.','list':['https://www.dmt.gov.ae/en/Media-Centre/News','https://www.dmt.gov.ae/en/Media-Centre'],'feeds':[],'maps':['https://www.dmt.gov.ae/sitemap.xml','https://www.dmt.gov.ae/sitemap_index.xml'],'allow':r'^https://(?:www\.)?dmt\.gov\.ae/en/Media-Centre/News/.+'},
 {'id':'srerd','name':'Sharjah Real Estate Registration Department (SRERD)','topic':'Sharjah real estate','context':'SRERD announcements can affect Sharjah property registration, ownership, development projects, market reporting, regulation, investors and real estate professionals.','list':['https://www.shjrerd.gov.ae/','https://www.shjrerd.gov.ae/en/','https://www.shjrerd.gov.ae/en/news','https://www.shjrerd.gov.ae/en/media-center','https://www.shjrerd.gov.ae/en/media-center/news'],'feeds':[],'maps':['https://www.shjrerd.gov.ae/sitemap.xml','https://www.shjrerd.gov.ae/sitemap_index.xml','https://www.shjrerd.gov.ae/en/sitemap.xml'],'allow':r'^https://(?:www\.)?shjrerd\.gov\.ae/(?:en/)?(?:news|media|media-center|article|press)(?:/.*)?$'}]

@dataclass
class A:
 source_id:str; source_name:str; source_url:str; title:str; published_iso:str; local_slug:str; local_url:str; context:str; topic:str

def now(): return datetime.now(TZ)
def log(x): print(x,flush=True)
def norm(u,b=''):
 u=html.unescape((u or '').strip()).replace('\\/','/'); u=urljoin(b,u) if b else u; p=urlsplit(u)
 if p.scheme not in ('http','https') or not p.netloc:return ''
 path=re.sub('/+','/',p.path or '/'); path=path.rstrip('/') if path!='/' else path
 return urlunsplit((p.scheme.lower(),p.netloc.lower(),path,'',''))
def get(u,xml=False):
 for i in range(3):
  try:
   r=S.get(u,timeout=30,headers={'Accept':'application/xml,text/xml,*/*'} if xml else None)
   if r.status_code==200:return r
   if r.status_code not in (403,429,500,502,503,504):break
  except requests.RequestException:pass
  time.sleep(i+1)
 log('Fetch failed: '+u); return None
def date(v):
 if not v:return None
 try:
  d=dtparse.parse(str(v),fuzzy=True); return (d.replace(tzinfo=TZ) if d.tzinfo is None else d.astimezone(TZ))
 except Exception:return None
def add(out,u,s,title='',hint=''):
 u=norm(u)
 if u and re.search(s['allow'],u,re.I) and not re.search(r'\.(pdf|jpe?g|png|gif|webp|svg|docx?|xlsx?)$',u,re.I):
  old=out.setdefault(u,{'title':title.strip(),'date':hint}); old['title']=old['title'] or title.strip(); old['date']=old['date'] or hint
def sitemap(url,s,out,seen=None):
 seen=seen or set(); url=norm(url)
 if not url or url in seen or len(seen)>12:return
 seen.add(url); r=get(url,True)
 if not r:return
 try: root=ET.fromstring(r.content)
 except ET.ParseError:return
 is_index=root.tag.rsplit('}',1)[-1].lower()=='sitemapindex'
 for node in root:
  loc=''; lm=''
  for c in node:
   n=c.tag.rsplit('}',1)[-1].lower(); loc=(c.text or '').strip() if n=='loc' else loc; lm=(c.text or '').strip() if n=='lastmod' else lm
  if not loc:continue
  if is_index:sitemap(loc,s,out,seen)
  else:add(out,loc,s,hint=lm)
def discover(s):
 out={}
 for u in s['feeds']:
  r=get(u,True)
  if r:
   for e in feedparser.parse(r.content).entries:add(out,e.get('link',''),s,e.get('title',''),e.get('published','') or e.get('updated',''))
 for u in s['maps']:sitemap(u,s,out)
 for u in s['list']:
  r=get(u)
  if not r:continue
  soup=BeautifulSoup(r.text,'html.parser')
  for a in soup.select('a[href]'):add(out,norm(a.get('href',''),r.url),s,a.get_text(' ',strip=True))
  raw=r.text.replace('\\/','/')
  for x in re.findall(r'https?://[^\s\"\'<>]+',raw):add(out,x,s)
  for x in re.findall(r'[\"\'](/[^\"\'<>\s]+)[\"\']',raw):add(out,norm(x,r.url),s)
 log(f"{s['name']}: {len(out)} URLs"); return out
def meta(soup,attr,val):
 t=soup.find('meta',attrs={attr:re.compile('^'+re.escape(val)+'$',re.I)}); return re.sub(r'\s+',' ',t.get('content','')).strip() if t else ''
def extract(u,h,s):
 r=get(u)
 if not r:return None
 soup=BeautifulSoup(r.text,'html.parser'); title=meta(soup,'property','og:title') or meta(soup,'name','twitter:title')
 if not title:
  x=soup.find(['h1','h2']); title=x.get_text(' ',strip=True) if x else h.get('title','')
 if not title and soup.title:title=soup.title.get_text(' ',strip=True)
 title=html.unescape(re.sub(r'\s+',' ',title)).strip(' -|–—')[:220]
 if len(title)<8:return None
 vals=[meta(soup,'property','article:published_time'),meta(soup,'name','date'),meta(soup,'itemprop','datePublished'),h.get('date','')]
 vals += [t.get('datetime','') or t.get_text(' ',strip=True) for t in soup.find_all('time')]
 d=next((x for x in map(date,vals) if x and datetime(2000,1,1,tzinfo=TZ)<=x<=now()+timedelta(days=2)),None)
 if not d:
  text=re.sub(r'\s+',' ',soup.get_text(' ',strip=True)); m=re.search(r'\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20\d{2}\b',text,re.I); d=date(m.group(0)) if m else now()
 return title,d
def slug(v):return re.sub(r'[^a-z0-9]+','-',v.lower()).strip('-')[:76] or 'official-update'
def topic(t,s):
 x=t.lower(); rules=[(('rent','tenant','lease','ejari','tawtheeq'),'Tenancy and rental regulation'),(('transaction','market','investment','mortgage','price'),'Property market and investment'),(('broker','developer','licen','registration','regulat','law'),'Real estate regulation and services'),(('parking','tariff','zone','permit','mobility'),'Parking and mobility'),(('road','bridge','transport','infrastructure','planning','municip'),'Urban development and transport'),(('digital','platform','service','app','technology'),'Government digital services')]
 return next((name for keys,name in rules if any(k in x for k in keys)),s['topic'])
def make(s,u,t,d):
 sl=slug(s['id']+' '+t)+'-'+hashlib.sha1(u.encode()).hexdigest()[:8]
 return A(s['id'],s['name'],u,t,d.isoformat(),sl,f'{SITE}/blog/official-updates/{sl}/',s['context'],topic(t,s))
def shown(iso):d=date(iso) or now(); return f'{d.day} {d:%B %Y}'
def page(a):
 e=lambda x:html.escape(str(x)); q=lambda x:html.escape(str(x),quote=True); day=(date(a.published_iso) or now()).date().isoformat()
 schema=json.dumps({'@context':'https://schema.org','@type':'BlogPosting','headline':a.title,'datePublished':a.published_iso,'dateModified':a.published_iso,'mainEntityOfPage':a.local_url,'author':{'@id':SITE+'/about-me/#james-ravi'},'publisher':{'@id':SITE+'/about-me/#james-ravi'},'citation':a.source_url,'isBasedOn':a.source_url,'inLanguage':'en-AE'},ensure_ascii=False).replace('</','<\\/')
 return f'''<!DOCTYPE html><html lang="en-AE"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/5576f66c8ff02a6a.css?v=12"/><title>{e(a.title)} | Official UAE Update</title><meta name="description" content="Official source alert for {q(a.title)}, published by {q(a.source_name)}."/><meta name="robots" content="index,follow,max-snippet:-1"/><link rel="canonical" href="{q(a.local_url)}"/><meta property="og:type" content="article"/><meta property="og:title" content="{q(a.title)}"/><meta property="article:published_time" content="{q(a.published_iso)}"/><script type="application/ld+json">{schema}</script><link rel="alternate" type="application/rss+xml" href="{SITE}/feed.xml"/><script async src="https://www.googletagmanager.com/gtag/js?id=G-2MPZL26C6D"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){{dataLayer.push(arguments)}}gtag('js',new Date());gtag('config','G-2MPZL26C6D');</script><script defer src="/assets/site.js?v=3"></script></head><body><a class="skip-link" href="#main-content">Skip to main content</a><header class="site-header"><nav class="nav-shell"><a class="brand" href="/">James Ravi</a><div class="nav-links global-links"><a href="/">Dubai Data</a><a href="/abu-dhabi-data/">Abu Dhabi Data</a><a href="/about-me/">About Me</a><a href="/blog/" aria-current="page">Blog</a><a href="/contact/">Contact Me</a></div><a class="button nav-cta nav-whatsapp" href="https://wa.me/971528420933">Work with James ↗</a></nav></header><main id="main-content"><article class="article-page"><header class="article-header section-shell"><nav class="breadcrumbs"><a href="/">Home</a><span>›</span><a href="/blog/">Blog</a><span>›</span><span>Official update</span></nav><p class="section-kicker">{e(a.topic)}</p><h1>{e(a.title)}</h1><p class="article-deck">{e(a.source_name)} published a new official update. This automated alert provides context and links to the complete source publication.</p><div class="article-byline"><span>Source: <a href="{q(a.source_url)}" target="_blank" rel="noopener noreferrer">{e(a.source_name)}</a></span><time datetime="{day}">Published {shown(a.published_iso)}</time><span>2 min read</span></div></header><div class="article-layout section-shell"><aside class="article-toc"><strong>On this page</strong><a href="#published">What was published</a><a href="#context">Why it matters</a><a href="#source">Official source</a></aside><div class="article-body"><section class="answer-box" id="published"><p class="card-kicker">Official source alert</p><h2>What was published?</h2><p><strong>{e(a.source_name)}</strong> published an update titled “{e(a.title)}” on {shown(a.published_iso)}.</p></section><section id="context"><h2>Why this may matter</h2><p>{e(a.context)}</p><p>Review the full wording, effective date, scope, exceptions and later clarifications before making a property, compliance, transport or investment decision.</p></section><section id="source"><h2>Read the official publication</h2><p>This page does not reproduce the authority's full article or images. The official source remains the controlling publication.</p><p><a class="button button-primary" href="{q(a.source_url)}" target="_blank" rel="noopener noreferrer">Open {e(a.source_name)} ↗</a></p></section></div></div></article></main><footer><div class="section-shell footer-shell footer-shell-rich"><div class="footer-identity"><a class="brand" href="/">James Ravi</a><p>© 2026 James Ravi. Built in Dubai.</p></div><nav class="footer-links"><a href="/">Dubai Data</a><a href="/abu-dhabi-data/">Abu Dhabi Data</a><a href="/about-me/">About Me</a><a href="/blog/">Blog</a><a href="/contact/">Contact</a></nav></div></footer></body></html>'''
def record(r):return A(**{k:r[k] for k in A.__dataclass_fields__})
def section(posts):
 cards=''.join(f'<article class="blog-tile"><div class="blog-tile-copy"><div class="article-meta"><span>{html.escape(a.source_name)}</span><time datetime="{(date(a.published_iso) or now()).date().isoformat()}">{shown(a.published_iso)}</time><span>Official update</span></div><h2><a href="/blog/official-updates/{html.escape(a.local_slug,quote=True)}/">{html.escape(a.title)}</a></h2><p>New public update from {html.escape(a.source_name)}. Open the source-linked alert and the complete official publication.</p><a class="text-link" href="/blog/official-updates/{html.escape(a.local_slug,quote=True)}/">Read update →</a></div></article>' for a in posts[:48])
 body=f'<div class="blog-index-grid">{cards}</div>' if cards else '<p class="article-note">The monitor is active. New official posts will appear here after detection.</p>'
 return START+'<section class="official-update-section" aria-labelledby="official-updates-title"><div class="section-heading"><div><p class="section-kicker">Automated official updates</p><h2 id="official-updates-title">New posts from UAE authorities.</h2></div><p>Checked every 30 minutes. Each alert links to the complete official source.</p></div>'+body+'</section>'+END
def update_index(posts):
 x=BLOG.read_text(); y=section(posts)
 if START in x:x=re.sub(re.escape(START)+'.*?'+re.escape(END),lambda _:y,x,flags=re.S)
 else:
  i=x.find('<aside class="market-promo"'); i=i if i>=0 else x.find('</main>'); x=x[:i]+y+x[i:]
 BLOG.write_text(x)
def update_map(posts):
 if not MAP.exists():return
 x=MAP.read_text(); rows='\n'.join(f'  <url><loc>{html.escape(a.local_url)}</loc><lastmod>{(date(a.published_iso) or now()).date().isoformat()}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>' for a in posts)
 y=START+'\n'+rows+('\n' if rows else '')+END
 x=re.sub(re.escape(START)+'.*?'+re.escape(END),y,x,flags=re.S) if START in x else x.replace('</urlset>',y+'\n</urlset>'); MAP.write_text(x)
def update_feed(posts):
 if not FEED.exists():return
 try:tree=ET.parse(FEED)
 except ET.ParseError:return
 ch=tree.getroot().find('channel')
 if ch is None:return
 for item in list(ch.findall('item')):
  if '/blog/official-updates/' in item.findtext('link',''):ch.remove(item)
 lb=ch.find('lastBuildDate'); lb.text=format_datetime(now()) if lb is not None else None
 pos=next((i+1 for i,n in reversed(list(enumerate(list(ch)))) if n.tag.rsplit('}',1)[-1] in ('link','lastBuildDate')),0)
 for a in reversed(posts[:48]):
  it=ET.Element('item'); ET.SubElement(it,'title').text=a.title; ET.SubElement(it,'link').text=a.local_url; ET.SubElement(it,'guid',{'isPermaLink':'true'}).text=a.local_url; ET.SubElement(it,'pubDate').text=format_datetime(date(a.published_iso) or now()); ET.SubElement(it,'description').text=f'Official source alert for {a.title}, published by {a.source_name}.'; ch.insert(pos,it)
 ET.indent(tree,space='  '); tree.write(FEED,encoding='utf-8',xml_declaration=True)
def save(st):STATE.parent.mkdir(parents=True,exist_ok=True); STATE.write_text(json.dumps(st,indent=2,ensure_ascii=False)+'\n')
def main():
 st=json.loads(STATE.read_text()) if STATE.exists() else {'version':1,'initialized':False,'seen':{},'posts':[],'last_run':None}; found={s['id']:discover(s) for s in SOURCES}
 if not st.get('initialized'):
  for s in SOURCES:st['seen'][s['id']]={u:{'first_seen':now().isoformat()} for u in found[s['id']]}
  st['initialized']=True; st['last_run']=now().isoformat(); posts=[record(x) for x in st['posts']]; update_index(posts); update_map(posts); update_feed(posts); save(st); log('Seeded current URLs; old articles were not back-published.'); return 0
 existing={x['source_url'] for x in st['posts']}; created=0
 for s in SOURCES:
  seen=st['seen'].setdefault(s['id'],{})
  for u,h in list(found[s['id']].items()):
   if u in seen:continue
   seen[u]={'first_seen':now().isoformat()}; z=extract(u,h,s)
   if not z:continue
   t,d=z
   if now()-d>timedelta(days=45) or u in existing:continue
   a=make(s,u,t,d); p=POSTS/a.local_slug/'index.html'; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(page(a)); st['posts'].append(asdict(a)|{'detected_at':now().isoformat()}); existing.add(u); created+=1; log('Published: '+t)
 st['posts'].sort(key=lambda x:x['published_iso'],reverse=True); st['last_run']=now().isoformat(); posts=[record(x) for x in st['posts']]; update_index(posts); update_map(posts); update_feed(posts); save(st); log(f'Complete: {created} new page(s).'); return 0
if __name__=='__main__':sys.exit(main())
