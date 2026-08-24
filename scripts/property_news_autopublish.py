#!/usr/bin/env python3
"""Publish original UAE property news briefs from selected public news pages.

The script is designed for GitHub Actions and requires no API keys. It:
- creates five initial source-led articles requested by the site owner;
- checks four UAE property news sources;
- publishes concise original analytical briefs for newly detected articles;
- updates the blog index, a property-news hub, RSS, sitemap and internal links.

It does not copy source images or republish full article text.
"""

from __future__ import annotations

import email.utils
import hashlib
import html
import json
import os
import re
import sys
import textwrap
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse, urlunparse
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://jamesrealty.uk"
DUBAI_TZ = ZoneInfo("Asia/Dubai")
NOW = datetime.now(DUBAI_TZ)
STATE_PATH = ROOT / "data" / "property-news-state.json"
BLOG_INDEX = ROOT / "blog" / "index.html"
FEED_PATH = ROOT / "feed.xml"
SITEMAP_PATH = ROOT / "sitemap.xml"
IMAGE_SITEMAP_PATH = ROOT / "image-sitemap.xml"
CSS_PATH = ROOT / "assets" / "property-news.css"
HUB_PATH = ROOT / "blog" / "property-news" / "index.html"

CATEGORY_PAGES = [
    {
        "name": "Khaleej Times",
        "url": "https://www.khaleejtimes.com/business/property",
        "host": "www.khaleejtimes.com",
        "article_prefixes": ["/business/"],
    },
    {
        "name": "Gulf News",
        "url": "https://gulfnews.com/business/property",
        "host": "gulfnews.com",
        "article_prefixes": ["/business/property/"],
    },
    {
        "name": "The National",
        "url": "https://www.thenationalnews.com/business/property/",
        "host": "www.thenationalnews.com",
        "article_prefixes": ["/business/property/"],
    },
    {
        "name": "Arabian Business",
        "url": "https://www.arabianbusiness.com/real-estate/",
        "host": "www.arabianbusiness.com",
        "article_prefixes": ["/real-estate/", "/industries/real-estate/"],
        "feed_urls": ["https://www.arabianbusiness.com/real-estate/feed/"],
    },
]

MONITORED_SOURCE_NAMES = ", ".join(category["name"] for category in CATEGORY_PAGES)

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36 "
    "JamesRaviPropertyNewsMonitor/1.0"
)

GTM_HEAD = """<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M74SL57L');</script>
<!-- End Google Tag Manager -->"""

GTM_BODY = """<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M74SL57L"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->"""

CSS = r"""/* Property news hub, source briefs and internal-link modules */
.property-news-divider{grid-column:1/-1;border-top:1px solid var(--line);display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,.6fr);align-items:end;gap:28px;margin-top:18px;padding-top:30px}.property-news-divider h2{font-size:clamp(1.65rem,3vw,2.35rem);letter-spacing:-.04em;margin:6px 0 0}.property-news-divider p:last-child{color:var(--muted);font-size:.78rem;line-height:1.6;margin:0}.news-source-badge{display:inline-flex;align-items:center;width:max-content;border:1px solid #818cf840;border-radius:999px;background:#818cf811;color:#bfc3ff;padding:6px 10px;font-size:.63rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase}.news-fact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:18px 0}.news-fact{border:1px solid var(--line);border-radius:14px;background:#111124;padding:17px}.news-fact strong{display:block;color:var(--accent);font-size:1.05rem;margin-bottom:6px}.news-fact span{color:var(--muted);font-size:.7rem;line-height:1.5}.source-credit{border:1px solid #818cf840;border-radius:16px;background:linear-gradient(135deg,#818cf813,#111124);display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:20px;margin:28px 0;padding:20px}.source-credit p{color:var(--muted);font-size:.76rem;line-height:1.6;margin:7px 0 0}.source-credit .button{white-space:nowrap}.news-automation-note{border-left:3px solid var(--accent);background:#818cf80c;color:#b9b9ca;border-radius:0 12px 12px 0;padding:13px 15px;font-size:.72rem;line-height:1.6}.property-news-links{border-top:1px solid var(--line);border-bottom:1px solid var(--line);display:grid;grid-template-columns:minmax(220px,.32fr) minmax(0,.68fr);gap:30px;margin-top:48px;margin-bottom:48px;padding-top:34px;padding-bottom:34px}.property-news-links h2{font-size:1.45rem;letter-spacing:-.04em;margin:7px 0 9px}.property-news-links>div>p:last-child{color:var(--muted);font-size:.74rem;line-height:1.6;margin:0}.property-news-link-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.property-news-link-grid a{border:1px solid var(--line);border-radius:14px;background:var(--surface);display:grid;gap:6px;min-width:0;padding:16px}.property-news-link-grid a:hover{border-color:#818cf86b;transform:translateY(-2px)}.property-news-link-grid span{color:var(--accent);font-size:.61rem;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.property-news-link-grid strong{font-size:.76rem;line-height:1.4}.news-hub-hero{padding-top:66px;padding-bottom:42px}.news-hub-hero h1{font-size:clamp(2.8rem,6vw,5.4rem);line-height:.96;letter-spacing:-.065em;margin:18px 0}.news-hub-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding-bottom:72px}.news-hub-grid .blog-tile{height:100%}.news-brief-visual{aspect-ratio:16/9;border:1px solid var(--line);border-radius:20px;overflow:hidden}.news-brief-visual img{width:100%;height:100%;object-fit:cover}.article-body .news-related{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}.article-body .news-related a{border:1px solid var(--line);border-radius:14px;background:#111124;padding:16px;font-size:.76rem;font-weight:750;line-height:1.45}.article-body .news-related a:hover{border-color:#818cf86b}.footer-links a[href='/blog/property-news/']{color:#c7c9ff}
@media(max-width:840px){.property-news-divider,.property-news-links{grid-template-columns:1fr;gap:17px}.news-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.property-news-link-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.property-news-divider{padding-top:24px}.news-fact-grid,.article-body .news-related{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.news-fact{padding:14px 12px}.source-credit{grid-template-columns:1fr;gap:14px;padding:17px}.source-credit .button{width:100%}.property-news-links{margin-top:36px;margin-bottom:36px;padding-top:27px;padding-bottom:27px}.property-news-link-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.property-news-link-grid a{padding:13px 11px}.news-hub-hero{padding-top:46px}.news-hub-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding-bottom:52px}.news-hub-grid .blog-tile-copy{padding:12px 11px}.news-hub-grid .blog-tile h2{font-size:.9rem;line-height:1.22}.news-hub-grid .blog-tile-copy>p{font-size:.68rem;line-height:1.4}}
@media(max-width:380px){.news-fact-grid,.article-body .news-related,.property-news-link-grid{grid-template-columns:1fr}}

/* Main News index */
.blog-index-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.news-hub-grid .blog-tile h2{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;min-height:3.6em;overflow:hidden}
.blog-index-grid .blog-tile-copy{padding:18px 17px 19px}
.blog-index-grid .blog-tile h2{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;min-height:3.6em;overflow:hidden;font-size:1.08rem;line-height:1.2;margin:12px 0 9px}
.blog-index-grid .blog-tile-copy>p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;font-size:.78rem;line-height:1.55;margin-bottom:14px}
@media(max-width:840px){.blog-index-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
@media(max-width:560px){.blog-index-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.blog-index-grid .blog-tile-copy{padding:12px 11px 13px}.blog-index-grid .blog-tile h2{font-size:.9rem;line-height:1.22;margin:8px 0}.blog-index-grid .blog-tile-copy>p{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font-size:.68rem;line-height:1.4;margin-bottom:10px}.blog-index-grid .news-source-badge{font-size:.5rem;padding:4px 6px}.blog-index-grid .text-link{font-size:.65rem}}
"""

NAV_HEADER = """<header class=\"site-header\"><nav class=\"nav-shell\" aria-label=\"Main navigation\"><a class=\"brand\" href=\"/\" aria-label=\"James Realty, Dubai Data\">James Realty</a><div class=\"nav-links global-links\"><a href=\"/\">Dubai Data</a><a href=\"/abu-dhabi-data/\">Abu Dhabi Data</a><a href=\"/about-me/\">About Me</a><a href=\"/blog/\" aria-current=\"page\">Blog</a><a href=\"/contact/\">Contact Me</a></div><a class=\"button nav-cta nav-whatsapp\" href=\"https://wa.me/971528420933\" target=\"_blank\" rel=\"noreferrer\">Work with James <span aria-hidden=\"true\">↗</span></a></nav></header><nav class=\"mobile-page-tabs section-shell\" aria-label=\"Page navigation\"><a href=\"/\">Dubai Data</a><a href=\"/abu-dhabi-data/\">Abu Dhabi Data</a><a href=\"/about-me/\">About Me</a><a href=\"/blog/\" aria-current=\"page\">Blog</a><a href=\"/contact/\">Contact Me</a></nav>"""

FOOTER = """<a class=\"mobile-conversion nav-whatsapp\" href=\"/contact/\">Contact James</a><footer><div class=\"section-shell footer-shell footer-shell-rich\"><div class=\"footer-identity\"><a class=\"brand\" href=\"/\">James</a><p>© 2026 James. Built in Dubai.</p></div><nav class=\"footer-links\" aria-label=\"Footer navigation\"><a href=\"/\">Home</a><a href=\"/buy-invest-dubai/\">Buy / Invest</a><a href=\"/dubai-data/\">Dubai Data</a><a href=\"/dubai-rental-yield-calculator/\">Yield Calculator</a><a href=\"/blog/\">News</a><a href=\"/blog/property-news/\">Property News</a><a href=\"/contact/\">Contact</a></nav><a class=\"footer-linkedin\" href=\"https://ae.linkedin.com/in/james-ravi-dubai\" target=\"_blank\" rel=\"me noreferrer\">LinkedIn <span aria-hidden=\"true\">↗</span></a></div></footer>"""


@dataclass
class Post:
    slug: str
    title: str
    description: str
    category: str
    date: str
    read_time: str
    source_name: str
    source_url: str
    image: str
    auto: bool

    @property
    def url(self) -> str:
        return f"{SITE}/blog/{self.slug}/"


SEED_IMAGE_ALTS = {
    "jumeirah-golf-estates-dh110m-villa-sale-analysis": "Contemporary golf-course villa in Jumeirah Golf Estates at sunset",
    "dubai-residents-buying-long-term-homes": "Family viewing a finished Dubai home for long-term living",
    "dubai-h1-2026-delivery-led-property-cycle": "Property team inspecting a newly completed Dubai residential tower",
    "dubai-24800-new-homes-buyer-choice-2026": "Buyers comparing newly completed homes across a Dubai residential district",
    "adgm-broker-rankings-buyers-tenants-guide": "Abu Dhabi property adviser reviewing broker performance information with clients",
}


