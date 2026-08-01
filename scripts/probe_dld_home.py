#!/usr/bin/env python3
import json,re
from pathlib import Path
import requests

out=Path(__file__).resolve().parents[1]/'data/dld-home-probe.json'
s=requests.Session();s.headers.update({'User-Agent':'Mozilla/5.0 (compatible; JamesRaviDataProbe/1.3)','Accept-Language':'en-US,en;q=0.9'})
config_url='https://dubailand.gov.ae/Umbraco/Api/Utils/ConfigJs'
api_url='https://dubailand.gov.ae/scripts/api/TransactionsApi.js'
result={}
for name,url in [('config',config_url),('api_script',api_url)]:
 try:
  r=s.get(url,timeout=60);r.raise_for_status();text=r.text
  item={'status':r.status_code,'length':len(text)}
  if name=='config':
   item['projection_direct']=re.findall(r'["\']projectionAPI["\']\s*:\s*["\']([^"\']+)',text,re.I)
   item['projection_loose']=re.findall(r'projectionAPI.{0,80}?(https?://[^"\'\\\s]+)',text,re.I|re.S)
   item['projection_context']=re.findall(r'.{0,200}projectionAPI.{0,300}',text,re.I|re.S)[:10]
   item['gateway_direct']=re.findall(r'["\']gateway["\']\s*:\s*["\']([^"\']+)',text,re.I)
  else:
   item['date_counter_path']=re.findall(r'dateWiseCounters[^"\']*',text,re.I)[:10]
   item['top_counter_path']=re.findall(r'topNCounters[^"\']*',text,re.I)[:10]
  result[name]=item
 except Exception as e:result[name]={'error':repr(e)}
out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(out)
