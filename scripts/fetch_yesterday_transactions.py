#!/usr/bin/env python3
from __future__ import annotations

import json
import statistics
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlencode
from zoneinfo import ZoneInfo

import requests

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "yesterday-transactions.json"
DUBAI = ZoneInfo("Asia/Dubai")
PAGE_SIZE = 500
MAX_PAGES = 40
ENDPOINTS = [
    "https://www.dxbdata.xyz/api/transactions",
    "https://dxbdata.xyz/api/transactions",
    "https://dxbdata.io/api/transactions",
]


def transaction_date(value: object) -> str:
    if value is None:
        return ""
    raw = str(value).strip()
    if len(raw) >= 10 and raw[4] == "-" and raw[7] == "-":
        return raw[:10]
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=DUBAI)
        return parsed.astimezone(DUBAI).date().isoformat()
    except ValueError:
        return ""


def fetch_page(session: requests.Session, endpoint: str, target: str, offset: int) -> list[dict]:
    params = {
        "from_date": target,
        "to_date": target,
        "limit": PAGE_SIZE,
        "offset": offset,
        "sort": "instance_date",
        "order": "DESC",
    }
    url = f"{endpoint}?{urlencode(params)}"
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            response = session.get(url, timeout=45)
            response.raise_for_status()
            payload = response.json()
            rows = payload.get("data") if isinstance(payload, dict) else None
            if not isinstance(rows, list):
                raise RuntimeError("Unexpected transaction response")
            return [row for row in rows if isinstance(row, dict)]
        except Exception as exc:  # network and malformed response retries
            last_error = exc
            if attempt < 3:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def fetch_all(target: str) -> tuple[list[dict], str, bool]:
    session = requests.Session()
    session.headers.update({
        "Accept": "application/json",
        "User-Agent": "JamesRaviYesterdayTransactions/1.0 (+https://workwithjames.github.io/)",
    })
    errors: list[str] = []
    for endpoint in ENDPOINTS:
        try:
            rows: list[dict] = []
            for page in range(MAX_PAGES):
                batch = fetch_page(session, endpoint, target, page * PAGE_SIZE)
                rows.extend(batch)
                if len(batch) < PAGE_SIZE:
                    break
            filtered = [row for row in rows if transaction_date(row.get("instance_date")) == target]
            return filtered, endpoint, len(rows) >= PAGE_SIZE * MAX_PAGES
        except Exception as exc:
            errors.append(f"{endpoint}: {exc}")
    raise RuntimeError(" | ".join(errors))


def as_number(value: object) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def compact_row(row: dict) -> dict:
    return {
        "instance_date": transaction_date(row.get("instance_date")),
        "area_name_en": str(row.get("area_name_en") or "Not specified"),
        "property_type_en": str(row.get("property_type_en") or ""),
        "property_sub_type_en": str(row.get("property_sub_type_en") or ""),
        "procedure_area": as_number(row.get("procedure_area")),
        "actual_worth": as_number(row.get("actual_worth")),
        "reg_type_en": str(row.get("reg_type_en") or ""),
        "project_name_en": str(row.get("project_name_en") or ""),
    }


def build_snapshot(rows: list[dict], target: str, endpoint: str, capped: bool) -> dict:
    values = [as_number(row.get("actual_worth")) for row in rows]
    positive_values = [value for value in values if value > 0]
    by_area: dict[str, dict[str, float]] = defaultdict(lambda: {"count": 0, "value": 0.0})
    for row in rows:
        area = str(row.get("area_name_en") or "Area not specified").strip() or "Area not specified"
        by_area[area]["count"] += 1
        by_area[area]["value"] += as_number(row.get("actual_worth"))

    top_areas = [
        {"area": area, "count": int(stats["count"]), "value_aed": round(stats["value"], 2)}
        for area, stats in sorted(
            by_area.items(),
            key=lambda item: (-item[1]["count"], -item[1]["value"], item[0]),
        )[:12]
    ]
    latest = [compact_row(row) for row in rows[:25]]
    return {
        "status": "success" if rows else "no_records",
        "target_date": target,
        "generated_at": datetime.now(DUBAI).isoformat(timespec="seconds"),
        "source_endpoint": endpoint,
        "total_transactions": len(rows),
        "total_value_aed": round(sum(values), 2),
        "median_sale_price_aed": round(statistics.median(positive_values), 2) if positive_values else 0,
        "areas_count": len(by_area),
        "top_areas": top_areas,
        "latest_transactions": latest,
        "capped": capped,
        "message": (
            f"Completed snapshot for {target}."
            if rows
            else f"The public source returned no transactions dated {target}."
        ),
    }


def main() -> int:
    target = (datetime.now(DUBAI).date() - timedelta(days=1)).isoformat()
    try:
        rows, endpoint, capped = fetch_all(target)
        snapshot = build_snapshot(rows, target, endpoint, capped)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Saved {snapshot['total_transactions']} transactions for {target} from {endpoint}")
        return 0
    except Exception as exc:
        print(f"Yesterday snapshot refresh failed for {target}: {exc}", file=sys.stderr)
        print("Existing snapshot was preserved.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
