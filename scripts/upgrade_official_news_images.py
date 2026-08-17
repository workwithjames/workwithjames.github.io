#!/usr/bin/env python3
"""Add James Realty editorial photography to automated official-source alerts.

The official-news importer intentionally avoids copying authority images. This
post-processing step gives every generated alert a local 16:9 editorial hero,
adds social/structured-data image metadata, and mirrors the same image on the
News index card.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "data" / "official-news-state.json"
BLOG = ROOT / "blog" / "index.html"
SITE = "https://jamesrealty.uk"

SOURCE_IMAGES: dict[str, list[tuple[str, str]]] = {
    "adrec": [
        ("/images/abu-dhabi-property-market-h1-2026.webp", "Abu Dhabi residential skyline representing an official real-estate update"),
        ("/images/abu-dhabi-rent-freeze.webp", "Abu Dhabi residential setting representing an official tenancy or property update"),
    ],
    "dari": [
        ("/images/abu-dhabi-property-market-h1-2026.webp", "Abu Dhabi residential skyline representing a digital real-estate services update"),
        ("/images/abu-dhabi-rent-freeze.webp", "Abu Dhabi residential setting representing a property-services update"),
    ],
    "dld": [
        ("/images/dubai-residential-portfolio.webp", "Dubai residential skyline representing an official property-market update"),
        ("/images/dubai-community-buying-guide.webp", "Dubai residential community representing an official real-estate update"),
    ],
    "parkin": [
        ("/images/dubai-residential-portfolio.webp", "Dubai cityscape representing an official mobility and urban-access update"),
        ("/images/dubai-community-buying-guide.webp", "Dubai community streetscape representing an official mobility update"),
    ],
    "dmt": [
        ("/images/abu-dhabi-property-market-h1-2026.webp", "Abu Dhabi cityscape representing an official planning and transport update"),
        ("/images/abu-dhabi-rent-freeze.webp", "Abu Dhabi urban residential setting representing an official municipal update"),
    ],
    "srerd": [
        ("/images/dubai-community-buying-guide.webp", "UAE residential community representing an official Sharjah real-estate update"),
        ("/images/dubai-residential-portfolio.webp", "UAE residential towers representing an official Sharjah property-market update"),
    ],
}
DEFAULT_IMAGES = [
    ("/images/dubai-residential-portfolio.webp", "UAE residential skyline representing an official property update"),
    ("/images/dubai-community-buying-guide.webp", "UAE residential community representing an official property update"),
]


def pick(source_id: str, slug: str, title: str) -> tuple[str, str]:
    title_l = title.lower()
    if source_id in {"adrec", "dari", "dmt"} and any(x in title_l for x in ("rent", "tenant", "lease", "tawtheeq")):
        return "/images/abu-dhabi-rent-freeze.webp", "Tenant reviewing tenancy documents in an Abu Dhabi apartment"
    pool = SOURCE_IMAGES.get(source_id, DEFAULT_IMAGES)
    digest = hashlib.sha1(slug.encode("utf-8")).hexdigest()
    return pool[int(digest[:8], 16) % len(pool)]


def add_page_image(path: Path, image_path: str, alt: str) -> bool:
    text = path.read_text(encoding="utf-8")
    original = text
    full_image = SITE + image_path

    # Add preload and complete social image metadata.
    if f'href="{image_path}" as="image"' not in text:
        text = text.replace(
            '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
            '<meta name="viewport" content="width=device-width,initial-scale=1"/>'
            f'<link rel="preload" href="{image_path}" as="image"/>',
            1,
        )
    if 'property="og:image"' not in text:
        marker = '<meta property="article:published_time"'
        social = (
            f'<meta property="og:image" content="{html.escape(full_image, quote=True)}"/>'
            f'<meta property="og:image:alt" content="{html.escape(alt, quote=True)}"/>'
            '<meta property="og:image:width" content="1600"/>'
            '<meta property="og:image:height" content="900"/>'
            '<meta name="twitter:card" content="summary_large_image"/>'
            f'<meta name="twitter:image" content="{html.escape(full_image, quote=True)}"/>'
            f'<meta name="twitter:image:alt" content="{html.escape(alt, quote=True)}"/>'
        )
        text = text.replace(marker, social + marker, 1)

    # Add image to BlogPosting structured data.
    def schema_repl(match: re.Match[str]) -> str:
        try:
            data = json.loads(match.group(1))
        except Exception:
            return match.group(0)
        if isinstance(data, dict) and data.get("@type") == "BlogPosting":
            data["image"] = {
                "@type": "ImageObject",
                "url": full_image,
                "width": 1600,
                "height": 900,
                "caption": alt,
            }
            return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + '</script>'
        return match.group(0)

    text = re.sub(r'<script type="application/ld\+json">(.*?)</script>', schema_repl, text, count=1, flags=re.S)

    # Add visible hero immediately after the byline, matching the editorial guides.
    if 'class="article-hero-image"' not in text:
        byline_end = re.search(r'(<div class="article-byline">.*?</div>)', text, flags=re.S)
        if byline_end:
            figure = (
                f'<figure class="article-hero-image"><img src="{image_path}" '
                f'alt="{html.escape(alt, quote=True)}" width="1600" height="900" '
                'fetchpriority="high" decoding="async"/></figure>'
            )
            text = text[:byline_end.end()] + figure + text[byline_end.end():]

    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def add_index_images(posts: list[dict], selections: dict[str, tuple[str, str]]) -> bool:
    if not BLOG.exists():
        return False
    text = BLOG.read_text(encoding="utf-8")
    original = text
    for post in posts:
        slug = post.get("local_slug", "")
        if not slug or slug not in selections:
            continue
        image_path, alt = selections[slug]
        href = f'/blog/official-updates/{slug}/'
        pattern = re.compile(
            r'(<article class="blog-tile">)(?!<a class="blog-tile-image"[^>]*href="' + re.escape(href) + r'")'
            r'(?=<div class="blog-tile-copy">)'
        )
        image_link = (
            f'<a class="blog-tile-image" href="{href}"><img src="{image_path}" '
            f'alt="{html.escape(alt, quote=True)}" width="1600" height="900" loading="lazy"/></a>'
        )
        # Restrict replacement to a card whose copy contains this specific href.
        card_pattern = re.compile(
            r'<article class="blog-tile"><div class="blog-tile-copy">(?:(?!</article>).)*?'
            + re.escape(href)
            + r'(?:(?!</article>).)*?</article>',
            flags=re.S,
        )
        match = card_pattern.search(text)
        if match and 'blog-tile-image' not in match.group(0):
            card = match.group(0).replace('<article class="blog-tile">', '<article class="blog-tile">' + image_link, 1)
            text = text[:match.start()] + card + text[match.end():]

    if text != original:
        BLOG.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> int:
    if not STATE.exists():
        print("Official-news state does not exist yet.")
        return 0
    state = json.loads(STATE.read_text(encoding="utf-8"))
    posts = state.get("posts", []) if isinstance(state, dict) else []
    selections: dict[str, tuple[str, str]] = {}
    changed = 0

    for post in posts:
        slug = post.get("local_slug", "")
        if not slug:
            continue
        image_path, alt = pick(post.get("source_id", ""), slug, post.get("title", ""))
        selections[slug] = (image_path, alt)
        page = ROOT / "blog" / "official-updates" / slug / "index.html"
        if page.exists() and add_page_image(page, image_path, alt):
            changed += 1

    index_changed = add_index_images(posts, selections)
    print(f"Official-news imagery checked: {len(posts)} posts; updated {changed} pages; index_changed={index_changed}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
