#!/usr/bin/env python3
"""Give automated property-news briefs unique, relevant editorial imagery.

The publisher does not copy third-party publisher images. This post-processor uses
James Realty's own editorial assets, keeps every automated card on the main News
page on a different visual, corrects old SVG placeholders/misclassifications, and
keeps article cards, state, feeds and image-sitemap references aligned.
"""

from __future__ import annotations

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE_PATH = ROOT / "data" / "property-news-state.json"
SITE = "https://jamesrealty.uk"

# These are deliberately different visual families. Do not add the full-size
# siblings of the manual News-card thumbnails here: that would look duplicated
# even when the file names differ.
ASSETS: dict[str, str] = {
    "/images/landing/emaar-dubai-waterfront-investment.webp": "Premium Dubai waterfront residences representing Emaar's residential sales and project pipeline",
    "/images/landing/aldar-yas-waterfront-investment.webp": "Abu Dhabi waterfront residences representing housing delivery and community development",
    "/images/landing/damac-branded-waterfront-residences.webp": "Dubai waterfront sales gallery representing property finance and DAMAC buyers",
    "/images/landing/binghatti-geometric-dubai-residences.webp": "Geometric Dubai residential towers representing Binghatti property and credit-market news",
    "/images/landing/nakheel-dubai-island-waterfront.webp": "Dubai island community representing Nakheel handovers and waterfront development",
    "/images/landing/mudon-family-townhouses-dubai.webp": "Landscaped Dubai family homes representing new community construction",
    "/images/mercedes-benz-places-optimized.webp": "Contemporary luxury residential tower representing Dubai's prime property market",
    "/images/jacob-co-residences-optimized.webp": "High-end Dubai residential architecture representing luxury property activity",
    "/case-studies/bugatti-residences.jpg": "Luxury Dubai residential development representing the ultra-prime housing segment",
    "/images/dubai-residential-portfolio.webp": "Dubai residential towers representing current property-market activity",
    "/images/dubai-portfolio-optimized.webp": "Dubai skyline and residential development representing property-market analysis",
    "/images/dubai-skyline-real-estate-social-v4.jpg": "Dubai skyline representing housing supply and real-estate market activity",
    "/images/james-realty-dubai-advisory-social-v2.jpg": "Property advisory setting representing a Dubai residential-market decision",
    "/images/james-realty-social-preview.webp": "UAE residential property scene representing market analysis and buyer decisions",
    "/images/real-estate-crm-review.webp": "Real-estate advisory workspace representing research and market review",
    "/images/real-estate-marketing-workshop.webp": "Real-estate planning session representing development and market analysis",
    "/images/uae-property-advisory-consultation-social-v5.jpg": "UAE property consultation representing buyer and investor decision-making",
    "/images/visuals/buyer-consultation-1200.webp": "Property consultation representing homebuyer research and decision-making",
    "/images/visuals/home-property-intelligence-1200.webp": "UAE waterfront residential towers representing property-market intelligence",
    "/images/visuals/marketing-strategy-1200.webp": "Real-estate strategy session representing market and development planning",
    "/images/visuals/seller-preparation-1200.webp": "Residential property consultation representing tenancy and ownership decisions",
    "/case-studies/demand-strategy.jpg": "Real-estate demand strategy scene representing property-market analysis",
    "/case-studies/tbwa-mena-marketing.webp": "UAE market strategy visual representing regional property-demand analysis",
    "/case-studies/tbwa-slow-trends.webp": "Market-trend analysis visual representing longer-term property signals",
}

