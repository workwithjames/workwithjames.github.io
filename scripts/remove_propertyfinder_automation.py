#!/usr/bin/env python3
from __future__ import annotations

import base64
import gzip
import json
import math
import re
import shutil
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
DUBAI_TZ = ZoneInfo("Asia/Dubai")
NOW = datetime.now(DUBAI_TZ)

TARGET_SLUGS = {
    "property-news-2026-08-01-dubai-property-market-update-decision-checks-from-property-64546",
    "property-news-2026-08-01-uae-property-market-update-decision-checks-from-property-f-0ea9f",
}
TARGET_TITLES = {
    "UAE property market update: decision checks from Property Finder",
    "Dubai property market update: decision checks from Property Finder",
}
TARGET_URL_PARTS = tuple(f"/blog/{slug}/" for slug in TARGET_SLUGS)


def contains_target(value: object) -> bool:
    text = str(value or "")
    return any(part in text for part in TARGET_URL_PARTS) or text in TARGET_TITLES


def clean_json(value: object) -> object | None:
    if isinstance(value, dict):
        for key in ("url", "@id", "headline", "name", "title"):
            if key in value and contains_target(value[key]):
                return None
        cleaned: dict = {}
        for key, child in value.items():
            result = clean_json(child)
            if result is not None:
                cleaned[key] = result
        item_list = cleaned.get("itemListElement")
        if isinstance(item_list, list):
            for index, item in enumerate(item_list, start=1):
                if isinstance(item, dict) and "position" in item:
                    item["position"] = index
            if "numberOfItems" in cleaned:
                cleaned["numberOfItems"] = len(item_list)
        main_entity = cleaned.get("mainEntity")
        if isinstance(main_entity, dict) and isinstance(main_entity.get("itemListElement"), list):
            items = main_entity["itemListElement"]
            for index, item in enumerate(items, start=1):
                if isinstance(item, dict) and "position" in item:
                    item["position"] = index
            main_entity["numberOfItems"] = len(items)
        return cleaned
    if isinstance(value, list):
        cleaned_list = []
        for child in value:
            result = clean_json(child)
            if result is not None:
                cleaned_list.append(result)
        for index, item in enumerate(cleaned_list, start=1):
            if isinstance(item, dict) and "position" in item:
                item["position"] = index
        return cleaned_list
    return value


