#!/usr/bin/env python3
"""Give every automated property-news brief a relevant local editorial photo.

The publisher does not copy third-party publisher images. This post-processor uses
James Realty's own 16:9 assets, corrects old SVG placeholders and any earlier
misclassification, and keeps article cards/state/feed references aligned.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / "data" / "property-news-state.json"
SITE = "https://jamesrealty.uk"

POOLS: dict[str, list[tuple[str, str]]] = {
    "abu_dhabi": [
        ("/images/abu-dhabi-property-market-h1-2026.webp", "Abu Dhabi residential skyline representing current property-market activity"),
        ("/images/property-news/adgm-broker-rankings-buyers-tenants-guide.webp", "Abu Dhabi property advisory setting representing a real-estate market update"),
    ],
    "rental": [
        ("/images/dubai-tenant-guest-access.webp", "Residential apartment setting representing UAE tenancy and rental-market decisions"),
        ("/images/dubai-shared-housing-guide.webp", "UAE residential building representing rental-market and tenancy decisions"),
    ],
    "luxury": [
        ("/images/dubai-residential-portfolio.webp", "High-end UAE residences representing luxury property-market activity"),
        ("/images/dubai-portfolio-optimized.webp", "Premium UAE residential towers representing luxury property-market analysis"),
    ],
    "supply": [
        ("/images/property-news/dubai-h1-2026-delivery-led-property-cycle.webp", "Modern residential towers representing new housing delivery and supply"),
        ("/images/property-news/dubai-24800-new-homes-buyer-choice-2026.webp", "New residential homes representing housing supply and buyer choice"),
        ("/images/dubai-community-buying-guide.webp", "Modern residential community representing housing supply and buyer choice"),
    ],
    "buyer": [
        ("/images/property-news/dubai-residents-buying-long-term-homes.webp", "Home viewing representing UAE buyer decision-making and long-term ownership"),
        ("/images/dubai-community-buying-guide.webp", "Residential community representing UAE homebuyer decision-making"),
    ],
    "market": [
        ("/images/dubai-residential-portfolio.webp", "UAE residential towers representing current property-market analysis"),
        ("/images/dubai-portfolio-optimized.webp", "UAE residential skyline representing property-market activity and investment analysis"),
        ("/images/dubai-community-buying-guide.webp", "Modern UAE residential community representing current property-market activity"),
    ],
}


def stable_pick(slug: str, pool: list[tuple[str, str]]) -> tuple[str, str]:
    digest = hashlib.sha1(slug.encode("utf-8")).hexdigest()
    return pool[int(digest[:8], 16) % len(pool)]


def article_signal(slug: str, page_text: str) -> str:
    """Use only article-owned text; never navigation or related-link copy."""
    bits = [slug]
    for pattern in (
        r'<h1>(.*?)</h1>',
        r'<p class="article-deck">(.*?)</p>',
        r'<meta property="og:title" content="([^"]*)"',
        r'<meta name="description" content="([^"]*)"',
    ):
        match = re.search(pattern, page_text, flags=re.S | re.I)
        if match:
            bits.append(re.sub(r'<[^>]+>', ' ', match.group(1)))
    return html.unescape(' '.join(bits)).lower()


def choose_photo(slug: str, page_text: str) -> tuple[str, str]:
    text = article_signal(slug, page_text)
    is_abu_dhabi = "abu dhabi" in text or "abu-dhabi" in text
    is_rental = any(word in text for word in ("rent", "rental", "tenant", "tenancy", "lease"))
    if is_abu_dhabi and is_rental:
        return "/images/abu-dhabi-rent-freeze.webp", "Tenant reviewing tenancy documents in an Abu Dhabi apartment"
    if is_abu_dhabi:
        return stable_pick(slug, POOLS["abu_dhabi"])
    if is_rental:
        return stable_pick(slug, POOLS["rental"])
    if any(word in text for word in ("luxury", "ultra-prime", "ultra prime", "villa", "record sale", "trophy")):
        return stable_pick(slug, POOLS["luxury"])
    if any(word in text for word in ("supply", "delivery", "deliveries", "handover", "handovers", "new homes", "new units")):
        return stable_pick(slug, POOLS["supply"])
    if any(word in text for word in ("buyer", "homebuyer", "buying", "long-term home", "long term home")):
        return stable_pick(slug, POOLS["buyer"])
    return stable_pick(slug, POOLS["market"])


def current_hero(text: str) -> str | None:
    match = re.search(
        r'<figure class="article-hero-image news-brief-visual"><img\s+src="([^"]+)"',
        text,
        flags=re.I,
    )
    return match.group(1) if match else None


def update_article(path: Path, old_image: str, new_image: str, alt: str) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    text = text.replace(old_image, new_image)
    text = re.sub(
        r'(<meta property="og:image:alt" content=")[^"]*("/>)',
        lambda m: m.group(1) + html.escape(alt, quote=True) + m.group(2),
        text,
        count=1,
    )
    hero = re.compile(
        r'(<figure class="article-hero-image news-brief-visual"><img\s+src="'
        + re.escape(new_image)
        + r'"\s+alt=")[^"]*("\s+width="1600"\s+height="900")([^>]*)(/>)'
    )

    def hero_repl(match: re.Match[str]) -> str:
        attrs = match.group(3)
        if "fetchpriority=" not in attrs:
            attrs += ' fetchpriority="high"'
        if "decoding=" not in attrs:
            attrs += ' decoding="async"'
        return match.group(1) + html.escape(alt, quote=True) + match.group(2) + attrs + match.group(4)

    text = hero.sub(hero_repl, text, count=1)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def update_card_surface(path: Path, selections: dict[str, tuple[str, str]]) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    original = text
    for slug, (image_path, alt) in selections.items():
        href = f'/blog/{slug}/'
        card_pattern = re.compile(
            r'<article class="blog-tile">(?:(?!</article>).)*?href="' + re.escape(href)
            + r'"(?:(?!</article>).)*?</article>',
            flags=re.S,
        )
        match = card_pattern.search(text)
        if not match:
            continue
        card = re.sub(
            r'(<img\s+src=")[^"]*("\s+alt=")[^"]*(")',
            lambda m: m.group(1) + image_path + m.group(2) + html.escape(alt, quote=True) + m.group(3),
            match.group(0),
            count=1,
        )
        text = text[:match.start()] + card + text[match.end():]
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def update_xml_blocks(path: Path, selections: dict[str, tuple[str, str]]) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    original = text
    blocks = re.compile(r'<(?:item|entry|url)\b.*?</(?:item|entry|url)>', flags=re.S | re.I)
    rebuilt: list[str] = []
    last = 0
    for match in blocks.finditer(text):
        block = match.group(0)
        replacement = block
        for slug, (image_path, _alt) in selections.items():
            if f'/blog/{slug}/' not in replacement:
                continue
            replacement = re.sub(r'/images/property-news/[^<"\s]+\.(?:svg|webp)', image_path, replacement)
            replacement = re.sub(r'https://jamesrealty\.uk/images/[^<"\s]+\.webp', SITE + image_path, replacement)
            break
        if replacement != block:
            rebuilt.append(text[last:match.start()])
            rebuilt.append(replacement)
            last = match.end()
    if rebuilt:
        rebuilt.append(text[last:])
        text = ''.join(rebuilt)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def update_state(selections: dict[str, tuple[str, str]]) -> bool:
    if not STATE_PATH.exists():
        return False
    state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    changed = False

    def walk(value):
        nonlocal changed
        if isinstance(value, dict):
            slug = value.get("slug")
            if isinstance(slug, str) and slug in selections and "image" in value:
                new_image = selections[slug][0]
                if value.get("image") != new_image:
                    value["image"] = new_image
                    changed = True
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(state)
    if changed:
        STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return changed


def main() -> int:
    selections: dict[str, tuple[str, str]] = {}
    old_svgs: set[str] = set()
    updated_pages = 0

    for page in sorted(ROOT.glob("blog/property-news-*/index.html")):
        text = page.read_text(encoding="utf-8")
        if "Automated source brief" not in text or "news-brief-visual" not in text:
            continue
        slug = page.parent.name
        old_image = current_hero(text)
        if not old_image:
            continue
        new_image, alt = choose_photo(slug, text)
        selections[slug] = (new_image, alt)
        if old_image.endswith(".svg"):
            old_svgs.add(old_image)
        if update_article(page, old_image, new_image, alt):
            updated_pages += 1

    update_card_surface(ROOT / "blog" / "index.html", selections)
    update_card_surface(ROOT / "blog" / "property-news" / "index.html", selections)
    update_xml_blocks(ROOT / "feed.xml", selections)
    update_xml_blocks(ROOT / "image-sitemap.xml", selections)
    update_state(selections)

    removed = 0
    for image_path in old_svgs:
        file = ROOT / image_path.lstrip("/")
        if file.exists():
            file.unlink()
            removed += 1

    print(f"Property-news imagery checked: {len(selections)} automated briefs; updated {updated_pages} pages; removed {removed} SVG placeholders.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