# Preference order matters. The selector walks each list and takes the first
# unused image, so relevance is preserved without allowing visual duplication.
PREFERENCES: dict[str, list[str]] = {
    "luxury": [
        "/images/mercedes-benz-places-optimized.webp",
        "/images/jacob-co-residences-optimized.webp",
        "/case-studies/bugatti-residences.jpg",
        "/images/dubai-residential-portfolio.webp",
        "/images/dubai-portfolio-optimized.webp",
    ],
    "rental": [
        "/images/visuals/seller-preparation-1200.webp",
        "/images/visuals/buyer-consultation-1200.webp",
        "/images/uae-property-advisory-consultation-social-v5.jpg",
        "/images/james-realty-dubai-advisory-social-v2.jpg",
    ],
    "abu_dhabi_rental": [
        "/images/visuals/seller-preparation-1200.webp",
        "/images/uae-property-advisory-consultation-social-v5.jpg",
        "/images/visuals/buyer-consultation-1200.webp",
        "/images/visuals/home-property-intelligence-1200.webp",
    ],
    "abu_dhabi_supply": [
        "/images/uae-property-advisory-consultation-social-v5.jpg",
        "/images/visuals/home-property-intelligence-1200.webp",
        "/images/visuals/buyer-consultation-1200.webp",
        "/images/james-realty-dubai-advisory-social-v2.jpg",
        "/images/dubai-skyline-real-estate-social-v4.jpg",
    ],
    "abu_dhabi": [
        "/images/uae-property-advisory-consultation-social-v5.jpg",
        "/images/visuals/home-property-intelligence-1200.webp",
        "/images/visuals/buyer-consultation-1200.webp",
        "/images/james-realty-dubai-advisory-social-v2.jpg",
        "/images/real-estate-crm-review.webp",
    ],
    "sharjah_buyer": [
        "/images/visuals/buyer-consultation-1200.webp",
        "/images/visuals/home-property-intelligence-1200.webp",
        "/images/uae-property-advisory-consultation-social-v5.jpg",
        "/images/james-realty-social-preview.webp",
    ],
    "sharjah": [
        "/images/visuals/home-property-intelligence-1200.webp",
        "/images/visuals/buyer-consultation-1200.webp",
        "/images/uae-property-advisory-consultation-social-v5.jpg",
        "/images/james-realty-social-preview.webp",
        "/images/real-estate-crm-review.webp",
    ],
    "buyer": [
        "/images/landing/damac-branded-waterfront-residences.webp",
        "/images/visuals/buyer-consultation-1200.webp",
        "/images/james-realty-dubai-advisory-social-v2.jpg",
        "/images/visuals/seller-preparation-1200.webp",
        "/images/uae-property-advisory-consultation-social-v5.jpg",
    ],
    "supply": [
        "/images/landing/nakheel-dubai-island-waterfront.webp",
        "/images/landing/aldar-yas-waterfront-investment.webp",
        "/images/landing/mudon-family-townhouses-dubai.webp",
        "/images/landing/emaar-dubai-waterfront-investment.webp",
        "/images/dubai-skyline-real-estate-social-v4.jpg",
        "/images/visuals/home-property-intelligence-1200.webp",
        "/images/james-realty-dubai-advisory-social-v2.jpg",
        "/images/real-estate-marketing-workshop.webp",
        "/images/visuals/marketing-strategy-1200.webp",
        "/case-studies/demand-strategy.jpg",
        "/images/dubai-residential-portfolio.webp",
        "/images/dubai-portfolio-optimized.webp",
    ],
    "market": [
        "/images/landing/binghatti-geometric-dubai-residences.webp",
        "/images/landing/emaar-dubai-waterfront-investment.webp",
        "/images/jacob-co-residences-optimized.webp",
        "/images/mercedes-benz-places-optimized.webp",
        "/images/dubai-portfolio-optimized.webp",
        "/images/dubai-residential-portfolio.webp",
        "/images/dubai-skyline-real-estate-social-v4.jpg",
        "/images/james-realty-social-preview.webp",
        "/images/real-estate-crm-review.webp",
        "/case-studies/demand-strategy.jpg",
        "/case-studies/tbwa-mena-marketing.webp",
        "/case-studies/tbwa-slow-trends.webp",
        "/images/james-realty-dubai-advisory-social-v2.jpg",
        "/images/real-estate-marketing-workshop.webp",
        "/images/visuals/marketing-strategy-1200.webp",
        "/images/visuals/home-property-intelligence-1200.webp",
    ],
}

CATEGORY_ORDER = [
    "luxury",
    "rental",
    "abu_dhabi_rental",
    "abu_dhabi_supply",
    "abu_dhabi",
    "sharjah_buyer",
    "sharjah",
    "buyer",
    "supply",
    "market",
]


def article_signal(slug: str, page_text: str) -> str:
    """Use only article-owned text; never navigation or related-link copy."""
    # Historical slugs are retained for canonical stability and can contain an
    # obsolete generic classifier (for example, "luxury" on a handover story).
    # Use the repaired on-page title and description instead.
    bits: list[str] = []
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


def category_for(slug: str, page_text: str) -> str:
    text = article_signal(slug, page_text)
    is_abu = "abu dhabi" in text or "abu-dhabi" in text
    is_sharjah = "sharjah" in text
    is_rental = any(word in text for word in ("rent", "rental", "tenant", "tenancy", "lease"))
    is_supply = any(word in text for word in ("supply", "delivery", "deliveries", "handover", "handovers", "new homes", "new units"))
    is_buyer = any(word in text for word in ("buyer", "homebuyer", "buying", "long-term home", "long term home"))
    is_luxury = any(word in text for word in ("luxury", "ultra-prime", "ultra prime", "record sale", "trophy")) or bool(re.search(r"\bvillas?\b", text))

    if is_abu and is_rental:
        return "abu_dhabi_rental"
    if is_abu and is_supply:
        return "abu_dhabi_supply"
    if is_abu:
        return "abu_dhabi"
    if is_sharjah and is_buyer:
        return "sharjah_buyer"
    if is_sharjah:
        return "sharjah"
    if is_rental:
        return "rental"
    if is_supply:
        return "supply"
    if is_luxury:
        return "luxury"
    if is_buyer:
        return "buyer"
    return "market"


