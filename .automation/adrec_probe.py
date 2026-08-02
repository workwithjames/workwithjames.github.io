import json
import re
from pathlib import Path
from urllib.parse import urlencode

import requests

BASE = "https://adrec.gov.ae"
PAGE = f"{BASE}/en/market-data"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36",
    "Accept-Language": "en-AE,en;q=0.9",
    "Accept": "application/json, text/plain, */*",
    "Referer": PAGE,
    "Origin": BASE,
    "X-Requested-With": "XMLHttpRequest",
}

session = requests.Session()
page_response = session.get(PAGE, headers=HEADERS, timeout=45)
page_response.raise_for_status()

script_urls = {
    "global": f"{BASE}/adrec-assets/js/market-data/MarketDataGlobal.js",
    "cards": f"{BASE}/adrec-assets/js/market-data/market-cards.js",
    "lease_cards": f"{BASE}/adrec-assets/js/market-data/lease-cards.js",
    "transactions": f"{BASE}/adrec-assets/js/market-data/MarketDataTransactionScriptAPI.js",
    "sales_asset": f"{BASE}/adrec-assets/js/market-data/MarketDataSalesByAssetScriptAPI.js",
    "resi_sales": f"{BASE}/adrec-assets/js/market-data/MarketDataResiSalesScriptAPI.js",
    "finance": f"{BASE}/adrec-assets/js/market-data/MarketDataResiFinanceScriptAPI.js",
    "recent": f"{BASE}/adrec-assets/js/market-data/RecentSalesTable.js",
    "lease_units": f"{BASE}/adrec-assets/js/market-data/LeaseResidentialUnit.js",
    "lease_values": f"{BASE}/adrec-assets/js/market-data/LeaseResidentialPrice.js",
    "avg_rents": f"{BASE}/adrec-assets/js/market-data/AverageAnnualRentsAPI.js",
    "sale_indices": f"{BASE}/adrec-assets/js/market-data/SalePriceIndices.js",
    "rent_indices": f"{BASE}/adrec-assets/js/market-data/RentPriceIndices.js",
    "sale_rent": f"{BASE}/adrec-assets/js/market-data/SalePricesOverTimeAPI.js",
}

scripts = {}
for name, url in script_urls.items():
    response = session.get(url, headers=HEADERS, timeout=45)
    scripts[name] = {
        "url": url,
        "status": response.status_code,
        "length": len(response.content),
        "text": response.text if response.ok else "",
    }


def snippets(text, needles, radius=1600):
    result = {}
    lower = text.lower()
    for needle in needles:
        positions = []
        offset = 0
        while True:
            position = lower.find(needle.lower(), offset)
            if position < 0:
                break
            positions.append(position)
            offset = position + len(needle)
        result[needle] = [text[max(0, p - radius):p + radius] for p in positions[:5]]
    return result


js_inspection = {}
for name, item in scripts.items():
    text = item["text"]
    js_inspection[name] = {
        "url": item["url"],
        "status": item["status"],
        "length": item["length"],
        "snippets": snippets(
            text,
            [
                "fetchAPI",
                "waitForTokenReady",
                "token",
                "Authorization",
                "X-CSRF",
                "TotalTransactionalValue",
                "TotalTransactionalVolume",
                "GetSalePriceIndex",
                "GetRentPriceIndex",
                "GetRentedResiUnits",
                "TotalTransactionsByType",
                "GetTotalSalesByAsset",
                "ResiSaleTransactionsByPeriod",
                "RecentSales",
                "ResiRentedUnitsByPeriod",
                "ResiRentedValueByPeriod",
                "ResiSalePriceIndexByArea",
                "ResiRentPriceIndexByArea",
                "ResiRentSalePricesByArea",
            ],
            1200,
        ),
    }


api_tests = [
    ("transaction_value", "/api/feature/MarketData/TotalTransactionalValue", {"language": "en"}),
    ("transaction_volume", "/api/feature/MarketData/TotalTransactionalVolume", {"language": "en"}),
    ("apartment_sale_index", "/api/feature/MarketData/GetSalePriceIndex", {"propertyType": "apartment", "language": "en"}),
    ("villa_sale_index", "/api/feature/MarketData/GetSalePriceIndex", {"propertyType": "villa", "language": "en"}),
    ("rented_units", "/api/feature/MarketData/GetRentedResiUnits", {"language": "en"}),
    ("apartment_rent_index", "/api/feature/MarketData/GetRentPriceIndex", {"propertyType": "apartment", "language": "en"}),
    ("villa_rent_index", "/api/feature/MarketData/GetRentPriceIndex", {"propertyType": "villa", "language": "en"}),
    ("transaction_chart", "/api/feature/MarketData/TotalTransactionsByType", {
        "txnType": "all",
        "assetClass": "all",
        "statisticTimeAggregation": "monthly",
        "statisticDescription": "AED",
        "language": "en",
    }),
    ("sales_asset_chart", "/api/feature/MarketData/GetTotalSalesByAsset", {
        "assetClass": "all",
        "area": "all",
        "statisticTimeAggregation": "monthly",
        "statisticDescription": "AED",
        "language": "en",
    }),
    ("resi_sales_chart", "/api/feature/MarketData/ResiSaleTransactionsByPeriod", {
        "propertyType": "all",
        "area": "all",
        "propertyLayout": "all",
        "statisticTimeAggregation": "yearly",
        "statisticDescription": "AED",
        "language": "en",
    }),
    ("recent_sales", "/api/feature/MarketData/RecentSales", {
        "page": 0,
        "size": 10,
        "fromDate": "2026-07-01",
        "toDate": "2026-08-02",
        "language": "en",
    }),
]

results = {}
for name, path, params in api_tests:
    url = f"{BASE}{path}?{urlencode(params)}"
    try:
        response = session.get(url, headers=HEADERS, timeout=45)
        content_type = response.headers.get("content-type", "")
        try:
            body = response.json() if "json" in content_type.lower() else response.text[:12000]
        except Exception:
            body = response.text[:12000]
        results[name] = {
            "url": url,
            "status": response.status_code,
            "content_type": content_type,
            "headers": dict(response.headers),
            "body": body,
        }
    except Exception as exc:
        results[name] = {"url": url, "error": str(exc)}

output = {
    "page": {
        "url": PAGE,
        "status": page_response.status_code,
        "cookies": session.cookies.get_dict(),
        "length": len(page_response.content),
    },
    "javascript": js_inspection,
    "api_tests": results,
}
Path(".automation/adrec-probe-result.json").write_text(
    json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8"
)
Path(".automation/adrec-debug-request").unlink(missing_ok=True)