# Automated briefs may only publish when an editor has assigned a unique,
# topic-specific photograph. This deliberately trades publishing volume for
# relevance and prevents the old generic SVG/stock-image fallback returning.
CURATED_AUTO_IMAGES = {
    "property-news-2026-08-17-reading-the-latest-dubai-luxury-property-signal-9428c": "/images/property-news/jebel-ali-village-892-home-handover.webp",
    "property-news-2026-08-15-how-to-read-the-latest-dubai-property-market-signal-3e09d": "/images/property-news/dubai-186-new-property-developers-2026.webp",
    "property-news-2026-08-14-how-to-read-the-latest-dubai-property-market-signal-96e5c": "/images/property-news/zoya-elinor-dubai-project-launch-sellout.webp",
    "property-news-2026-08-13-how-to-read-the-latest-abu-dhabi-property-market-signal-abda4": "/images/property-news/uae-top-developers-six-month-sales.webp",
    "property-news-2026-08-13-uae-rental-update-what-tenants-and-landlords-should-verify-cbf17": "/images/property-news/uae-monthly-apartment-rent-options.webp",
    "property-news-2026-08-13-dubai-housing-supply-what-buyers-and-owners-should-check-n-8ca93": "/images/property-news/dubai-rent-now-pay-later-service.webp",
    "property-news-2026-08-12-how-to-read-the-latest-dubai-property-market-signal-21f76": "/images/property-news/binghatti-credit-rating-review.webp",
    "property-news-2026-08-10-dubai-housing-supply-what-buyers-and-owners-should-check-n-5f565": "/images/property-news/former-dubai-zoo-residential-construction.webp",
    "property-news-2026-08-07-dubai-housing-supply-what-buyers-and-owners-should-check-n-76b75": "/images/property-news/emaar-development-sales-profit-2026.webp",
    "property-news-2026-08-07-how-to-read-the-latest-dubai-property-market-signal-ff568": "/images/property-news/emaar-sales-backlog-delivery-pipeline.webp",
    "property-news-2026-08-07-uae-housing-supply-what-buyers-and-owners-should-check-nex-6f2f1": "/images/property-news/damac-mortgage-event-uae-banks.webp",
    "property-news-2026-08-06-sharjah-homebuyer-update-a-practical-decision-checklist-d84dc": "/images/property-news/sharjah-property-deals-july-2026.webp",
    "property-news-2026-08-06-how-to-read-the-latest-dubai-property-market-signal-5cfed": "/images/property-news/dubai-supertall-tower-construction-phase.webp",
    "property-news-2026-08-04-abu-dhabi-housing-supply-what-buyers-and-owners-should-che-1ddff": "/images/property-news/abu-dhabi-early-home-handover.webp",
    "property-news-2026-08-18-ajman-rental-contracts-reach-dh2-91-billion-in-first-half-06d3d": "/images/property-news/ajman-rental-contracts-2026.webp",
    "property-news-2026-08-18-two-day-uae-property-showcase-in-hyderabad-targets-indian-b21c8": "/images/property-news/hyderabad-uae-property-showcase.webp",
    "property-news-2026-08-19-abu-dhabi-to-add-71-000-homes-by-2030-with-biggest-deliver-29357": "/images/property-news/abu-dhabi-71000-home-pipeline.webp",
    "property-news-2026-08-19-golden-visa-first-time-buyer-support-flexi-rent-how-dubai-99a12": "/images/property-news/dubai-property-access-first-time-buyers.webp",
    "property-news-2026-08-20-dubai-adds-more-than-24-000-property-units-in-six-months-5fb5c": "/images/property-news/dubai-24000-new-property-units.webp",
    "property-news-2026-08-20-dubai-s-iconic-toyota-building-to-be-demolished-in-2027-0f424": "/images/property-news/dubai-older-building-demolition-planning.webp",
    "property-news-2026-08-20-investments-in-completed-dubai-property-projects-top-30bn-6a4fc": "/images/property-news/completed-dubai-property-investment.webp",
    "property-news-2026-08-20-uae-developer-arada-unveils-dh5-billion-broadbeach-project-6cad2": "/images/property-news/arada-broadbeach-australia-development.webp",
    "property-news-2026-08-21-70-of-dubai-s-toyota-building-tenants-have-left-after-powe-f5a2e": "/images/property-news/dubai-building-tenants-power-disruption.webp",
    "property-news-2026-08-21-dubai-has-96-585-homes-entering-the-market-in-2026-83-are-9eab9": "/images/property-news/dubai-96585-home-supply-pipeline.webp",
}

CURATED_AUTO_IMAGE_ALTS = {
    "property-news-2026-08-17-reading-the-latest-dubai-luxury-property-signal-9428c": "Completed villas on a landscaped street at Jebel Ali Village during handover",
    "property-news-2026-08-15-how-to-read-the-latest-dubai-property-market-signal-3e09d": "Dubai development team comparing several residential masterplans",
    "property-news-2026-08-14-how-to-read-the-latest-dubai-property-market-signal-96e5c": "Buyers viewing an apartment model during a Dubai project sales launch",
    "property-news-2026-08-13-how-to-read-the-latest-abu-dhabi-property-market-signal-abda4": "UAE developer executives reviewing a portfolio of residential projects",
    "property-news-2026-08-13-uae-rental-update-what-tenants-and-landlords-should-verify-cbf17": "UAE tenants comparing monthly apartment rent terms at home",
    "property-news-2026-08-13-dubai-housing-supply-what-buyers-and-owners-should-check-n-8ca93": "Dubai tenant using a mobile rent-instalment service in an apartment",
    "property-news-2026-08-12-how-to-read-the-latest-dubai-property-market-signal-21f76": "Credit analyst reviewing developer financial information beside Dubai towers",
    "property-news-2026-08-10-dubai-housing-supply-what-buyers-and-owners-should-check-n-5f565": "Residential construction progressing at the former Dubai Zoo site",
    "property-news-2026-08-07-dubai-housing-supply-what-buyers-and-owners-should-check-n-76b75": "Emaar project analysts reviewing sales and construction progress in Dubai",
    "property-news-2026-08-07-how-to-read-the-latest-dubai-property-market-signal-ff568": "Large Dubai residential delivery pipeline with active construction sites",
    "property-news-2026-08-07-uae-housing-supply-what-buyers-and-owners-should-check-nex-6f2f1": "UAE buyers comparing mortgage options with a property adviser",
    "property-news-2026-08-06-sharjah-homebuyer-update-a-practical-decision-checklist-d84dc": "Property analysts reviewing Sharjah waterfront transaction evidence",
    "property-news-2026-08-06-how-to-read-the-latest-dubai-property-market-signal-5cfed": "Workers on the active structure of a Dubai supertall tower",
    "property-news-2026-08-04-abu-dhabi-housing-supply-what-buyers-and-owners-should-che-1ddff": "Abu Dhabi homebuyer receiving keys in a newly completed community",
    "property-news-2026-08-18-ajman-rental-contracts-reach-dh2-91-billion-in-first-half-06d3d": "Tenant and adviser reviewing an Ajman apartment rental contract",
    "property-news-2026-08-18-two-day-uae-property-showcase-in-hyderabad-targets-indian-b21c8": "Indian buyers viewing UAE property models at a Hyderabad showcase",
    "property-news-2026-08-19-abu-dhabi-to-add-71-000-homes-by-2030-with-biggest-deliver-29357": "Analysts surveying Abu Dhabi residential districts and future housing sites",
    "property-news-2026-08-19-golden-visa-first-time-buyer-support-flexi-rent-how-dubai-99a12": "Family discussing Dubai homebuying access with a property adviser",
    "property-news-2026-08-20-dubai-adds-more-than-24-000-property-units-in-six-months-5fb5c": "Recently completed apartment buildings in a growing Dubai district",
    "property-news-2026-08-20-dubai-s-iconic-toyota-building-to-be-demolished-in-2027-0f424": "Surveyors assessing an older Dubai building ahead of redevelopment",
    "property-news-2026-08-20-investments-in-completed-dubai-property-projects-top-30bn-6a4fc": "Investors inspecting completed waterfront homes in Dubai",
    "property-news-2026-08-20-uae-developer-arada-unveils-dh5-billion-broadbeach-project-6cad2": "UAE and Australian team reviewing a Broadbeach waterfront development model",
    "property-news-2026-08-21-70-of-dubai-s-toyota-building-tenants-have-left-after-powe-f5a2e": "Tenants moving from an older Dubai building while technicians inspect utilities",
    "property-news-2026-08-21-dubai-has-96-585-homes-entering-the-market-in-2026-83-are-9eab9": "Analysts reviewing Dubai's residential construction and completion pipeline",
}


