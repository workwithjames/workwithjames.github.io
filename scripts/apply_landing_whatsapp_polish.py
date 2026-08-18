#!/usr/bin/env python3
"""Apply scoped conversion and responsive polish to the 10 James Realty landing pages.

This intentionally patches the current bespoke HTML rather than rebuilding from the
shared generator, because several developer pages contain newer page-specific design
work. The generator is updated only as a future-safe baseline.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LANDING_SLUGS = ("emaar", "aldar", "damac", "binghatti", "nakheel", "mudon", "uk", "usa", "india", "ar")
WA = "https://wa.me/971528420933"


def write_if_changed(path: Path, original: str, updated: str) -> bool:
    if original == updated:
        return False
    path.write_text(updated, encoding="utf-8")
    return True


def update_css() -> bool:
    path = ROOT / "assets" / "landing-experience.css"
    original = path.read_text(encoding="utf-8")
    if "/* JR_CONTACT_POLISH_START */" in original:
        return False
    block = r'''

/* JR_CONTACT_POLISH_START */
/* Theme-aware WhatsApp CTA and final responsive rhythm. */
.jr-whatsapp-contact{
  width:max-content;
  max-width:100%;
  gap:10px;
  margin-top:2px;
  border-color:var(--accent-2);
  background:color-mix(in srgb,var(--accent) 28%,transparent);
  color:#fff;
}
.jr-whatsapp-contact:hover,.jr-whatsapp-contact:focus-visible{
  background:var(--accent-2);
  border-color:var(--accent-2);
  color:#111411;
}
.jr-mobile-cta [data-whatsapp-action]{
  border-color:var(--accent);
  background:color-mix(in srgb,var(--accent) 10%,transparent);
}
@media (min-width:761px) and (max-width:1100px){
  :root{--section:clamp(58px,7vw,78px)}
  .jr-form-wrap{gap:34px}
  .jr-map{gap:34px}
}
@media(max-width:760px){
  :root{--section:56px}
  .jr-hero{min-height:min(760px,100svh)}
  .jr-hero__inner{
    min-height:calc(min(760px,100svh) - 68px);
    padding-block:clamp(52px,8vh,68px) 30px;
  }
  .jr-form-wrap{gap:28px}
  .jr-form-copy ul{margin:24px 0;padding:18px 0}
  .jr-whatsapp-contact{width:100%;justify-content:center}
  .jr-mobile-cta{grid-template-columns:1.15fr .85fr}
}
@media(max-width:420px){
  :root{--section:52px}
  .jr-hero h1{font-size:clamp(2.85rem,14vw,4.15rem)}
  .jr-faq{gap:26px}
}
/* JR_CONTACT_POLISH_END */
'''
    return write_if_changed(path, original, original + block)


def update_js() -> bool:
    path = ROOT / "assets" / "landing-experience.js"
    original = path.read_text(encoding="utf-8")
    if "landing_whatsapp_click" in original:
        return False
    needle = "  qsa('[data-phone-action]').forEach(link=>link.addEventListener('click',()=>track('landing_phone_click',{link_url:link.href})));\n"
    if needle not in original:
        raise RuntimeError("Could not locate the existing landing phone analytics hook")
    addition = needle + "  qsa('[data-whatsapp-action]').forEach(link=>link.addEventListener('click',()=>track('landing_whatsapp_click',{link_url:link.href,cta_location:link.dataset.location||'page'})));\n"
    return write_if_changed(path, original, original.replace(needle, addition, 1))


def update_generator() -> bool:
    path = ROOT / "scripts" / "build_landing_experiences.mjs"
    original = path.read_text(encoding="utf-8")
    updated = re.sub(r"landing-experience\.css\?v=\d+", "landing-experience.css?v=9", original)
    updated = re.sub(r"landing-experience\.js\?v=\d+", "landing-experience.js?v=7", updated)

    old_v4_form = '''<a class="jr-phone" data-phone-action href="tel:+971528420933">${ar?'اتصال مباشر':'Call James'} · ${PHONE}</a>'''
    new_v4_form = '''<a class="jr-button jr-button--ghost jr-whatsapp-contact" data-whatsapp-action data-location="form" href="${WA}" target="_blank" rel="noopener noreferrer">${ar?'تواصل عبر واتساب':'Chat on WhatsApp'} <span aria-hidden="true">↗</span></a>'''
    old_v4_mobile = '''<a class="jr-button jr-button--ghost" data-phone-action href="tel:+971528420933">${page.arabic?'اتصال':'Call'}</a>'''
    new_v4_mobile = '''<a class="jr-button jr-button--ghost" data-whatsapp-action data-location="mobile-sticky" href="${WA}" target="_blank" rel="noopener noreferrer">${page.arabic?'واتساب':'WhatsApp'} <span aria-hidden="true">↗</span></a>'''
    old_legacy_contact = '''<div class="jr-contact"><a data-location="form" href="${WA}">${page.arabic?'واتساب':'WhatsApp'} · ${PHONE}</a><a data-location="form" href="tel:+971528420933">${page.arabic?'اتصال مباشر':'Call'} · ${PHONE}</a></div>'''
    new_legacy_contact = '''<div class="jr-contact"><a data-whatsapp-action data-location="form" href="${WA}" target="_blank" rel="noopener noreferrer">${page.arabic?'تواصل عبر واتساب':'Chat on WhatsApp'} ↗</a></div>'''

    updated = updated.replace(old_v4_form, new_v4_form)
    updated = updated.replace(old_v4_mobile, new_v4_mobile)
    updated = updated.replace(old_legacy_contact, new_legacy_contact)

    if 'href="tel:+971528420933"' in updated:
        raise RuntimeError("The landing generator still contains a visible telephone CTA")
    return write_if_changed(path, original, updated)


def update_landing_pages() -> tuple[int, int]:
    tel_anchor = re.compile(r'<a(?P<before>[^>]*)href="tel:\+971528420933"(?P<after>[^>]*)>(?P<label>.*?)</a>', re.S)
    changed = 0
    replaced_total = 0

    for slug in LANDING_SLUGS:
        path = ROOT / "landing" / slug / "index.html"
        original = path.read_text(encoding="utf-8")
        updated = re.sub(r"landing-experience\.css\?v=\d+", "landing-experience.css?v=9", original)
        updated = re.sub(r"landing-experience\.js\?v=\d+", "landing-experience.js?v=7", updated)
        arabic = slug == "ar"
        per_page = 0

        def replace_tel(match: re.Match[str]) -> str:
            nonlocal per_page
            per_page += 1
            attrs = (match.group("before") + " " + match.group("after")).lower()
            if "jr-phone" in attrs:
                label = "تواصل عبر واتساب" if arabic else "Chat on WhatsApp"
                return (
                    f'<a class="jr-button jr-button--ghost jr-whatsapp-contact" data-whatsapp-action '
                    f'data-location="form" href="{WA}" target="_blank" rel="noopener noreferrer">'
                    f'{label} <span aria-hidden="true">↗</span></a>'
                )
            label = "واتساب" if arabic else "WhatsApp"
            return (
                f'<a class="jr-button jr-button--ghost" data-whatsapp-action data-location="mobile-sticky" '
                f'href="{WA}" target="_blank" rel="noopener noreferrer">'
                f'{label} <span aria-hidden="true">↗</span></a>'
            )

        updated = tel_anchor.sub(replace_tel, updated)
        replaced_total += per_page

        if 'href="tel:' in updated:
            raise RuntimeError(f"{slug}: a telephone CTA remains")
        if "+971 52 842 0933" in updated:
            raise RuntimeError(f"{slug}: a visible raw James Realty phone number remains")
        if "data-whatsapp-action" not in updated:
            raise RuntimeError(f"{slug}: no tracked WhatsApp CTA found")
        if "landing-experience.css?v=9" not in updated or "landing-experience.js?v=7" not in updated:
            raise RuntimeError(f"{slug}: current shared-asset versions are missing")

        images = re.findall(r"<img\b[^>]*>", updated, flags=re.I)
        if not images:
            raise RuntimeError(f"{slug}: no images found")
        for tag in images:
            if not re.search(r'\balt="[^"]+"', tag, flags=re.I):
                raise RuntimeError(f"{slug}: image without descriptive alt text: {tag[:100]}")
        project_images = re.findall(r'<article class="jr-project".*?</article>', updated, flags=re.I | re.S)
        for card in project_images:
            match = re.search(r"<img\b[^>]*>", card, flags=re.I)
            if match and 'loading="lazy"' not in match.group(0):
                raise RuntimeError(f"{slug}: below-fold project image is not lazy loaded")

        if write_if_changed(path, original, updated):
            changed += 1

    return changed, replaced_total


def update_live_qa() -> bool:
    path = ROOT / ".github" / "workflows" / "verify-live-landing-layout.yml"
    original = path.read_text(encoding="utf-8")
    updated = original

    trigger = "      - '.github/workflows/verify-live-landing-layout.yml'"
    if "assets/landing-experience.css" not in updated:
        updated = updated.replace(
            trigger,
            trigger
            + "\n      - 'assets/landing-experience.css'"
            + "\n      - 'assets/landing-experience.js'"
            + "\n      - 'landing/**/index.html'"
            + "\n      - 'scripts/build_landing_experiences.mjs'",
            1,
        )

    updated = updated.replace("cssV8", "cssV9").replace("landing-experience.css?v=8", "landing-experience.css?v=9")

    metrics_needle = "                overflow: document.documentElement.scrollWidth - window.innerWidth,\n"
    if "telLinks:" not in updated:
        metrics_addition = metrics_needle + (
            "                telLinks: document.querySelectorAll('a[href^=\\\"tel:\\\"]').length,\n"
            "                whatsappLinks: document.querySelectorAll('a[href^=\\\"https://wa.me/971528420933\\\"]').length,\n"
            "                visibleBrokenImages: [...document.images].filter(img => {\n"
            "                  const r=img.getBoundingClientRect();\n"
            "                  return r.bottom>0 && r.top<innerHeight && (!img.complete || img.naturalWidth===0);\n"
            "                }).length,\n"
        )
        if metrics_needle not in updated:
            raise RuntimeError("Could not extend live layout metrics")
        updated = updated.replace(metrics_needle, metrics_addition, 1)

    mobile_needle = "            await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });"
    if "const intermediate = []" not in updated:
        intermediate = """            const intermediate = [];
            for (const viewport of [{width:1024,height:850,name:'laptop'},{width:768,height:1024,name:'tablet'}]) {
              await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
              await page.reload({ waitUntil:'networkidle2', timeout:45000 });
              const result = await metrics(page);
              intermediate.push({name:viewport.name, overflow:result.overflow, telLinks:result.telLinks, whatsappLinks:result.whatsappLinks, visibleBrokenImages:result.visibleBrokenImages});
            }

