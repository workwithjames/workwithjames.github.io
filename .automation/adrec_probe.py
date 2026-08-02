import json
from pathlib import Path
import requests

BASE='https://adrec.gov.ae'
URL=f'{BASE}/adrec-assets/js/market-data/MarketDataGlobal.js'
HEADERS={'User-Agent':'Mozilla/5.0','Referer':f'{BASE}/en/market-data','Accept-Language':'en-AE,en;q=0.9'}
r=requests.get(URL,headers=HEADERS,timeout=45)
r.raise_for_status()
text=r.text

def extracts(needle,radius=3500):
    out=[]; start=0; low=text.lower(); key=needle.lower()
    while True:
        i=low.find(key,start)
        if i<0: break
        out.append(text[max(0,i-radius):i+radius])
        start=i+len(key)
        if len(out)>=8: break
    return out

output={
 'url':URL,
 'status':r.status_code,
 'length':len(text),
 'fetchAPI':extracts('fetchAPI'),
 'waitForTokenReady':extracts('waitForTokenReady'),
 'tokenReady':extracts('tokenReady'),
 'Authorization':extracts('Authorization'),
 'csrf':extracts('csrf'),
 'accessToken':extracts('accessToken'),
 'fetchOnce':extracts('fetchOnce'),
}
Path('.automation/adrec-request-flow.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
Path('.automation/adrec-debug-request').unlink(missing_ok=True)