SEEDS: list[dict] = [
    {
        "slug": "adgm-broker-rankings-buyers-tenants-guide",
        "title": "ADGM broker rankings: What property buyers and tenants should check",
        "description": "ADGM's broker classification framework adds transaction activity, professional development and customer feedback to the way brokers are assessed.",
        "category": "Abu Dhabi regulation",
        "date": "2026-08-01",
        "read_time": "5 min read",
        "source_name": "Gulf News",
        "source_url": "https://gulfnews.com/business/property/adgm-launches-broker-rankings-for-property-buyers-and-tenants-1.500626469",
        "deck": "A visible broker ranking can improve transparency, but buyers, sellers, landlords and tenants should still check licensing, relevant transaction experience, fees and conflicts before appointing an adviser.",
        "quick": "ADGM has activated a Broker Classification Framework that evaluates brokers using transaction activity, continuous professional development and customer feedback. The ranking is useful as an additional quality signal, not a replacement for property-level due diligence.",
        "facts": [
            ["Three assessment areas", "Transaction activity, ongoing professional development and customer feedback are part of the framework."],
            ["Customer voice", "Feedback from buyers, sellers, owners and tenants can influence broker classification."],
            ["Implementation support", "ADGM's Registration Authority plans workshops and engagement sessions for brokerages."],
            ["Market purpose", "The framework is intended to strengthen professionalism, transparency and accountability."],
        ],
        "sections": [
            ["What the new framework changes", [
                "The classification gives market participants a more structured way to distinguish brokers operating in ADGM. It recognises that service quality is not measured only by the number of transactions. Training and customer experience also matter.",
                "For brokerages, the framework creates a visible incentive to document training, improve service processes and respond to customer feedback. For consumers, it adds another reference point before selecting an adviser.",
            ]],
            ["How buyers and tenants should use a ranking", [
                "Start with the classification, then test whether the broker has recent experience in the exact property type and location. A highly active broker in one segment may not be the best fit for a specialist commercial lease, a luxury residence or a complex tenancy matter.",
                "Ask for a written explanation of fees, who the broker represents, how personal data will be handled and what information has been verified directly with the owner or property manager.",
            ]],
            ["A practical appointment checklist", [
                "Confirm the broker and brokerage licence through the relevant regulator.",
                "Request comparable transactions or leases that match the property type and location.",
                "Check the basis for any asking price, rent expectation or yield claim.",
                "Put fees, services and representation responsibilities in writing.",
                "Keep copies of listings, messages, offers and material disclosures.",
            ]],
            ["What the ranking cannot tell you", [
                "A classification cannot confirm the legal status, physical condition or fair value of a particular property. Buyers and tenants still need contract review, property inspection and independent verification of material facts.",
                "Use the ranking alongside the <a href=\"/abu-dhabi-data/\">Abu Dhabi Data dashboard</a> and the guide to <a href=\"/blog/abu-dhabi-property-transactions-h1-2026/\">reading Abu Dhabi transaction headlines</a>.",
            ]],
        ],
        "faqs": [
            ["Does a high ADGM broker ranking guarantee a good property deal?", "No. It can indicate professional performance, but the property, contract, price and legal position still require independent checks."],
            ["Will customer reviews affect ADGM broker rankings?", "Yes. ADGM's framework includes customer feedback alongside transaction activity and professional development."],
        ],
    },
    {
        "slug": "dubai-24800-new-homes-buyer-choice-2026",
        "title": "Dubai added 24,800 homes in H1 2026: What greater choice means for buyers",
        "description": "New housing supply increased buyer and tenant choice as quarterly prices and rents eased, while annual values remained above the previous year.",
        "category": "Dubai market supply",
        "date": "2026-08-01",
        "read_time": "7 min read",
        "source_name": "Gulf News",
        "source_url": "https://gulfnews.com/business/property/dubai-homebuyers-get-more-choice-as-24800-new-units-enter-the-market-1.500625443",
        "deck": "A larger completed-homes pipeline can improve choice and negotiating power, but the effect will vary sharply by community, property type, completion quality and the amount of competing stock.",
        "quick": "Dubai added 24,800 homes in the first half of 2026. The reported data points to a market moving from exceptional launch activity toward steadier growth, with more choice for buyers and tenants rather than one uniform citywide price outcome.",
        "facts": [
            ["24,800 homes", "Completed during H1 2026, almost 38% more than the same period a year earlier."],
            ["AED 221.4bn", "The reported value of 79,300 residential transactions during the first half."],
            ["About 75%", "The approximate off-plan share of residential transactions."],
            ["6.9% and 5%", "Reported average gross yields for apartments and villas or townhouses."],
        ],
        "sections": [
            ["Why more completions matter", [
                "Completed supply gives buyers alternatives that can be inspected, compared and occupied. It also creates direct competition between developers handing over new stock and owners selling or leasing existing homes.",
                "That competition can improve negotiating conditions in areas with several similar projects. It does not automatically create discounts in communities where demand remains deep or where completed stock is scarce.",
            ]],
            ["Read quarterly easing carefully", [
                "The source reported a 2.6% quarter-on-quarter easing in residential sales prices and a 2.5% decline in rents, while both measures remained higher than a year earlier. This is closer to normalisation than proof of a broad correction across every segment.",
                "Citywide averages can hide major differences between ready and off-plan property, apartments and villas, established communities and newer growth corridors.",
            ]],
            ["Where supply may be more visible", [
                "A large share of scheduled completions is expected to be apartments. Communities including Jumeirah Village Circle, Dubai South, Dubai Science Park, Business Bay, Downtown Dubai and Dubai Healthcare City were identified among important delivery locations.",
                "Buyers in these areas should compare identical property types, view quality, service charges, vacancy, handover standards and the number of competing units rather than relying on the community average alone.",
            ]],
            ["Buyer checks in a delivery-led market", [
                "Inspect the finished unit and common areas before committing.",
                "Compare registered ready-home transactions, not only asking prices.",
                "Check snagging, warranties, service charges and building management.",
                "Estimate the number of similar units completing in the next 12 to 24 months.",
                "Test rent and resale assumptions using conservative occupancy and holding costs.",
            ]],
            ["Connect the headline to local evidence", [
                "Use the <a href=\"/\">Dubai Data dashboard</a> to compare recent area activity and rental indicators. The <a href=\"/blog/dubai-community-vs-property-long-term-value/\">Dubai community buying guide</a> provides a wider framework for testing liveability and long-term demand.",
            ]],
        ],
        "faqs": [
            ["Will 24,800 new homes make every Dubai property cheaper?", "No. Supply pressure depends on the community, unit type, quality, competing stock and depth of buyer or tenant demand."],
            ["Does more completed supply benefit tenants?", "It can. More available units may improve choice and negotiating power, especially where several comparable projects complete together."],
        ],
    },
    {
        "slug": "dubai-h1-2026-delivery-led-property-cycle",
        "title": "Dubai's H1 2026 handovers signal a more delivery-led property cycle",
        "description": "Record completions, slower launch activity, strong off-plan demand and a substantial future pipeline point to a more mature phase of Dubai's housing cycle.",
        "category": "Dubai market analysis",
        "date": "2026-08-01",
        "read_time": "8 min read",
        "source_name": "Khaleej Times",
        "source_url": "https://www.khaleejtimes.com/business/dubai-delivers-record-24800-new-homes-in-h1-2026-as-market-matures",
        "deck": "The important change is not only the number of homes completed. It is the shift from a launch-heavy market toward one where delivery, absorption, management and finished-product quality become more visible.",
        "quick": "Dubai delivered 24,800 homes in H1 2026, including about 18,900 apartments and 5,900 villas and townhouses. With fewer new launches and a large future pipeline, buyers should give more weight to delivery quality, actual occupancy and community-level supply.",
        "facts": [
            ["18,900 apartments", "The reported apartment component of first-half deliveries."],
            ["5,900 villas and townhouses", "The reported low-rise housing component of first-half deliveries."],
            ["74.8% off-plan", "The reported off-plan share of 79,300 residential transactions."],
            ["47,000 scheduled", "Homes listed for H2 2026 delivery before applying historical completion rates."],
        ],
        "sections": [
            ["From announcements to completed stock", [
                "When more projects reach handover, the market can judge what was actually delivered. Layout efficiency, finishing, common areas, service charges, access and management become measurable rather than conceptual.",
                "This makes product differentiation more important. Projects that looked similar at launch can perform differently once owners and tenants experience the completed building or community.",
            ]],
            ["Why a slower launch pace can be constructive", [
                "The report described 124 projects containing about 28,000 units launched in H1 2026, far below the unusually high launch count a year earlier. A slower pace can reduce short-term competition for buyer attention and give developers more time to phase inventory.",
                "It also means marketing claims should increasingly be tested against delivery records, construction progress and the performance of completed phases.",
            ]],
            ["Prices, rents and yields", [
                "The source reported average sales prices of AED 1,639 per square foot by June and annual rents of AED 75.7 per square foot. Citywide gross yields were reported at 6.9% for apartments and 5% for villas and townhouses.",
                "Those figures are reference points, not property-level guarantees. Net yield depends on vacancy, service charges, maintenance, finance, furnishing, management and transaction costs.",
            ]],
            ["How to analyse the future pipeline", [
                "Separate scheduled units from likely completed units.",
                "Map supply by property type and micro-location.",
                "Check whether new phases compete directly with the property being considered.",
                "Review the developer's historic delivery timing and finished quality.",
                "Model a slower rental or resale period rather than assuming immediate absorption.",
            ]],
            ["Use the market dashboard as a starting point", [
                "The <a href=\"/\">Dubai property dashboard</a> shows recent transaction activity, price benchmarks and rental indicators by official DLD area. Pair it with the <a href=\"/blog/dubai-24800-new-homes-buyer-choice-2026/\">buyer-choice analysis</a> for a more practical reading of the supply headline.",
            ]],
        ],
        "faqs": [
            ["What is a delivery-led property cycle?", "It is a phase in which completions, occupancy, finished quality and absorption matter more than the volume of new launch announcements."],
            ["Are all scheduled Dubai homes delivered on time?", "No. Scheduled pipelines commonly exceed actual handovers, so buyers should review historical delivery rates and project-specific progress."],
        ],
    },
    {
        "slug": "dubai-residents-buying-long-term-homes",
        "title": "Dubai residents are buying for long-term living, not only short-term returns",
        "description": "Developers report a broader owner-occupier profile as residents prioritise community, schools, connectivity and quality of life.",
        "category": "Dubai home buying",
        "date": "2026-08-01",
        "read_time": "6 min read",
        "source_name": "Khaleej Times",
        "source_url": "https://www.khaleejtimes.com/business/property/more-dubai-residents-buy-homes-to-live-in-for-long-term-developers-say",
        "deck": "A stronger end-user market changes how homes are selected. Daily usefulness, household plans and community quality can matter as much as projected appreciation or rental yield.",
        "quick": "Developers say more Dubai residents are buying homes to occupy for the long term. The trend is linked to population growth, residency confidence and first-time buyer initiatives, but each household still needs to test affordability, ownership horizon and community suitability.",
        "facts": [
            ["3,200 buyers", "The reported number of participants who purchased through the First-Time Home Buyer Programme within its first year."],
            ["More than AED 5bn", "The reported combined value of purchases connected to the programme."],
            ["Community first", "Connectivity, schools, retail, public space and walkability are becoming more prominent decision factors."],
            ["Longer horizon", "Developers describe buyers choosing where to build their lives, not only where to target short-term returns."],
        ],
        "sections": [
            ["Why the buyer profile matters", [
                "An owner-occupier usually evaluates a home differently from a short-term investor. Commute, school access, privacy, layout, storage, maintenance and community facilities can carry more weight than a headline yield.",
                "A deeper owner-occupier base may also support more stable demand for well-managed communities, although it does not remove price risk or guarantee resale liquidity.",
            ]],
            ["Test the ownership horizon", [
                "Buying costs, mortgage expenses, service charges, maintenance and eventual selling costs mean a short holding period can be expensive. Households should compare the likely period of ownership with realistic life and career plans.",
                "A home that is affordable only under an optimistic income or interest-rate assumption may create pressure even when the underlying community is attractive.",
            ]],
            ["Community quality becomes financial", [
                "Walkability, schools, retail, green space and transport are lifestyle factors, but they also affect future demand. A broad pool of residents who can use the community may support occupancy and resale depth.",
                "The key is to avoid paying an unlimited premium for a broad community narrative. Compare registered evidence, service charges and competing supply before deciding what the lifestyle advantage is worth.",
            ]],
            ["A long-term homebuyer checklist", [
                "Model the full monthly ownership cost, not only the mortgage payment.",
                "Visit the community during peak traffic, evenings and weekends.",
                "Check whether the layout can support likely household changes.",
                "Compare ready-home transactions and current rental evidence.",
                "Review service charges, reserve funds, maintenance and management quality.",
            ]],
            ["Related tools", [
                "Use the <a href=\"/blog/dubai-community-vs-property-long-term-value/\">community scorecard</a> to structure the location decision, then compare area-level evidence through the <a href=\"/\">Dubai Data dashboard</a>.",
            ]],
        ],
        "faqs": [
            ["Is Dubai becoming more of an owner-occupier market?", "Developers report a broader mix of long-term resident buyers, but investment and off-plan demand remain important parts of the market."],
            ["What should a long-term Dubai homebuyer prioritise?", "Affordability, commute, schools, community management, service charges, future supply and the ability of the home to suit changing household needs."],
        ],
    },
    {
        "slug": "jumeirah-golf-estates-dh110m-villa-sale-analysis",
        "title": "Jumeirah Golf Estates records an AED 110m villa sale: How to read the record",
        "description": "The off-market six-bedroom transaction more than doubled the community's previous ready-home benchmark, highlighting scarcity and bespoke quality at the top end.",
        "category": "Dubai luxury property",
        "date": "2026-08-01",
        "read_time": "6 min read",
        "source_name": "Khaleej Times",
        "source_url": "https://www.khaleejtimes.com/business/property/jumeirah-golf-estates-villa-sale-hits-record-dh110m-amid-luxury-boom",
        "deck": "A trophy-home transaction can reveal demand for scarcity, privacy and exceptional design. It should not be used as a direct valuation benchmark for ordinary villas in the same community.",
        "quick": "A six-bedroom Jumeirah Golf Estates villa sold for AED 110 million through an off-market process, surpassing the previous reported ready-property record of AED 58 million. The deal is evidence of ultra-prime demand, not a community-wide comparable.",
        "facts": [
            ["AED 110m", "The reported sale price of the completed six-bedroom residence."],
            ["AED 58m", "The previous reported ready-property benchmark in the community."],
            ["21,714 sq ft", "The reported built-up area on a 15,873 sq ft plot."],
            ["Off-market", "The transaction emerged through private relationships rather than a public listing campaign."],
        ],
        "sections": [
            ["Why this home is not an average comparable", [
                "The residence included extensive living and wellness facilities, bespoke fit-out and a very large built-up area. Those features place it in a narrow trophy-home category where replacement cost, design quality and rarity can materially influence price.",
                "A standard villa nearby may share the community name without sharing the plot position, specification, privacy, renovation quality or buyer pool.",
            ]],
            ["What the off-market process signals", [
                "At the ultra-prime level, some transactions begin through adviser networks rather than public listings. Privacy, discretion and access to a small group of qualified buyers can become part of the sales process.",
                "That does not mean public marketing is unimportant. It means the strategy should match the asset, seller requirements and realistic target-buyer universe.",
            ]],
            ["Scarcity and finished quality", [
                "Large, completed and highly customised homes are difficult to reproduce quickly. When buyers value immediate use, privacy and distinctive design, finished trophy assets can command a premium over generic or unfinished alternatives.",
                "The premium still needs to be tested against registered transactions, land value, construction and fit-out cost, condition and the durability of the design.",
            ]],
            ["How to value another villa in the community", [
                "Use recent registered transactions with similar plot and built-up area.",
                "Adjust for golf-course position, privacy, road exposure and outlook.",
                "Separate original construction value from recent renovation or fit-out cost.",
                "Check condition, age, maintenance history and immediate capital expenditure.",
                "Do not extrapolate one record sale across every villa type.",
            ]],
            ["Market context", [
                "The <a href=\"/\">Dubai Data dashboard</a> provides broader area evidence, while the <a href=\"/blog/dubai-community-vs-property-long-term-value/\">community buying guide</a> explains why location and long-term liveability need to be assessed alongside the home itself.",
            ]],
        ],
        "faqs": [
            ["Does an AED 110m sale increase the value of every Jumeirah Golf Estates villa?", "No. It may support confidence at the ultra-prime end, but individual values depend on comparable size, plot, location, specification and condition."],
            ["Why are some Dubai luxury homes sold off-market?", "Privacy, a limited qualified buyer pool and relationship-led advisory can make a private process suitable for certain trophy properties."],
        ],
    },
]


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def image_alt(post: Post) -> str:
    return (
        SEED_IMAGE_ALTS.get(post.slug)
        or CURATED_AUTO_IMAGE_ALTS.get(post.slug)
        or f"{post.category} analysis for UAE property readers"
    )


