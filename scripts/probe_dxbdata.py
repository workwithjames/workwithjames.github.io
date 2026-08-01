#!/usr/bin/env python3
import json
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlencode
from zoneinfo import ZoneInfo
import requests

out=Path(__file__).resolve().parents[1]/'data/dxbdata-probe.json'
target=(datetime.now(ZoneInfo('Asia/Dubai')).date()-timedelta(days=1)).isoformat()
endpoint='https://www.dxbdata.xyz/api/transactions'
s=requests.Session();s.headers.update({'Accept':'application/json','User-Agent':'JamesRaviProbe/1.0'})
result={'target':target,'endpoint':endpoint,'generated_at':datetime.now(ZoneInfo('Asia/Dubai')).isoformat()}
for name,params in {
 'filtered':{'from_date':target,'to_date':target,'limit':5,'offset':0,'sort':'instance_date','order':'DESC'},
 'latest':{'limit':5,'offset':0,'sort':'instance_date','order':'DESC'}
}.items():
 try:
  r=s.get(endpoint+'?'+urlencode(params),timeout=45);r.raise_for_status();payload=r.json();rows=payload.get('data',[]) if isinstance(payload,dict) else []
  result[name]={'status':r.status_code,'payload_keys':list(payload.keys()) if isinstance(payload,dict) else [],'row_count':len(rows),'row_keys':list(rows[0].keys()) if rows else [],'rows':rows[:3]}
 except Exception as e:result[name]={'error':repr(e)}
out.write_text(json.dumps(result,ensure_ascii=False,indent=2,default=str)+'\n')
print(out)
