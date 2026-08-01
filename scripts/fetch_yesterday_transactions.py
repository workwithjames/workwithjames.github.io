#!/usr/bin/env python3
from __future__ import annotations

# This job always calculates the previous calendar day in Asia/Dubai at runtime.
import json
import re
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
MAX_PAGES = 20
ENDPOINTS = [
    "https://www.dxbdata.xyz/api/transactions",
    "https://dxbdata.xyz/api/transactions",
    "https://dxbdata.io/api/transactions",
]


def transaction_date(value: object) -> str:
    if value is None:
        return ""
    raw = str(value).strip()
    match = re.search(r"\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", raw)
    if match:
        try:
            return datetime(int(match.group(1)), int(match.group(2)), int(match.group(3))).date().isoformat()
        except ValueError:
            pass
    match = re.search(r"\b(\d{1,2})[-/](\d{1,2})[-/](20\d{2})\b", raw)
    if match:
        try:
            return datetime(int(match.group(3)), int(match.group(2)), int(match.group(1))).date().isoformat()
        except ValueError:
            pass
    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=DUBAI)
        return parsed.astimezone(DUBAI).date().isoformat()
    except ValueError:
        return ""


def row_key(row: dict) -> str:
    for key in ("id", "transaction_id", "procedure_id"):
        if row.get(key) not in (None, ""):
            return f"{key}:{row[key]}"
    fields = (
        row.get("instance_date"), row.get("area_name_en"), row.get("building_name_en"),
        row.get("property_sub_type_en"), row.get("procedure_area"), row.get("actual_worth"),
        row.get("project_name_en"), row.get("reg_type_en"),
    )
    return json.dumps(fields, ensure_ascii=False, default=str)


def fetch_page(session: requests.Session, endpoint: str, params: dict[str, object]) -> list[dict]:
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
        except Exception as exc:
            last_error = exc
            if attempt < 3:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def fetch_pages(session: requests.Session, endpoint: str, base_params: dict[str, object]) -> tuple[list[dict], bool]:
    collected: list[dict] = []
    seen_rows: set[str] = set()
    seen_pages: set[str] = set()
    reached_limit = True
    for page in range(MAX_PAGES):
        params = dict(base_params)
        params.update({"limit": PAGE_SIZE, "offset": page * PAGE_SIZE, "sort": "instance_date", "order": "DESC"})
        batch = fetch_page(session, endpoint, params)
        signature = json.dumps([
            len(batch),
            row_key(batch[0]) if batch else "",
            row_key(batch[-1]) if batch else "",
        ])
        if signature in seen_pages:
            reached_limit = False
            break
        seen_pages.add(signature)
        for row in batch:
            key = row_key(row)
            if key not in seen_rows:
                seen_rows.add(key)
                collected.append(row)
        if len(batch) < PAGE_SIZE:
            reached_limit = False
            break
    return collected, reached_limit


def candidate_for_endpoint(session: requests.Session, endpoint: str, requested: str) -> tuple[list[dict], str, bool] | None:
    exact_rows, exact_capped = fetch_pages(session, endpoint, {"from_date": requested, "to_date": requested})
    exact = [row for row in exact_rows if transaction_date(row.get("instance_date")) == requested]
    if exact:
        return exact, requested, exact_capped

    source_rows = exact_rows
    source_capped = exact_capped
    if not source_rows:
        source_rows, source_capped = fetch_pages(session, endpoint, {})

    available_dates = sorted({
        transaction_date(row.get("instance_date"))
        for row in source_rows
        if transaction_date(row.get("instance_date")) and transaction_date(row.get("instance_date")) <= requested
    })
    if not available_dates:
        return None
    selected = available_dates[-1]
    selected_rows = [row for row in source_rows if transaction_date(row.get("instance_date")) == selected]
    return selected_rows, selected, source_capped


def fetch_best(requested: str) -> tuple[list[dict], str, str, bool]:
    session = requests.Session()
    session.headers.update({
        "Accept": "application/json",
        "User-Agent": "JamesRaviPreviousDayTransactions/1.1 (+https://workwithjames.github.io/)",
    })
    errors: list[str] = []
    best: tuple[list[dict], str, str, bool] | None = None
    for endpoint in ENDPOINTS:
        try:
            candidate = candidate_for_endpoint(session, endpoint, requested)
            if not candidate:
                continue
            rows, selected, capped = candidate
            if selected == requested:
                return rows, selected, endpoint, capped
            if best is None or selected > best[1]:
                best = (rows, selected, endpoint, capped)
        except Exception as exc:
            errors.append(f"{endpoint}: {exc}")
    if best:
        return best
    raise RuntimeError(" | ".join(errors) or "No dated transaction records were returned")


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


def build_snapshot(rows: list[dict], requested: str, selected: str, endpoint: str, capped: bool) -> dict:
    values = [as_number(row.get("actual_worth")) for row in rows]
    positive_values = [value for value in values if value > 0]
    by_area: dict[str, dict[str, float]] = defaultdict(lambda: {"count": 0, "value": 0.0})
    for row in rows:
        area = str(row.get("area_name_en") or "Area not specified").strip() or "Area not specified"
        by_area[area]["count"] += 1
        by_area[area]["value"] += as_number(row.get("actual_worth"))

    top_areas = [
        {"area": area, "count": int(stats["count"]), "value_aed": round(stats["value"], 2)}
        for area, stats in sorted(by_area.items(), key=lambda item: (-item[1]["count"], -item[1]["value"], item[0]))[:12]
    ]
    return {
        "status": "success" if rows else "no_records",
        "requested_date": requested,
        "target_date": selected,
        "is_fallback": selected != requested,
        "generated_at": datetime.now(DUBAI).isoformat(timespec="seconds"),
        "source_endpoint": endpoint,
        "total_transactions": len(rows),
        "total_value_aed": round(sum(values), 2),
        "median_sale_price_aed": round(statistics.median(positive_values), 2) if positive_values else 0,
        "areas_count": len(by_area),
        "top_areas": top_areas,
        "latest_transactions": [compact_row(row) for row in rows[:25]],
        "capped": capped,
        "message": (
            f"Completed exact previous-day snapshot for {selected}."
            if selected == requested
            else f"No records dated {requested} were available; showing the latest completed day, {selected}."
        ),
    }


def main() -> int:
    requested = (datetime.now(DUBAI).date() - timedelta(days=1)).isoformat()
    try:
        rows, selected, endpoint, capped = fetch_best(requested)
        snapshot = build_snapshot(rows, requested, selected, endpoint, capped)
        OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Saved {snapshot['total_transactions']} transactions for {selected}; requested {requested}; source {endpoint}")
        return 0
    except Exception as exc:
        print(f"Previous-day snapshot refresh failed for {requested}: {exc}", file=sys.stderr)
        print("Existing successful snapshot was preserved.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