def slugify(value: str, max_len: int = 76) -> str:
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value[:max_len].rstrip("-") or "property-news-update"


def canonical_url(url: str) -> str:
    parsed = urlparse(urljoin("https://example.com", url))
    host = parsed.netloc.lower()
    if host == "khaleejtimes.com":
        host = "www.khaleejtimes.com"
    path = re.sub(r"/+", "/", parsed.path).rstrip("/")
    return urlunparse((parsed.scheme or "https", host, path, "", "", ""))


def request(url: str, timeout: int = 25) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = requests.get(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Accept-Language": "en-GB,en;q=0.8",
                    "Cache-Control": "no-cache",
                },
                timeout=timeout,
            )
            response.raise_for_status()
            return response
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if attempt == 2:
                raise
    raise RuntimeError(str(last_error))


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_if_changed(path: Path, content: str) -> bool:
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return False
    path.write_text(content, encoding="utf-8")
    return True


def load_state() -> dict:
    if not STATE_PATH.exists():
        return {"seen_urls": [], "posts": []}
    try:
        data = json.loads(read_text(STATE_PATH))
        if not isinstance(data, dict):
            raise ValueError("state is not an object")
        data.setdefault("seen_urls", [])
        data.setdefault("seen_title_signatures", [])
        data.setdefault("posts", [])
        return data
    except Exception as exc:  # noqa: BLE001
        print(f"State read failed, starting clean: {exc}", file=sys.stderr)
        return {"seen_urls": [], "posts": []}


def save_state(state: dict) -> None:
    state["updated_at"] = NOW.isoformat(timespec="seconds")
    write_if_changed(STATE_PATH, json.dumps(state, indent=2, ensure_ascii=False) + "\n")


def ensure_css_link(content: str) -> str:
    if "/assets/property-news.css" in content:
        return content
    link = '<link rel="stylesheet" href="/assets/property-news.css?v=2"/>'
    if "</head>" in content:
        return content.replace("</head>", link + "</head>", 1)
    return content


def footer_property_news_link(content: str) -> str:
    if 'href="/blog/property-news/"' in content:
        return content
    pattern = re.compile(r'(<nav class="footer-links"[^>]*>)(.*?)(</nav>)', re.S)
    match = pattern.search(content)
    if not match:
        return content
    replacement = match.group(1) + match.group(2) + '<a href="/blog/property-news/">Property News</a>' + match.group(3)
    return content[: match.start()] + replacement + content[match.end() :]


def make_svg(post: Post) -> str:
    palette = {
        "Abu Dhabi regulation": ("#6366f1", "#22c55e"),
        "Dubai market supply": ("#2563eb", "#14b8a6"),
        "Dubai market analysis": ("#7c3aed", "#0ea5e9"),
        "Dubai home buying": ("#0f766e", "#84cc16"),
        "Dubai luxury property": ("#7c2d12", "#d4af37"),
    }
    a, b = palette.get(post.category, ("#4f46e5", "#22c55e"))
    code = "AD" if "Abu Dhabi" in post.category else "DXB"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" role="img" aria-labelledby="t d">
<title id="t">{esc(post.title)}</title><desc id="d">Abstract UAE property market illustration</desc>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient><radialGradient id="r"><stop stop-color="#fff" stop-opacity=".24"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="1600" height="900" fill="#0a0a1a"/><rect width="1600" height="900" fill="url(#g)" opacity=".48"/><circle cx="1250" cy="150" r="430" fill="url(#r)"/><path d="M0 690L170 570l145 90 210-250 170 175 180-315 190 270 170-100 365 350v210H0z" fill="#0a0a1a" opacity=".78"/><g fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="3"><path d="M150 690V460h180v230M400 690V340h230v350M720 690V420h170v270M990 690V300h250v390M1320 690V500h150v190"/><path d="M80 720h1440"/></g><g fill="#fff"><text x="90" y="120" font-family="Arial,Helvetica,sans-serif" font-size="54" font-weight="700" letter-spacing="8">{code} PROPERTY BRIEF</text><text x="92" y="180" font-family="Arial,Helvetica,sans-serif" font-size="28" opacity=".72">Independent source-led analysis by James</text></g><g transform="translate(90 760)"><rect width="430" height="74" rx="37" fill="#0a0a1a" opacity=".72"/><text x="36" y="49" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="#fff">{esc(post.source_name)} source review</text></g></svg>'''


def build_head(post: Post, structured: dict) -> str:
    published = f"{post.date}T20:00:00+04:00"
    canonical = post.url
    image_url = SITE + post.image
    return f'''<!DOCTYPE html><html lang="en-AE"><head>{GTM_HEAD}<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/5576f66c8ff02a6a.css?v=12"/><link rel="stylesheet" href="/assets/property-news.css?v=2"/><link rel="shortcut icon" href="/favicon.svg"/><link rel="icon" href="/favicon.svg"/><link rel="apple-touch-icon" href="/favicon-192.png"/><title>{esc(post.title)} | James</title><meta name="description" content="{esc(post.description)}"/><meta name="author" content="James"/><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1"/><link rel="canonical" href="{canonical}"/><meta property="og:type" content="article"/><meta property="og:title" content="{esc(post.title)}"/><meta property="og:description" content="{esc(post.description)}"/><meta property="og:url" content="{canonical}"/><meta property="og:image" content="{image_url}"/><meta property="og:image:alt" content="{esc(image_alt(post))}"/><meta property="article:published_time" content="{published}"/><meta property="article:modified_time" content="{published}"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="{esc(post.title)}"/><meta name="twitter:description" content="{esc(post.description)}"/><meta name="twitter:image" content="{image_url}"/><script type="application/ld+json">{json.dumps(structured, ensure_ascii=False, separators=(',', ':'))}</script><link rel="alternate" type="application/rss+xml" title="James Blog" href="{SITE}/feed.xml"/><link rel="manifest" href="/site.webmanifest"/><meta name="theme-color" content="#0a0a1a"/><meta property="og:locale" content="en_AE"/><script defer src="/assets/site.js?v=5"></script></head>'''


def fact_grid(facts: list[list[str]]) -> str:
    return '<div class="news-fact-grid">' + "".join(
        f'<div class="news-fact"><strong>{esc(value)}</strong><span>{esc(label)}</span></div>'
        for value, label in facts
    ) + "</div>"


def seed_body(seed: dict) -> str:
    parts: list[str] = []
    parts.append(f'''<section class="answer-box" id="quick-answer"><p class="card-kicker">Quick answer</p><h2>What does this property update mean?</h2><p><strong>{seed["quick"]}</strong></p></section>''')
    parts.append(fact_grid(seed["facts"]))
    toc = ['<a href="#quick-answer">Quick answer</a>']
    for index, (heading, paragraphs) in enumerate(seed["sections"], start=1):
        section_id = f"section-{index}"
        toc.append(f'<a href="#{section_id}">{esc(heading)}</a>')
        if paragraphs and all(not p.startswith("<") and len(p) < 170 and not p.endswith(".") for p in paragraphs):
            body = "<ul>" + "".join(f"<li>{p}</li>" for p in paragraphs) + "</ul>"
        else:
            # Checklist-style sections are represented by short sentence items.
            if len(paragraphs) >= 4 and all(len(re.sub('<[^>]+>', '', p)) < 150 for p in paragraphs):
                body = "<ul>" + "".join(f"<li>{p}</li>" for p in paragraphs) + "</ul>"
            else:
                body = "".join(f"<p>{p}</p>" for p in paragraphs)
        parts.append(f'<section id="{section_id}"><h2>{esc(heading)}</h2>{body}</section>')
    toc.append('<a href="#source">Original source</a><a href="#faq">FAQ</a>')
    return "".join(toc), "".join(parts)


def related_links(current_slug: str, posts: list[Post]) -> str:
    candidates = [p for p in posts if p.slug != current_slug][:4]
    links = "".join(f'<a href="/blog/{p.slug}/">{esc(p.title)}</a>' for p in candidates)
    return f'<section><h2>Related property analysis</h2><div class="news-related">{links}<a href="/blog/property-news/">View all property news briefs</a><a href="/">Open the Dubai Data dashboard</a></div></section>'


def source_card(post: Post) -> str:
    return f'''<section id="source"><div class="source-credit"><div><span class="news-source-badge">Source: {esc(post.source_name)}</span><p>This article is an independent analysis of reporting published by {esc(post.source_name)}. It does not reproduce the source article or its images. Read the original report for the full reporting and quotations.</p></div><a class="button button-outline" href="{esc(post.source_url)}" target="_blank" rel="external noopener noreferrer">Read original source <span aria-hidden="true">↗</span></a></div></section>'''


def faq_html(faqs: list[list[str]]) -> str:
    return '<section class="article-faq" id="faq"><h2>Questions about this update</h2>' + "".join(
        f'<details><summary>{esc(question)}</summary><p>{esc(answer)}</p></details>' for question, answer in faqs
    ) + "</section>"


def render_seed(seed: dict, all_posts: list[Post]) -> str:
    post = Post(
        slug=seed["slug"], title=seed["title"], description=seed["description"],
        category=seed["category"], date=seed["date"], read_time=seed["read_time"],
        source_name=seed["source_name"], source_url=seed["source_url"],
        image=f'/images/property-news/{seed["slug"]}.webp', auto=False,
    )
    toc, body = seed_body(seed)
    faqs = seed["faqs"]
    structured = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "@id": post.url + "#article",
                "headline": post.title,
                "description": post.description,
                "datePublished": post.date + "T20:00:00+04:00",
                "dateModified": post.date + "T20:00:00+04:00",
                "mainEntityOfPage": post.url,
                "image": SITE + post.image,
                "author": {"@id": SITE + "/about-me/#james-ravi"},
                "publisher": {"@id": SITE + "/about-me/#james-ravi"},
                "isPartOf": {"@id": SITE + "/blog/#blog"},
                "inLanguage": "en-AE",
                "citation": [post.source_url, SITE + "/", SITE + "/blog/property-news/"],
                "about": [post.category, "UAE property market", "Property due diligence"],
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                    for q, a in faqs
                ],
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Dubai Data", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
                    {"@type": "ListItem", "position": 3, "name": "Property News", "item": SITE + "/blog/property-news/"},
                    {"@type": "ListItem", "position": 4, "name": post.title, "item": post.url},
                ],
            },
        ],
    }
    page = build_head(post, structured) + f'''<body>{GTM_BODY}<a class="skip-link" href="#main-content">Skip to main content</a><div class="reading-progress" aria-hidden="true"><span id="reading-progress-bar"></span></div>{NAV_HEADER}<main id="main-content"><article class="article-page"><header class="article-header section-shell"><nav class="breadcrumbs"><a href="/">Home</a><span>›</span><a href="/blog/">Blog</a><span>›</span><a href="/blog/property-news/">Property News</a></nav><p class="section-kicker">{esc(post.category)}</p><h1>{esc(post.title)}</h1><p class="article-deck">{esc(seed["deck"])}</p><div class="article-byline"><span>Analysis by <a href="/about-me/">James</a></span><time datetime="{post.date}">Published {datetime.fromisoformat(post.date).strftime('%-d %B %Y')}</time><span>{esc(post.read_time)}</span></div><figure class="article-hero-image news-brief-visual"><img src="{post.image}" alt="{esc(image_alt(post))}" width="1600" height="900" fetchpriority="high"/></figure></header><div class="article-layout section-shell"><aside class="article-toc"><strong>In this brief</strong>{toc}</aside><div class="article-body"><p class="news-automation-note"><strong>Editorial note:</strong> This is original analysis based on the attributed source report. Figures should be checked against official records before a transaction or valuation decision.</p>{body}{source_card(post)}{related_links(post.slug, all_posts)}{faq_html(faqs)}</div></div><section class="section-shell article-share"><p>Share this source-led property analysis.</p><div><a class="button button-outline" href="https://www.linkedin.com/sharing/share-offsite/?url={post.url}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a class="button nav-whatsapp" href="https://wa.me/?text={esc(post.title)}%20{post.url}" target="_blank" rel="noopener noreferrer">WhatsApp</a></div></section></article><section class="section-shell contact-card"><div><p class="section-kicker">Need a clearer market decision?</p><h2>Connect the headline to the property, community and buyer objective.</h2><p>For property launch strategy, investor acquisition, content or CRM conversion, share the project and target market.</p></div><a class="button nav-whatsapp" href="/contact/">Contact James <span aria-hidden="true">→</span></a></section></main>{FOOTER}</body></html>'''
    return page


