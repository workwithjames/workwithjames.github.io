#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD_ORIGIN = "https://workwithjames.github.io"
NEW_ORIGIN = "https://jamesrealty.uk"
TEXT_SUFFIXES = {
    ".html", ".xml", ".json", ".js", ".py", ".md", ".txt",
    ".webmanifest", ".yml", ".yaml", ".css",
}
SKIP_PARTS = {".git", ".automation", "node_modules"}
SKIP_FILES = {
    ROOT / ".github" / "workflows" / "property-news-autopublish.yml",
}
HEADER_PATTERN = re.compile(
    r'(<header\s+class="site-header".*?<a\s+class="brand"[^>]*>)James Ravi(</a>)',
    re.DOTALL,
)
HEADER_ARIA_PATTERN = re.compile(
    r'(<header\s+class="site-header".*?<a\s+class="brand"[^>]*aria-label=")James Ravi(?:,\s*Dubai Data)?(")',
    re.DOTALL,
)

changed: list[str] = []
for path in ROOT.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in TEXT_SUFFIXES:
        continue
    if path in SKIP_FILES or any(part in SKIP_PARTS for part in path.parts):
        continue
    try:
        original = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        continue

    updated = original.replace(OLD_ORIGIN, NEW_ORIGIN)
    if path.suffix.lower() == ".html":
        updated = HEADER_PATTERN.sub(r"\1James Realty\2", updated, count=1)
        updated = HEADER_ARIA_PATTERN.sub(r"\1James Realty\2", updated, count=1)

    if updated != original:
        path.write_text(updated, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT)))

print(f"Migrated {len(changed)} files to {NEW_ORIGIN}")
for item in changed:
    print(item)
