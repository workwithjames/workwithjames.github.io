#!/usr/bin/env python3
import json,re
from pathlib import Path
import requests

out=Path(__file__).resolve().parents[1]/'data/dld-home-probe.json'
urls=[
 'https://dubailand.gov.ae/scripts/api/TransactionsApi.js',
 'https://dubailand.gov.ae/scripts/services/transactions-home.js',
 'https://dubailand.gov.ae/Umbraco/Api/Utils/ConfigJs'
]
s=requests.Session();s.headers.update({'User-Agent':'Mozilla/5.0 (compatible; JamesRaviDataProbe/1.2)','Accept-Language':'en-US,en;q=0.9'})
result={'scripts':[]}
for url in urls:
 item={'url':url}
 try:
  r=s.get(url,timeout=60);r.raise_for_status();text=r.text
  item.update({'status':r.status_code,'length':len(text)})
  item['urls']=sorted(set(re.findall(r'https?://[^"\'<>\\\s]+',text)))[:500]
  item['paths']=sorted(set(re.findall(r'["\'](/[^"\'<>\s]{3,200})["\']',text)))[:500]
  item['projection_matches']=re.findall(r'.{0,250}projectionAPI.{0,500}',text,re.I|re.S)[:20]
  item['config_matches']=re.findall(r'.{0,200}(?:projection|counter|areawise).{0,500}',text,re.I|re.S)[:50]
  keys=['datewisecounters','topncounters','transaction','projectionapi','gateway','areawise']
  snippets=[];lower=text.lower()
  for key in keys:
   start=0
   while True:
    pos=lower.find(key,start)
    if pos<0:break
    snippets.append(text[max(0,pos-500):pos+1400])
    start=pos+len(key)
    if len(snippets)>=120:break
   if len(snippets)>=120:break
  item['snippets']=snippets
  if len(text)<=250000:item['full_text']=text
 except Exception as e:item['error']=repr(e)
 result['scripts'].append(item)
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(out)