def discover_links(category: dict) -> list[str]:
    links: list[str] = []

    def add(candidate: str) -> None:
        url = canonical_url(urljoin(category["url"], candidate))
        parsed = urlparse(url)
        if parsed.netloc != category["host"]:
            return
        prefixes = category.get("article_prefixes", [])
        if prefixes and not any(parsed.path.startswith(prefix) for prefix in prefixes):
            return
        base_path = urlparse(category["url"]).path.rstrip("/")
        path = parsed.path.rstrip("/")
        if not path or path == base_path:
            return
        if any(marker in parsed.path for marker in ("/feed", "/tag/", "/category/", "/author/", "/wp-content/", "/ar/")):
            return
        if path.endswith(("/xmlrpc.php", "/wp-json")):
            return
        if url not in links:
            links.append(url)

    try:
        response = request(category["url"])
    except Exception as exc:  # noqa: BLE001
        print(f"Category fetch failed for {category['name']}: {exc}", file=sys.stderr)
    else:
        soup = BeautifulSoup(response.text, "html.parser")
        for anchor in soup.find_all("a", href=True):
            add(anchor.get("href"))

    for feed_url in category.get("feed_urls", []):
        try:
            response = request(feed_url)
            import xml.etree.ElementTree as ET

            root = ET.fromstring(response.text)
            for item in root.findall(".//item"):
                link = item.findtext("link")
                if link:
                    add(link)
        except Exception as exc:  # noqa: BLE001
            print(f"Feed fetch failed for {category['name']}: {exc}", file=sys.stderr)

    return links[:60]


def first_meta(soup: BeautifulSoup, pairs: Iterable[tuple[str, str]]) -> str:
    for attr, value in pairs:
        tag = soup.find("meta", attrs={attr: value})
        if tag and tag.get("content"):
            return re.sub(r"\s+", " ", tag.get("content")).strip()
    return ""