""" + mobile_needle
        if mobile_needle not in updated:
            raise RuntimeError("Could not extend live QA viewports")
        updated = updated.replace(mobile_needle, intermediate, 1)

    check_needle = "              mobileOverflow: mobile.overflow <= 2,\n"
    if "laptopOverflow:" not in updated:
        check_addition = (
            "              laptopOverflow: (intermediate.find(x=>x.name==='laptop')?.overflow ?? 999) <= 2,\n"
            "              tabletOverflow: (intermediate.find(x=>x.name==='tablet')?.overflow ?? 999) <= 2,\n"
            "              noTelephoneCtas: desktop.telLinks === 0 && mobile.telLinks === 0 && intermediate.every(x=>x.telLinks===0),\n"
            "              whatsappAvailable: desktop.whatsappLinks >= 1 && mobile.whatsappLinks >= 1 && intermediate.every(x=>x.whatsappLinks>=1),\n"
            "              visibleImagesLoaded: desktop.visibleBrokenImages === 0 && mobile.visibleBrokenImages === 0 && intermediate.every(x=>x.visibleBrokenImages===0),\n"
            + check_needle
        )
        if check_needle not in updated:
            raise RuntimeError("Could not extend live QA checks")
        updated = updated.replace(check_needle, check_addition, 1)

    log_needle = "              mobile: {\n                overflow: round(mobile.overflow),"
    if "              intermediate," not in updated:
        updated = updated.replace(log_needle, "              intermediate,\n" + log_needle, 1)

    return write_if_changed(path, original, updated)


def main() -> int:
    changed_parts = []
    if update_css():
        changed_parts.append("shared CSS")
    if update_js():
        changed_parts.append("analytics JS")
    if update_generator():
        changed_parts.append("generator baseline")
    page_count, replacement_count = update_landing_pages()
    if page_count:
        changed_parts.append(f"{page_count} landing pages")
    if update_live_qa():
        changed_parts.append("live responsive QA")

    print(f"Converted {replacement_count} visible phone links to WhatsApp CTAs.")
    print("Updated: " + (", ".join(changed_parts) if changed_parts else "nothing; already current"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