def current_hero(text: str) -> str | None:
    match = re.search(
        r'<figure class="article-hero-image news-brief-visual"><img\s+src="([^"]+)"',
        text,
        flags=re.I,
    )
    return match.group(1) if match else None


def choose_assignments(briefs: list[dict[str, object]]) -> dict[str, tuple[str, str]]:
    """Assign one relevant visual per automated brief, with no duplicate paths."""
    selections: dict[str, tuple[str, str]] = {}
    used: set[str] = set()

    grouped: dict[str, list[dict[str, object]]] = {key: [] for key in CATEGORY_ORDER}
    for brief in briefs:
        grouped.setdefault(str(brief["category"]), []).append(brief)

    # Newest cards get first choice within each topic; existing unique and
    # relevant choices are preserved, which prevents image churn on later runs.
    for category in CATEGORY_ORDER:
        for brief in sorted(grouped.get(category, []), key=lambda item: str(item["slug"]), reverse=True):
            slug = str(brief["slug"])
            old_image = str(brief["old_image"])
            preferred = PREFERENCES.get(category, PREFERENCES["market"])

            # Preserve any already-curated unique asset. Existing briefs may
            # have a deliberately assigned developer or community visual that
            # is more specific than the broad automatic category.
            if old_image in ASSETS and old_image not in used:
                selected = old_image
            else:
                selected = next((path for path in preferred if path not in used), "")
                if not selected:
                    selected = next((path for path in ASSETS if path not in used), "")
                if not selected:
                    raise RuntimeError(
                        "Not enough distinct editorial assets for the automated News cards. "
                        "Add another unique natural image before publishing more simultaneous briefs."
                    )

            used.add(selected)
            selections[slug] = (selected, ASSETS[selected])

    if len(selections) != len(set(image for image, _alt in selections.values())):
        raise RuntimeError("Duplicate automated News-card images remain after selection.")
    return selections


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
            replacement = re.sub(
                r'https://jamesrealty\.uk/(?:images|case-studies)/[^<"\s]+\.(?:svg|webp|jpe?g|png)',
                SITE + image_path,
                replacement,
            )
            replacement = re.sub(
                r'/(?:images|case-studies)/[^<"\s]+\.(?:svg|webp|jpe?g|png)',
                image_path,
                replacement,
            )
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


def verify_main_news_grid() -> None:
    """Fail publishing rather than knowingly leave duplicate card image URLs."""
    path = ROOT / "blog" / "index.html"
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    grid = re.search(r'<div class="blog-index-grid">(.*?)</div>\s*</section>', text, flags=re.S)
    if not grid:
        return
    sources = re.findall(r'<article class="blog-tile">.*?<img\s+src="([^"]+)"', grid.group(1), flags=re.S)
    duplicates = sorted({src for src in sources if sources.count(src) > 1})
    if duplicates:
        raise RuntimeError("Duplicate image URLs remain in the main News grid: " + ", ".join(duplicates))


def main() -> int:
    briefs: list[dict[str, object]] = []
    pages: dict[str, Path] = {}
    old_svgs: set[str] = set()

    for page in sorted(ROOT.glob("blog/property-news-*/index.html")):
        text = page.read_text(encoding="utf-8")
        if not any(label in text for label in ("Automated source brief", "Source-linked property brief")) or "news-brief-visual" not in text:
            continue
        slug = page.parent.name
        old_image = current_hero(text)
        if not old_image:
            continue
        pages[slug] = page
        briefs.append({
            "slug": slug,
            "old_image": old_image,
            "category": category_for(slug, text),
        })
        if old_image.endswith(".svg"):
            old_svgs.add(old_image)

    selections = choose_assignments(briefs)
    updated_pages = 0
    for brief in briefs:
        slug = str(brief["slug"])
        old_image = str(brief["old_image"])
        new_image, alt = selections[slug]
        if update_article(pages[slug], old_image, new_image, alt):
            updated_pages += 1

    update_card_surface(ROOT / "blog" / "index.html", selections)
    update_card_surface(ROOT / "blog" / "property-news" / "index.html", selections)
    update_xml_blocks(ROOT / "feed.xml", selections)
    update_xml_blocks(ROOT / "image-sitemap.xml", selections)
    update_state(selections)
    verify_main_news_grid()

    removed = 0
    for image_path in old_svgs:
        file = ROOT / image_path.lstrip("/")
        if file.exists():
            file.unlink()
            removed += 1

    print(
        f"Property-news imagery checked: {len(selections)} automated briefs; "
        f"all image paths unique; updated {updated_pages} pages; removed {removed} SVG placeholders."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