def parse_date(soup: BeautifulSoup, text: str) -> datetime | None:
    raw = first_meta(soup, [("property", "article:published_time"), ("name", "date")])
    candidates = [raw]
    time_tag = soup.find("time", datetime=True)
    if time_tag:
        candidates.append(time_tag.get("datetime", ""))
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        try:
            payload = json.loads(script.string or script.get_text())
        except Exception:
            continue
        pending = payload if isinstance(payload, list) else [payload]
        while pending:
            item = pending.pop()
            if isinstance(item, list):
                pending.extend(item)
            elif isinstance(item, dict):
                if item.get("datePublished"):
                    candidates.append(str(item["datePublished"]))
                pending.extend(item.values())
    for candidate in candidates:
        if not candidate:
            continue
        try:
            parsed = datetime.fromisoformat(candidate.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=DUBAI_TZ)
            return parsed.astimezone(DUBAI_TZ)
        except ValueError:
            pass
    patterns = [
        r"PUBLISHED:\s*(?:\w{3}\s+)?(\d{1,2}\s+\w+\s+\d{4})",
        r"Published:\s*(?:\w{3}\s+)?(\d{1,2}\s+\w+\s+\d{4})",
        r"Last updated:\s*(\w+\s+\d{1,2},\s+\d{4})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.I)
        if not match:
            continue
        for fmt in ("%d %b %Y", "%d %B %Y", "%B %d, %Y"):
            try:
                return datetime.strptime(match.group(1), fmt).replace(tzinfo=DUBAI_TZ)
            except ValueError:
                continue
    return None


def extract_article(url: str, source_name: str) -> dict | None:
    try:
        response = request(url)
    except Exception as exc:  # noqa: BLE001
        print(f"Article fetch failed {url}: {exc}", file=sys.stderr)
        return None
    soup = BeautifulSoup(response.text, "html.parser")
    page_type = first_meta(soup, [("property", "og:type")]).lower()
    title_tag = soup.find("h1")
    title = re.sub(r"\s+", " ", title_tag.get_text(" ", strip=True)).strip() if title_tag else ""
    if not title:
        title = first_meta(soup, [("property", "og:title"), ("name", "twitter:title")])
    description = first_meta(soup, [("property", "og:description"), ("name", "description")])
    if not description and title_tag:
        next_h2 = title_tag.find_next("h2")
        if next_h2:
            description = re.sub(r"\s+", " ", next_h2.get_text(" ", strip=True)).strip()
    page_text = soup.get_text(" ", strip=True)
    published = parse_date(soup, page_text)
    canonical_tag = soup.find("link", rel=lambda value: value and "canonical" in value)
    final_url = canonical_url(canonical_tag.get("href") if canonical_tag and canonical_tag.get("href") else response.url)
    paragraphs: list[str] = []
    main = soup.find("article") or soup.find("main") or soup
    for paragraph in main.find_all("p"):
        text = re.sub(r"\s+", " ", paragraph.get_text(" ", strip=True)).strip()
        if len(text) < 55 or len(text) > 600:
            continue
        lower = text.lower()
        if any(block in lower for block in ["download our", "follow us", "recommended for you", "sign up", "written by"]):
            continue
        paragraphs.append(text)
    return {
        "url": final_url,
        "source_name": source_name,
        "title": title[:180],
        "description": description[:320],
        "published": published,
        "page_type": page_type,
        "paragraphs": paragraphs[:24],
    }


def is_property_relevant(article: dict) -> bool:
    text = f"{article.get('title', '')} {article.get('description', '')}".lower()
    signals = (
        "property", "real estate", "home", "housing", "apartment", "villa", "townhouse",
        "rent", "rental", "tenant", "landlord", "mortgage", "broker", "developer",
        "off-plan", "construction", "community", "residential", "commercial real estate",
        "land sale", "yield", "service charge", "handover", "building",
    )
    uae_signals = (
        "uae", "united arab emirates", "dubai", "abu dhabi", "sharjah", "ajman",
        "ras al khaimah", "rak", "fujairah", "umm al quwain",
    )
    # Publisher category pages sometimes surface London, UK or other foreign
    # stories. A property keyword alone is not enough for a UAE news brief.
    return any(signal in text for signal in signals) and any(signal in text for signal in uae_signals)


def title_signature(value: str) -> str:
    stop = {
        "the", "and", "for", "from", "with", "that", "this", "what", "why", "how",
        "new", "latest", "says", "report", "reports", "uae", "arabian", "business",
        "khaleej", "times", "gulf", "news", "national", "property", "finder",
    }
    words = re.findall(r"[a-z0-9]+", value.lower())
    return " ".join(sorted({word for word in words if len(word) > 2 and word not in stop}))


def duplicate_signature(signature: str, existing: set[str]) -> bool:
    current = set(signature.split())
    if not current:
        return False
    for saved in existing:
        other = set(saved.split())
        if not other:
            continue
        similarity = len(current & other) / len(current | other)
        if similarity >= 0.82:
            return True
    return False


def theme_for(title: str, description: str) -> str:
    text = (title + " " + description).lower()
    if any(k in text for k in ["broker", "regulator", "ranking", "licence", "framework", "rule"]):
        return "regulation"
    if any(k in text for k in ["record sale", "luxury", "ultra-prime", "mansion", "penthouse"]):
        return "luxury"
    if any(k in text for k in ["mortgage", "finance", "first-time buyer", "first time buyer", "homebuyer", "golden visa"]):
        return "buyer"
    if any(k in text for k in ["unit", "home", "handover", "supply", "launch", "completion"]):
        return "supply"
    if any(k in text for k in ["rent", "tenant", "rental", "lease"]):
        return "rental"
    if any(k in text for k in ["buyer", "homeowner"]):
        return "buyer"
    return "market"


def auto_title(article: dict, theme: str) -> str:
    # Preserve the source-specific subject instead of collapsing unrelated news
    # into a handful of repetitive SEO templates. The brief body and suffix make
    # clear that this is independent analysis rather than copied reporting.
    title = re.sub(r"\s+", " ", html.unescape(article.get("title", ""))).strip(" -|:")
    title = re.sub(r"\s+[|–—-]\s+(?:Gulf News|The National|Khaleej Times|Arabian Business).*$", "", title, flags=re.I)
    title = title[:96].rstrip(" ,;:-")
    suffix = hashlib.sha1(article["url"].encode()).hexdigest()[:5]
    return title, suffix


def extract_facts(paragraphs: list[str]) -> list[list[str]]:
    fact_patterns = [
        (re.compile(r"(?:Dh|AED)\s?\d[\d,.]*(?:\s?(?:million|billion|m|bn))?", re.I), "Reported value"),
        (re.compile(r"\d[\d,.]*\s?(?:%|per cent)", re.I), "Reported percentage"),
        (re.compile(r"\d[\d,]*\s+(?:new\s+)?(?:homes|units|transactions|deals|projects|contracts|buyers|villas|apartments|brokers)", re.I), "Reported activity"),
        (re.compile(r"\d[\d,]*\s+(?:square feet|sq ft|sqm|square metres)", re.I), "Reported size"),
    ]
    found: list[list[str]] = []
    seen: set[str] = set()
    for paragraph in paragraphs:
        for pattern, label in fact_patterns:
            for match in pattern.finditer(paragraph):
                phrase = re.sub(r"\s+", " ", match.group(0)).strip()
                key = phrase.lower()
                if key in seen:
                    continue
                seen.add(key)
                context = paragraph.lower()
                if "rent" in context:
                    label2 = "Reported rent or rental figure"
                elif "sale" in context or "sold" in context or "price" in context:
                    label2 = "Reported sale or price figure"
                elif "handover" in context or "complete" in context or "supply" in context:
                    label2 = "Reported supply figure"
                else:
                    label2 = label
                found.append([phrase, label2])
                if len(found) >= 4:
                    return found
    return found


def auto_analysis(theme: str) -> list[tuple[str, list[str]]]:
    """Return a differentiated decision framework for the detected intent."""
    sections = {
        "regulation": [
            ("Read the rule at source", ["Confirm the regulator, effective date, geography and people or transactions covered.", "Treat summaries as orientation; use the official notice for obligations and exceptions."]),
            ("Check the adviser and transaction", ["Verify licensing, representation, fees and conflicts for the person handling the property.", "Keep the property, contract, payment and title checks separate from the regulatory headline."]),
            ("Plan for implementation", ["Ask what changes immediately, what needs guidance and what remains unchanged.", "Retain dated records of advice, disclosures and signed documents."]),
        ],
        "luxury": [
            ("Separate the exceptional asset", ["Trophy properties are influenced by plot position, privacy, specification and a narrow buyer pool.", "One record or branded launch does not reprice ordinary homes in the same district."]),
            ("Build a defensible comparable set", ["Match plot and built-up area, condition, outlook, fit-out and transaction date.", "Use registered transactions where available and explain every material adjustment."]),
            ("Test liquidity and ownership cost", ["Include service charges, maintenance, staffing, finance and future capital work.", "Model a longer sale period because the qualified buyer universe may be small."]),
        ],
        "supply": [
            ("Distinguish planned, launched and completed homes", ["A scheduled pipeline is not the same as keys handed to owners.", "Check construction progress, completion evidence and the number of directly competing units."]),
            ("Map the pressure locally", ["Supply affects apartments, villas, districts and price bands differently.", "Compare the exact community, unit type, handover window and finished quality."]),
            ("Model absorption, not only delivery", ["Test vacancy, leasing time and resale competition when several similar homes complete together.", "Keep a conservative case for rent, service charges and initial maintenance."]),
        ],
        "rental": [
            ("Compare the full tenancy cost", ["Convert rent, payment-plan fees, deposit and recurring charges into one annual figure.", "A smaller instalment is not automatically a lower total rent."]),
            ("Keep the contract and payment route aligned", ["Confirm the landlord, registered tenancy amount, recipient and late-payment terms.", "Do not rely on an offer until eligibility and complete conditions are documented."]),
            ("Test landlord and tenant outcomes", ["Tenants should model affordability across the full term.", "Landlords should assess settlement timing, vacancy, maintenance and counterparty risk."]),
        ],
        "buyer": [
            ("Define the usable acquisition budget", ["Include transfer, trustee, agency, mortgage and initial ownership costs.", "Keep a liquidity reserve instead of using the headline purchase budget alone."]),
            ("Compare ready and off-plan consistently", ["Use the same purpose, time horizon, area, payment route and downside case.", "Check inspection evidence for ready homes and escrow, SPA and progress for off-plan property."]),
            ("Verify the exact unit", ["Compare layout, usable area, view, floor, service costs and nearby competition.", "Do not convert a citywide demand headline into an assumed property return."]),
        ],
        "market": [
            ("Identify what the headline measures", ["Separate transaction value, volume, asking prices, registrations and corporate sales.", "Check the period, geography and property types included."]),
            ("Move from aggregate to micro-market", ["Compare the relevant district, building or community using like-for-like evidence.", "Ready, off-plan, apartment and villa markets can move differently."]),
            ("Use a downside case", ["Allow for slower resale, lower rent, higher costs or later completion.", "A decision remains property-specific even when the wider market is active."]),
        ],
    }
    return sections[theme]


def commercial_destination(post: Post) -> dict[str, object]:
    text = f"{post.title} {post.description} {post.category}".lower()
    if "jebel ali village" in text:
        return {"label": "Community guide", "title": "Assess Jebel Ali Village after handover", "description": "Move from the 892-home delivery signal to inspection, community readiness, rent, net yield and resale checks.", "href": "/jebel-ali-village-property-investment/", "links": [("Rental-yield calculator", "/dubai-rental-yield-calculator/"), ("Dubai buyer hub", "/dubai-property-buyer-hub/")]}
    if any(word in text for word in ("india", "indian", "hyderabad")):
        return {"label": "India buyer guide", "title": "Plan a Dubai purchase from India", "description": "Connect the event headline to ownership, payment, remittance and acquisition-cost checks.", "href": "/dubai-property-investment-indian-buyers/", "links": [("Buying-cost calculator", "/dubai-property-buying-cost-calculator/"), ("Build a buyer brief", "/buy-invest-dubai/#buyer-enquiry")]}
    if any(word in text for word in ("rent", "tenant", "rental", "lease")):
        return {"label": "Investor tool", "title": "Test the rental numbers", "description": "Move from a rent headline to a property-level gross and net yield comparison.", "href": "/dubai-rental-yield-calculator/", "links": [("Dubai area data", "/dubai-data/"), ("Seller preparation brief", "/sell-dubai-property/#seller-enquiry")]}
    if any(word in text for word in ("mortgage", "finance", "bank", "credit")):
        return {"label": "Financing guide", "title": "Compare mortgage and cash routes", "description": "Put rates, liquidity, valuation and total acquisition cash on the same decision sheet.", "href": "/mortgage-vs-cash-dubai-property/", "links": [("Buying-cost calculator", "/dubai-property-buying-cost-calculator/"), ("Build a buyer brief", "/buy-invest-dubai/#buyer-enquiry")]}
    if any(word in text for word in ("supply", "homes", "units", "handover", "completion", "construction", "developer", "launch")):
        return {"label": "Buyer hub", "title": "Turn supply news into a shortlist", "description": "Compare communities, costs, property status and current area evidence before choosing a project.", "href": "/dubai-property-buyer-hub/", "links": [("Communities by budget", "/best-dubai-communities-by-budget/"), ("Dubai area data", "/dubai-data/")]}
    return {"label": "Market data", "title": "Check the headline against Dubai evidence", "description": "Use area data and a structured buyer brief before applying a market-wide figure to one property.", "href": "/dubai-data/", "links": [("Dubai buyer hub", "/dubai-property-buyer-hub/"), ("Build a buyer brief", "/buy-invest-dubai/#buyer-enquiry")]}


def commercial_resources_html(post: Post) -> str:
    route = commercial_destination(post)
    links = [(str(route["title"]), str(route["href"])), *route["links"], ("All property news briefs", "/blog/property-news/")]
    cards = "".join(f'<a href="{esc(href)}">{esc(label)}</a>' for label, href in links)
    return f'<section class="news-commercial-route"><p class="section-kicker">{esc(str(route["label"]))}</p><h2>{esc(str(route["title"]))}</h2><p>{esc(str(route["description"]))}</p><div class="news-related">{cards}</div></section>'


def commercial_cta_html(post: Post) -> str:
    route = commercial_destination(post)
    return f'<section class="section-shell contact-card"><div><p class="section-kicker">Structured next step</p><h2>{esc(str(route["title"]))}</h2><p>{esc(str(route["description"]))}</p></div><a class="button nav-whatsapp" href="{esc(str(route["href"]))}">Open {esc(str(route["label"]).lower())} <span aria-hidden="true">→</span></a></section>'


def render_auto(article: dict, post: Post, all_posts: list[Post], facts: list[list[str]], theme: str) -> str:
    published_iso = (article["published"] or NOW).date().isoformat()
    quick = (
        f"{post.source_name}'s report on {post.title.rstrip('.')} is a {theme.replace('-', ' ')} signal, not a property-level conclusion. "
        "Use the reported facts as a starting point, then test the exact community, contract, costs and comparable evidence."
    )
    if not facts:
        facts = [
            ["New source report", "The article was detected on the publisher's property page."],
            [published_iso, "Source publication date identified by the monitor."],
        ]
    sections = auto_analysis(theme)
    toc = '<a href="#quick-answer">Quick answer</a><a href="#reported">Reported signal</a>'
    body = f'''<section class="answer-box" id="quick-answer"><p class="card-kicker">Quick answer</p><h2>What should readers take from this update?</h2><p><strong>{esc(quick)}</strong></p></section>{fact_grid(facts)}<section id="reported"><h2>How this source update is used</h2><p>The monitor classified this as a {esc(theme.replace('-', ' '))} property update. Only limited factual signals are used here; the analysis, decision framework and wording are original.</p><p>The complete report remains on {esc(post.source_name)} and is linked below for its full context, named sources and methodology.</p></section>'''
    for i, (heading, paragraphs) in enumerate(sections, start=1):
        sid = f"analysis-{i}"
        toc += f'<a href="#{sid}">{esc(heading)}</a>'
        if len(paragraphs) >= 4 and all(len(p) < 150 for p in paragraphs):
            content = '<ul>' + ''.join(f'<li>{esc(p)}</li>' for p in paragraphs) + '</ul>'
        else:
            content = ''.join(f'<p>{esc(p)}</p>' for p in paragraphs)
        body += f'<section id="{sid}"><h2>{esc(heading)}</h2>{content}</section>'
    toc += '<a href="#source">Original source</a>'
    structured = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "@id": post.url + "#article",
        "headline": post.title,
        "description": post.description,
        "datePublished": published_iso + "T09:00:00+04:00",
        "dateModified": NOW.isoformat(timespec="seconds"),
        "mainEntityOfPage": post.url,
        "image": SITE + post.image,
        "author": {"@id": SITE + "/about-me/#james-ravi"},
        "publisher": {"@id": SITE + "/about-me/#james-ravi"},
        "isPartOf": {"@id": SITE + "/blog/#blog"},
        "inLanguage": "en-AE",
        "citation": [post.source_url, SITE + "/", SITE + "/blog/property-news/"],
    }
    return build_head(post, structured) + f'''<body>{GTM_BODY}<a class="skip-link" href="#main-content">Skip to main content</a><div class="reading-progress" aria-hidden="true"><span id="reading-progress-bar"></span></div>{NAV_HEADER}<main id="main-content"><article class="article-page"><header class="article-header section-shell"><nav class="breadcrumbs"><a href="/">Home</a><span>›</span><a href="/blog/">Blog</a><span>›</span><a href="/blog/property-news/">Property News</a></nav><p class="section-kicker">Source-linked property brief</p><h1>{esc(post.title)}</h1><p class="article-deck">{esc(post.description)}</p><div class="article-byline"><span>Analysis by <a href="/about-me/">James</a></span><time datetime="{post.date}">Published {datetime.fromisoformat(post.date).strftime('%-d %B %Y')}</time><span>{esc(post.read_time)}</span></div><figure class="article-hero-image news-brief-visual"><img src="{post.image}" alt="{esc(image_alt(post))}" width="1600" height="900"/></figure></header><div class="article-layout section-shell"><aside class="article-toc"><strong>In this brief</strong>{toc}</aside><div class="article-body"><p class="news-automation-note"><strong>Source monitoring:</strong> This original brief was triggered by a new report on a monitored publisher page. It uses the source's named subject and factual signals, then adds an independent decision framework.</p>{body}{commercial_resources_html(post)}{source_card(post)}{related_links(post.slug, all_posts)}</div></div></article>{commercial_cta_html(post)}</main>{FOOTER}</body></html>'''


