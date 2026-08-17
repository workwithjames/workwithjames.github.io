#!/usr/bin/env python3
"""Replace automated property-news SVG placeholders with editorial site photography.

The property-news publisher deliberately does not copy source-publisher images. This
post-processing step reuses James Realty's own local 16:9 editorial assets, updates
article/social/index references, and removes generated placeholder SVGs.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / "data" / "property-news-state.json"

# All assets below already belong to this site and are suitable as editorial hero
# photography. Pools are deliberately varied so consecutive automated briefs do not
# all show the same image.
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


def choose_photo(slug: str, page_text: str) -> tuple[str, str]:
    text = (slug + " " + page_text[:9000]).lower()
    if "abu dhabi" in text or "abu-dhabi" in text:
        if any(word in text for word in ("rent", "rental", "tenant", "tenancy")):
            return (
                "/images/abu-dhabi-rent-freeze.webp",
                "Tenant reviewing tenancy documents in an Abu Dhabi apartment",
            )
        return stable_pick(slug, POOLS["abu_dhabi"])
    if any(word in text for word in ("rent", "rental", "tenant", "tenancy", "lease")):
        return stable_pick(slug, POOLS["rental"])
    if any(word in text for word in ("luxury", "ultra-prime", "ultra prime", "villa", "record sale", "trophy")):
        return stable_pick(slug, POOLS["luxury"])
    if any(word in text for word in ("supply", "delivery", "deliveries", "handover", "handovers", "new homes", "new units")):
        return stable_pick(slug, POOLS["supply"])
    if any(word in text for word in ("buyer", "homebuyer", "buying", "long-term home", "long term home")):
        return stable_pick(slug, POOLS["buyer"])
    return stable_pick(slug, POOLS["market"])


def update_article_page(path: Path, old_image: str, new_image: str, alt: str) -> bool:
    text = path.read_text(encoding="utf-8")
    if old_image not in text:
        return False

    text = text.replace(old_image, new_image)
    # Each automated article has one article-level OG image alt.
    text = re.sub(
        r'(<meta property="og:image:alt" content=")[^"]*("/>)',
        lambda m: m.group(1) + alt + m.group(2),
        text,
        count=1,
    )
    # Match the visible hero after its src has been replaced.
    hero_pattern = re.compile(
        r'(<figure class="article-hero-image(?: news-brief-visual)?"><img\s+src="'
        + re.escape(new_image)
        + r'"\s+alt=")[^"]*("\s+width="1600"\s+height="900")([^>]*)(/>)'
    )

    def hero_repl(match: re.Match[str]) -> str:
        attrs = match.group(3)
        if "fetchpriority=" not in attrs:
            attrs += ' fetchpriority="high"'
        if "decoding=" not in attrs:
            attrs += ' decoding="async"'
        return match.group(1) + alt + match.group(2) + attrs + match.group(4)

    text = hero_pattern.sub(hero_repl, text, count=1)
    path.write_text(text, encoding="utf-8")
    return True


def replace_image_refs(path: Path, replacements: dict[str, tuple[str, str]]) -> bool:
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    original = text
    for old_image, (new_image, alt) in replacements.items():
        text = text.replace(old_image, new_image)
        # Blog cards place src immediately before alt; keep their accessible text
        # aligned with the new photographic asset.
        text = re.sub(
            r'(<img\s+src="' + re.escape(new_image) + r'"\s+alt=")[^"]*(")',
            lambda m, replacement_alt=alt: m.group(1) + replacement_alt + m.group(2),
            text,
        )
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def replace_json_strings(value, replacements: dict[str, tuple[str, str]]):
    if isinstance(value, str):
        return replacements.get(value, (value, ""))[0]
    if isinstance(value, list):
        return [replace_json_strings(item, replacements) for item in value]
    if isinstance(value, dict):
        return {key: replace_json_strings(item, replacements) for key, item in value.items()}
    return value


def main() -> int:
    replacements: dict[str, tuple[str, str]] = {}
    upgraded_pages = 0

    for page in sorted(ROOT.glob("blog/property-news-*/index.html")):
        slug = page.parent.name
        old_image = f"/images/property-news/{slug}.svg"
        text = page.read_text(encoding="utf-8")
        if old_image not in text:
            continue
        new_image, alt = choose_photo(slug, text)
        replacements[old_image] = (new_image, alt)
        if update_article_page(page, old_image, new_image, alt):
            upgraded_pages += 1

    if not replacements:
        print("No automated SVG hero images need upgrading.")
        return 0

    # Update every generated surface that can contain an article image URL.
    for relative in (
        "blog/index.html",
        "blog/property-news/index.html",
        "feed.xml",
        "image-sitemap.xml",
    ):
        replace_image_refs(ROOT / relative, replacements)

    # Persist the new image URLs so the next publisher run does not reintroduce
    # SVG references when it rebuilds the hub, cards, feed or image sitemap.
    if STATE_PATH.exists():
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
        updated_state = replace_json_strings(state, replacements)
        STATE_PATH.write_text(
            json.dumps(updated_state, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    removed = 0
    for old_image in replacements:
        placeholder = ROOT / old_image.lstrip("/")
        if placeholder.exists():
            placeholder.unlink()
            removed += 1

    print(
        f"Upgraded {upgraded_pages} automated property-news hero images; "
        f"removed {removed} obsolete SVG placeholders."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
