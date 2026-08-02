#!/usr/bin/env python3
"""Notify IndexNow when public website URLs are added or changed."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://jamesrealty.uk"
HOST = "jamesrealty.uk"
KEY = "b782b0613099424091aa61a82410ff57"
KEY_LOCATION = f"{SITE}/{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"


def changed_paths(before: str, after: str) -> list[str]:
    if not before or set(before) == {"0"}:
        result = subprocess.run(
            ["git", "ls-files"], cwd=ROOT, check=True, capture_output=True, text=True
        )
    else:
        result = subprocess.run(
            ["git", "diff", "--name-only", before, after],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def public_url(path: str) -> str | None:
    item = PurePosixPath(path)
    if any(part.startswith(".") for part in item.parts):
        return None
    if item.name == "index.html":
        parent = item.parent.as_posix()
        return SITE + ("/" if parent == "." else f"/{parent}/")
    if item.suffix.lower() in {".xml", ".txt", ".webp", ".png", ".jpg", ".jpeg", ".svg"}:
        return f"{SITE}/{item.as_posix()}"
    return None


def sitemap_urls() -> list[str]:
    sitemap = ROOT / "sitemap.xml"
    if not sitemap.exists():
        return [SITE + "/"]
    root = ET.fromstring(sitemap.read_text(encoding="utf-8"))
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [node.text for node in root.findall("s:url/s:loc", namespace) if node.text]


def submit(urls: list[str]) -> int:
    clean = sorted({url for url in urls if url.startswith(SITE + "/")})[:10000]
    if not clean:
        print("No public URLs changed; IndexNow notification skipped.")
        return 0
    payload = json.dumps(
        {"host": HOST, "key": KEY, "keyLocation": KEY_LOCATION, "urlList": clean}
    ).encode("utf-8")
    request = urllib.request.Request(
        ENDPOINT,
        data=payload,
        headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": "JamesRealty-IndexNow/1.0"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            status = response.status
    except urllib.error.HTTPError as exc:
        print(f"IndexNow rejected the notification with HTTP {exc.code}.", file=sys.stderr)
        return 1
    except urllib.error.URLError as exc:
        print(f"IndexNow could not be reached: {exc.reason}", file=sys.stderr)
        return 1
    print(f"IndexNow accepted {len(clean)} URL notification(s) with HTTP {status}.")
    return 0 if status in {200, 202} else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--diff", nargs=2, metavar=("BEFORE", "AFTER"))
    parser.add_argument("--all", action="store_true")
    args = parser.parse_args()
    if args.all:
        urls = sitemap_urls()
    elif args.diff:
        urls = [url for path in changed_paths(*args.diff) if (url := public_url(path))]
        if urls:
            urls.extend(f"{SITE}/{name}" for name in ("sitemap.xml", "image-sitemap.xml", "feed.xml"))
    else:
        parser.error("choose --diff BEFORE AFTER or --all")
    return submit(urls)


if __name__ == "__main__":
    raise SystemExit(main())