def post_from_seed(seed: dict) -> Post:
    return Post(
        slug=seed["slug"], title=seed["title"], description=seed["description"], category=seed["category"],
        date=seed["date"], read_time=seed["read_time"], source_name=seed["source_name"],
        source_url=seed["source_url"], image=f'/images/property-news/{seed["slug"]}.webp', auto=False,
    )


def tile(post: Post) -> str:
    label = "Automated brief" if post.auto else "Source-led analysis"
    return f'''<article class="blog-tile"><a class="blog-tile-image" href="/blog/{post.slug}/"><img src="{post.image}" alt="{esc(image_alt(post))}" width="1600" height="900" loading="lazy"/></a><div class="blog-tile-copy"><div class="article-meta"><span>{esc(post.category)}</span><time datetime="{post.date}">{datetime.fromisoformat(post.date).strftime('%-d %B %Y')}</time><span>{esc(post.read_time)}</span></div><span class="news-source-badge">{label}, {esc(post.source_name)}</span><h2><a href="/blog/{post.slug}/">{esc(post.title)}</a></h2><p>{esc(post.description)}</p><a class="text-link" href="/blog/{post.slug}/">Read analysis <span aria-hidden="true">→</span></a></div></article>'''


def update_blog_index(posts: list[Post]) -> None:
    if not BLOG_INDEX.exists():
        return
    content = ensure_css_link(read_text(BLOG_INDEX))
    start = "<!-- PROPERTY_NEWS_AUTOMATION_START -->"
    end = "<!-- PROPERTY_NEWS_AUTOMATION_END -->"
    content = re.sub(re.escape(start) + r".*?" + re.escape(end), "", content, flags=re.S)
    block = start + '<div class="property-news-divider"><div><p class="section-kicker">Property news analysis</p><h2>Latest UAE property reports, explained.</h2></div><p>Original briefs based on monitored reporting from Khaleej Times, Gulf News, The National and Arabian Business, with source links, limitations and practical checks.</p></div>' + "".join(tile(p) for p in posts) + end
    marker = '</div><aside class="market-promo"'
    if marker in content:
        content = content.replace(marker, block + marker, 1)
    # Update structured data without reformatting the full page.
    script_pattern = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)
    for match in list(script_pattern.finditer(content)):
        try:
            data = json.loads(match.group(1))
        except Exception:
            continue
        graph = data.get("@graph") if isinstance(data, dict) else None
        if not isinstance(graph, list):
            continue
        blog = next((x for x in graph if x.get("@type") == "Blog"), None)
        collection = next((x for x in graph if x.get("@type") == "CollectionPage"), None)
        if not blog or not collection:
            continue
        existing_blog_posts = [x for x in blog.get("blogPost", []) if "/blog/" in x.get("@id", "")]
        new_refs = [{"@id": p.url + "#article"} for p in posts]
        known = {x.get("@id") for x in new_refs}
        blog["blogPost"] = new_refs + [x for x in existing_blog_posts if x.get("@id") not in known]
        item_list = collection.get("mainEntity", {})
        old_items = item_list.get("itemListElement", [])
        new_urls = {p.url for p in posts}
        generated = [{"@type": "ListItem", "position": i + 1, "url": p.url, "name": p.title} for i, p in enumerate(posts)]
        remaining = [x for x in old_items if x.get("url") not in new_urls]
        for i, item in enumerate(generated + remaining, start=1):
            item["position"] = i
        item_list["itemListElement"] = generated + remaining
        item_list["numberOfItems"] = len(item_list["itemListElement"])
        collection["mainEntity"] = item_list
        replacement = '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + '</script>'
        content = content[: match.start()] + replacement + content[match.end() :]
        break
    write_if_changed(BLOG_INDEX, content)


def render_hub(posts: list[Post]) -> str:
    cards = "".join(tile(p) for p in posts)
    item_list = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "UAE Property News Analysis",
        "url": SITE + "/blog/property-news/",
        "description": "Original source-led analysis of UAE property reporting from four monitored publishers.",
        "mainEntity": {
            "@type": "ItemList",
            "numberOfItems": len(posts),
            "itemListElement": [
                {"@type": "ListItem", "position": i + 1, "url": p.url, "name": p.title}
                for i, p in enumerate(posts)
            ],
        },
    }
    return f'''<!DOCTYPE html><html lang="en-AE"><head>{GTM_HEAD}<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/5576f66c8ff02a6a.css?v=12"/><link rel="stylesheet" href="/assets/property-news.css?v=2"/><link rel="shortcut icon" href="/favicon.svg"/><link rel="icon" href="/favicon.svg"/><link rel="apple-touch-icon" href="/favicon-192.png"/><title>UAE Property News Analysis | James</title><meta name="description" content="Original source-led analysis of UAE property reporting from Khaleej Times, Gulf News, The National and Arabian Business."/><link rel="canonical" href="{SITE}/blog/property-news/"/><meta property="og:type" content="website"/><meta property="og:title" content="UAE Property News Analysis"/><meta property="og:description" content="Property headlines explained with source links, market context and due-diligence checks."/><meta property="og:url" content="{SITE}/blog/property-news/"/><meta property="og:image" content="{SITE + posts[0].image}"/><meta property="og:image:alt" content="{esc(image_alt(posts[0]))}"/><script type="application/ld+json">{json.dumps(item_list, ensure_ascii=False, separators=(',', ':'))}</script><link rel="alternate" type="application/rss+xml" href="/feed.xml"/><script defer src="/assets/site.js?v=5"></script></head><body>{GTM_BODY}<a class="skip-link" href="#main-content">Skip to main content</a>{NAV_HEADER}<main id="main-content"><section class="section-shell news-hub-hero"><p class="section-kicker">Monitored UAE property news</p><h1>Property headlines, with the decision context added.</h1><p class="hero-description">This page tracks new property reporting from Khaleej Times, Gulf News, The National and Arabian Business. Each entry is an original brief with a direct source link, important limitations and practical checks for buyers, tenants, owners and investors.</p><div class="hero-actions"><a class="button button-primary" href="/blog/">All property guides</a><a class="button button-outline" href="/">Dubai Data</a><a class="button button-outline" href="/abu-dhabi-data/">Abu Dhabi Data</a></div></section><section class="section-shell"><div class="news-automation-note"><strong>Publishing schedule:</strong> The monitor checks all four publisher pages hourly. A new article is normally converted into a source brief within the next successful GitHub Actions run.</div><div class="news-hub-grid">{cards}</div></section><section class="section-shell contact-card"><div><p class="section-kicker">Need deeper analysis?</p><h2>Connect market reporting to a project, audience or acquisition plan.</h2><p>Share the property, target market and commercial objective.</p></div><a class="button nav-whatsapp" href="/contact/">Contact James <span aria-hidden="true">→</span></a></section></main>{FOOTER}</body></html>'''


def update_feed(posts: list[Post]) -> None:
    import xml.etree.ElementTree as ET
    ET.register_namespace("atom", "http://www.w3.org/2005/Atom")
    if FEED_PATH.exists():
        root = ET.fromstring(read_text(FEED_PATH))
        channel = root.find("channel")
    else:
        root = ET.Element("rss", {"version": "2.0"})
        channel = ET.SubElement(root, "channel")
        ET.SubElement(channel, "title").text = "James Blog"
        ET.SubElement(channel, "link").text = SITE + "/blog/"
        ET.SubElement(channel, "description").text = "Source-led UAE property insights from James."
    if channel is None:
        return
    last = channel.find("lastBuildDate")
    if last is None:
        last = ET.SubElement(channel, "lastBuildDate")
    last.text = email.utils.format_datetime(NOW)
    existing = {item.findtext("link") for item in channel.findall("item")}
    first_item = channel.find("item")
    for post in reversed(posts):
        if post.url in existing:
            continue
        item = ET.Element("item")
        ET.SubElement(item, "title").text = post.title
        ET.SubElement(item, "link").text = post.url
        guid = ET.SubElement(item, "guid", {"isPermaLink": "true"})
        guid.text = post.url
        dt = datetime.fromisoformat(post.date).replace(hour=20, tzinfo=DUBAI_TZ)
        ET.SubElement(item, "pubDate").text = email.utils.format_datetime(dt)
        ET.SubElement(item, "description").text = post.description
        if first_item is None:
            channel.append(item)
        else:
            channel.insert(list(channel).index(first_item), item)
    ET.indent(root, space="  ")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
    write_if_changed(FEED_PATH, xml)


