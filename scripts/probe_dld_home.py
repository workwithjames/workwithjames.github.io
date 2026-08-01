#!/usr/bin/env python3
import json,re
from pathlib import Path
from urllib.parse import urljoin,urlparse
import requests

base='https://dubailand.gov.ae/en/'
out=Path(__file__).resolve().parents[1]/'data/dld-home-probe.json'
s=requests.Session();s.headers.update({'User-Agent':'Mozilla/5.0 (compatible; JamesRaviDataProbe/1.0)','Accept-Language':'en-US,en;q=0.9'})
result={'base':base}
try:
 r=s.get(base,timeout=60);r.raise_for_status();html=r.text
 result.update({'status':r.status_code,'final_url':r.url,'html_length':len(html)})
 scripts=[urljoin(r.url,x) for x in re.findall(r'<script[^>]+src=["\']([^"\']+)',html,re.I)]
 result['scripts']=scripts
 patterns=['daily transaction','total transactions','total sales','mortgaged','gifts','transaction']
 snippets=[]
 low=html.lower()
 for p in patterns:
  start=0
  while True:
   i=low.find(p,start)
   if i<0:break
   snippets.append(html[max(0,i-250):i+500])
   start=i+len(p)
   if len(snippets)>=30:break
  if len(snippets)>=30:break
 result['html_snippets']=snippets
 result['api_like_urls']=sorted(set(re.findall(r'https?://[^"\'<>\\\s]+',html)))[:200]
 js_matches=[]
 for src in scripts[:30]:
  try:
   jr=s.get(src,timeout=45)
   if jr.status_code!=200 or len(jr.content)>8_000_000:continue
   text=jr.text; lower=text.lower()
   if any(k in lower for k in ['totaltransactions','dailytransaction','total transactions','totalmortgage','transactionsummary']):
    hits=[]
    for key in ['totaltransactions','dailytransaction','total transactions','totalmortgage','transactionsummary','/api/']:
     pos=lower.find(key)
     if pos>=0:hits.append(text[max(0,pos-500):pos+1000])
    js_matches.append({'src':src,'length':len(text),'snippets':hits[:8]})
  except Exception as e:
   js_matches.append({'src':src,'error':repr(e)})
 result['js_matches']=js_matches[:20]
except Exception as e:result['error']=repr(e)
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(out)