def clean_html(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    original = text

    # Remove complete blog cards for the deleted articles.
    for slug in TARGET_SLUGS:
        card_pattern = re.compile(
            r'<article class="blog-tile">(?:(?!</article>).)*?href="/blog/'
            + re.escape(slug)
            + r'/"(?:(?!</article>).)*?</article>',
            re.S,
        )
        text = card_pattern.sub("", text)
        text = re.sub(
            r'<a\b[^>]*href="/blog/' + re.escape(slug) + r'/"[^>]*>.*?</a>',
            "",
            text,
            flags=re.S,
        )

    # Remove target items from JSON-LD while preserving other structured data.
    pattern = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
    offset = 0
    output = []
    for match in pattern.finditer(text):
        output.append(text[offset:match.start()])
        raw = match.group(1)
        try:
            parsed = json.loads(raw)
            cleaned = clean_json(parsed)
            if cleaned is None:
                replacement = ""
            else:
                replacement = '<script type="application/ld+json">' + json.dumps(
                    cleaned, ensure_ascii=False, separators=(",", ":")
                ) + "</script>"
        except Exception:
            replacement = match.group(0)
        output.append(replacement)
        offset = match.end()
    output.append(text[offset:])
    text = "".join(output)

    # Remove Property Finder from automation descriptions.
    replacements = {
        "Khaleej Times, Gulf News, The National, Arabian Business and Property Finder":
            "Khaleej Times, Gulf News, The National and Arabian Business",
        "Khaleej Times, Gulf News, The National, Arabian Business, and Property Finder":
            "Khaleej Times, Gulf News, The National, and Arabian Business",
        "from five monitored publishers": "from four monitored publishers",
        "all five publisher pages": "all four publisher pages",
        "checks five UAE property news and blog sources": "checks four UAE property news sources",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    # Remove accidental empty related-link containers.
    text = re.sub(r'<div class="news-related">\s*</div>', "", text)

    if text != original:
        path.write_text(text, encoding="utf-8")


def clean_publisher_script() -> None:
    path = ROOT / "scripts" / "property_news_autopublish.py"
    text = path.read_text(encoding="utf-8")
    original = text

    # Permanently remove the Property Finder source dictionary.
    text, removed = re.subn(
        r'\n    \{\n        "name": "Property Finder",\n.*?\n    \},(?=\n\])',
        "",
        text,
        count=1,
        flags=re.S,
    )
    if removed != 1:
        raise RuntimeError("Could not locate the Property Finder source block")

    replacements = {
        "checks five UAE property news and blog sources": "checks four UAE property news sources",
        "Khaleej Times, Gulf News, The National, Arabian Business and Property Finder":
            "Khaleej Times, Gulf News, The National and Arabian Business",
        "Khaleej Times, Gulf News, The National, Arabian Business, and Property Finder":
            "Khaleej Times, Gulf News, The National, and Arabian Business",
        "from five monitored publishers": "from four monitored publishers",
        "all five publisher pages": "all four publisher pages",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    if text == original:
        raise RuntimeError("Publisher script was not changed")
    path.write_text(text, encoding="utf-8")

    # Rebuild the compressed source payload used by GitHub Actions.
    chunk_dir = ROOT / ".automation" / "property-news-script"
    chunks = sorted(chunk_dir.glob("chunk-*.txt"))
    count = max(1, len(chunks))
    payload = base64.b64encode(gzip.compress(text.encode("utf-8"), mtime=0)).decode("ascii")
    size = math.ceil(len(payload) / count)
    for index in range(count):
        content = payload[index * size:(index + 1) * size]
        (chunk_dir / f"chunk-{index:02d}.txt").write_text(content, encoding="utf-8")


def clean_state() -> None:
    path = ROOT / "data" / "property-news-state.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["posts"] = [
        post for post in data.get("posts", [])
        if post.get("slug") not in TARGET_SLUGS
        and post.get("source_name") != "Property Finder"
        and not contains_target(post.get("title"))
    ]
    data["seen_urls"] = [
        url for url in data.get("seen_urls", [])
        if "propertyfinder.ae" not in str(url).lower()
    ]
    data["updated_at"] = NOW.isoformat(timespec="seconds")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def clean_feed() -> None:
    path = ROOT / "feed.xml"
    if not path.exists():
        return
    tree = ET.parse(path)
    root = tree.getroot()
    channel = root.find("channel")
    if channel is None:
        return
    for item in list(channel.findall("item")):
        link = item.findtext("link") or ""
        title = item.findtext("title") or ""
        if contains_target(link) or title in TARGET_TITLES or "Property Finder" in title:
            channel.remove(item)
    last = channel.find("lastBuildDate")
    if last is not None:
        last.text = NOW.strftime("%a, %d %b %Y %H:%M:%S %z")
    ET.indent(tree, space="  ")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
    path.write_text(xml, encoding="utf-8")


def clean_sitemap() -> None:
    path = ROOT / "sitemap.xml"
    if not path.exists():
        return
    tree = ET.parse(path)
    root = tree.getroot()
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    for node in list(root.findall(f"{{{namespace}}}url")):
        loc = node.findtext(f"{{{namespace}}}loc") or ""
        if contains_target(loc):
            root.remove(node)
    ET.register_namespace("", namespace)
    ET.indent(tree, space="  ")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
    path.write_text(xml, encoding="utf-8")


def delete_generated_files() -> None:
    for slug in TARGET_SLUGS:
        article_dir = ROOT / "blog" / slug
        if article_dir.exists():
            shutil.rmtree(article_dir)
        image = ROOT / "images" / "property-news" / f"{slug}.svg"
        if image.exists():
            image.unlink()


def main() -> None:
    clean_publisher_script()
    clean_state()
    delete_generated_files()
    clean_feed()
    clean_sitemap()
    for path in ROOT.rglob("*.html"):
        clean_html(path)

    # Remove this one-time cleanup after it completes.
    workflow = ROOT / ".github" / "workflows" / "remove-propertyfinder.yml"
    if workflow.exists():
        workflow.unlink()
    Path(__file__).unlink()


if __name__ == "__main__":
    main()