def update_sitemap(posts: list[Post]) -> None:
    import xml.etree.ElementTree as ET
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", ns)
    if SITEMAP_PATH.exists():
        root = ET.fromstring(read_text(SITEMAP_PATH))
    else:
        root = ET.Element(f"{{{ns}}}urlset")
    entries = {node.findtext(f"{{{ns}}}loc"): node for node in root.findall(f"{{{ns}}}url")}

    def upsert(url: str, lastmod: str, changefreq: str, priority: str) -> None:
        node = entries.get(url)
        if node is None:
            node = ET.SubElement(root, f"{{{ns}}}url")
            ET.SubElement(node, f"{{{ns}}}loc").text = url
            entries[url] = node
        for tag, value in (("lastmod", lastmod), ("changefreq", changefreq), ("priority", priority)):
            child = node.find(f"{{{ns}}}{tag}")
            if child is None:
                child = ET.SubElement(node, f"{{{ns}}}{tag}")
            child.text = value

    upsert(SITE + "/blog/", NOW.date().isoformat(), "daily", "0.9")
    upsert(SITE + "/blog/property-news/", NOW.date().isoformat(), "hourly", "0.9")
    for post in posts:
        upsert(post.url, post.date, "weekly" if post.auto else "monthly", "0.8")
    ET.indent(root, space="  ")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
    write_if_changed(SITEMAP_PATH, xml)


def update_image_sitemap(posts: list[Post]) -> None:
    import xml.etree.ElementTree as ET
    sitemap_ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    image_ns = "http://www.google.com/schemas/sitemap-image/1.1"
    ET.register_namespace("", sitemap_ns)
    ET.register_namespace("image", image_ns)
    if IMAGE_SITEMAP_PATH.exists():
        root = ET.fromstring(read_text(IMAGE_SITEMAP_PATH))
    else:
        root = ET.Element(f"{{{sitemap_ns}}}urlset")
    entries = {
        node.findtext(f"{{{sitemap_ns}}}loc"): node
        for node in root.findall(f"{{{sitemap_ns}}}url")
    }
    for post in posts:
        node = entries.get(post.url)
        if node is None:
            node = ET.SubElement(root, f"{{{sitemap_ns}}}url")
            ET.SubElement(node, f"{{{sitemap_ns}}}loc").text = post.url
            entries[post.url] = node
        image_url = SITE + post.image
        existing = {
            image.findtext(f"{{{image_ns}}}loc")
            for image in node.findall(f"{{{image_ns}}}image")
        }
        if image_url not in existing:
            image = ET.SubElement(node, f"{{{image_ns}}}image")
            ET.SubElement(image, f"{{{image_ns}}}loc").text = image_url
    ET.indent(root, space="  ")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n"
    write_if_changed(IMAGE_SITEMAP_PATH, xml)


def internal_links_block(posts: list[Post], context: str = "Latest property news") -> str:
    latest = posts[:3]
    cards = ''.join(
        f'<a href="/blog/{p.slug}/"><span>{esc(p.category)}</span><strong>{esc(p.title)}</strong></a>'
        for p in latest
    )
    return f'''<!-- PROPERTY_NEWS_LINKS_START --><section class="section-shell property-news-links" aria-label="Related property news"><div><p class="section-kicker">{esc(context)}</p><h2>Read the source, then test the decision.</h2><p>Original reporting summaries with practical checks, market context and direct links to the publishers.</p></div><nav class="property-news-link-grid">{cards}<a href="/blog/property-news/"><span>News hub</span><strong>View all monitored UAE property briefs</strong></a><a href="/dubai-rental-yield-calculator/"><span>Investor tool</span><strong>Compare gross and net rental yield for two Dubai properties</strong></a></nav></section><!-- PROPERTY_NEWS_LINKS_END -->'''


def add_internal_links(posts: list[Post]) -> None:
    block = internal_links_block(posts)
    for path in ROOT.rglob("index.html"):
        if any(part.startswith(".") for part in path.relative_to(ROOT).parts):
            continue
        content = read_text(path)
        content = ensure_css_link(content)
        content = footer_property_news_link(content)
        rel = path.relative_to(ROOT).as_posix()
        should_add = (
            rel in {"index.html", "abu-dhabi-data/index.html", "about-me/index.html", "contact/index.html", "cite/index.html"}
            or (rel.startswith("blog/") and rel not in {"blog/index.html", "blog/property-news/index.html"})
        )
        if should_add:
            content = re.sub(r'<!-- PROPERTY_NEWS_LINKS_START -->.*?<!-- PROPERTY_NEWS_LINKS_END -->', '', content, flags=re.S)
            if "</main>" in content:
                content = content.replace("</main>", block + "</main>", 1)
        write_if_changed(path, content)


def initialize_seed_posts(state: dict) -> list[Post]:
    stored = {item.get("slug"): item for item in state.get("posts", []) if item.get("slug")}
    all_posts: list[Post] = []
    for seed in SEEDS:
        post = post_from_seed(seed)
        all_posts.append(post)
        stored[post.slug] = asdict(post)
        state["seen_urls"] = sorted(set(state.get("seen_urls", [])) | {canonical_url(post.source_url)})
    state["posts"] = list(stored.values())
    # Render after all seed metadata is known so related links are available.
    for seed in SEEDS:
        post = post_from_seed(seed)
        image_path = ROOT / post.image.lstrip("/")
        if not image_path.exists():
            raise FileNotFoundError(f"Missing curated property-news image: {image_path}")
        write_if_changed(ROOT / "blog" / post.slug / "index.html", render_seed(seed, all_posts))
    return all_posts


def create_auto_posts(state: dict, current_posts: list[Post]) -> list[Post]:
    seen = set(canonical_url(url) for url in state.get("seen_urls", []))
    signatures = set(state.get("seen_title_signatures", []))
    signatures.update(signature for signature in (title_signature(post.title) for post in current_posts) if signature)
    new_posts: list[Post] = []
    active_auto_count = sum(1 for post in current_posts if post.auto)
    max_active_auto_posts = 24  # Must not exceed the unique curated image pool.
    if active_auto_count >= max_active_auto_posts:
        print("Property-news image capacity reached; skipping new automated briefs until a unique image is added.")
        return new_posts
    discovered: list[tuple[str, str]] = []
    for category in CATEGORY_PAGES:
        for url in discover_links(category):
            discovered.append((url, category["name"]))
    cutoff = NOW - timedelta(hours=48)
    for url, source_name in discovered:
        if active_auto_count + len(new_posts) >= max_active_auto_posts:
            print("Property-news image capacity reached during this run; remaining links were left for a later check.")
            break
        url = canonical_url(url)
        if url in seen:
            continue
        article = extract_article(url, source_name)
        if not article:
            continue
        final_url = canonical_url(article["url"])
        if final_url in seen:
            seen.add(url)
            continue
        page_type = article.get("page_type", "")
        if page_type and page_type not in {"article", "newsarticle", "blogposting"}:
            seen.update({url, final_url})
            continue
        if not article["title"] or not is_property_relevant(article):
            seen.update({url, final_url})
            continue
        signature = title_signature(article["title"])
        if duplicate_signature(signature, signatures):
            seen.update({url, final_url})
            continue
        published = article["published"]
        if published is None:
            # Do not publish undated pages, this prevents archive links from flooding the blog.
            seen.update({url, final_url})
            continue
        if published < cutoff:
            seen.update({url, final_url})
            if signature:
                signatures.add(signature)
            continue
        theme = theme_for(article["title"], article["description"])
        title, suffix = auto_title(article, theme)
        slug = f"property-news-{(published or NOW).date().isoformat()}-{slugify(title, 58)}-{suffix}"
        curated_image = CURATED_AUTO_IMAGES.get(slug)
        if not curated_image:
            # No generic fallback: every published brief must first receive a
            # unique, subject-relevant editorial image and ALT description.
            seen.update({url, final_url})
            print(f"Held source report for editorial image review: {title}")
            continue
        category_label = {
            "regulation": "UAE property regulation",
            "luxury": "UAE luxury property",
            "supply": "UAE housing supply",
            "rental": "UAE rental market",
            "buyer": "UAE home buying",
            "market": "UAE property market",
        }[theme]
        post = Post(
            slug=slug,
            title=title,
            description={
                "regulation": f"A practical reading of a new {source_name} report, with the rule change separated from the checks buyers, tenants and owners still need to make.",
                "luxury": f"An independent reading of a new {source_name} luxury-property report, separating an exceptional headline from comparable evidence.",
                "supply": f"A source-linked reading of new {source_name} reporting on housing supply, buyer choice and the checks that matter at community level.",
                "rental": f"A practical reading of a new {source_name} rental report for tenants and landlords, with registered evidence and costs kept in view.",
                "buyer": f"An independent reading of a new {source_name} homebuyer report, with affordability and property-level checks added.",
                "market": f"A source-linked reading of a new {source_name} property report, with the headline separated from the evidence needed for a decision.",
            }[theme],
            category=category_label,
            date=(published or NOW).date().isoformat(),
            read_time="4 min read",
            source_name=source_name,
            source_url=final_url,
            image=curated_image,
            auto=True,
        )
        all_for_links = [post] + current_posts + new_posts
        facts = extract_facts(article["paragraphs"])
        write_if_changed(ROOT / "blog" / post.slug / "index.html", render_auto(article, post, all_for_links, facts, theme))
        new_posts.append(post)
        seen.update({url, final_url})
        if signature:
            signatures.add(signature)
        print(f"Created automated property brief: {post.title}")
    state["seen_urls"] = sorted(seen)
    state["seen_title_signatures"] = sorted(signatures)
    if new_posts:
        existing = {item.get("slug"): item for item in state.get("posts", []) if item.get("slug")}
        for post in new_posts:
            existing[post.slug] = asdict(post)
        state["posts"] = list(existing.values())
    return new_posts


def ordered_posts(state: dict) -> list[Post]:
    posts: list[Post] = []
    for item in state.get("posts", []):
        try:
            posts.append(Post(**{k: item[k] for k in Post.__dataclass_fields__}))
        except Exception as exc:  # noqa: BLE001
            print(f"Skipping malformed post state: {exc}", file=sys.stderr)
    posts.sort(key=lambda p: (p.date, p.slug), reverse=True)
    return posts


def main() -> int:
    os.chdir(ROOT)
    write_if_changed(CSS_PATH, CSS)
    state = load_state()
    seed_posts = initialize_seed_posts(state)
    current_posts = ordered_posts(state)
    create_auto_posts(state, current_posts or seed_posts)
    posts = ordered_posts(state)
    update_blog_index(posts)
    write_if_changed(HUB_PATH, render_hub(posts))
    update_feed(posts)
    update_sitemap(posts)
    update_image_sitemap(posts)
    add_internal_links(posts)
    save_state(state)
    print(f"Property news publishing complete, {len(posts)} briefs indexed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
