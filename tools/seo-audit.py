"""Аудит SEO-здоровья всех публичных страниц bez-it.ru.
Проверяет наличие: title, meta description, canonical, og:title, og:image,
yandex-verification, Метрики (108625027), JSON-LD.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "apps" / "bez-it" / "public"

CHECKS = [
    ("title",        r"<title>[^<]{20,150}</title>"),
    ("description",  r'<meta[^>]+name=["\']description["\'][^>]+content=["\'][^"\']{50,}["\']'),
    ("canonical",    r'<link[^>]+rel=["\']canonical["\']'),
    ("og:title",     r'<meta[^>]+property=["\']og:title["\']'),
    ("og:image",     r'<meta[^>]+property=["\']og:image["\']'),
    ("yandex-ver",   r'<meta[^>]+name=["\']yandex-verification["\']'),
    ("metrika",      r'108625027'),
    ("json-ld",      r'application/ld\+json'),
    ("reachGoal",    r'reachGoal'),
]

def audit_one(path: Path):
    html = path.read_text(encoding="utf-8", errors="ignore")
    results = {}
    for name, pat in CHECKS:
        results[name] = bool(re.search(pat, html, re.IGNORECASE))
    return results

def main():
    files = sorted(PUBLIC.rglob("*.html"))
    files = [f for f in files if "/cabinet/" not in str(f)]

    summary = {name: 0 for name, _ in CHECKS}
    issues = []
    for f in files:
        r = audit_one(f)
        for k, v in r.items():
            if v:
                summary[k] += 1
        missing = [k for k, v in r.items() if not v]
        if missing:
            rel = f.relative_to(PUBLIC)
            issues.append((str(rel), missing))

    total = len(files)
    print(f"\n=== SEO AUDIT bez-it.ru ({total} pages) ===\n")
    for name, _ in CHECKS:
        count = summary[name]
        pct = 100 * count / total if total else 0
        bar = "█" * int(pct / 5) + "·" * (20 - int(pct / 5))
        print(f"  {name:14s}  {bar}  {count:3d}/{total} ({pct:5.1f}%)")

    if issues:
        print(f"\n=== PAGES WITH MISSING ELEMENTS ({len(issues)}) ===")
        for path, missing in issues[:30]:
            print(f"  {path}: {', '.join(missing)}")
        if len(issues) > 30:
            print(f"  ... and {len(issues) - 30} more")

    # exit code: 0 if all critical green, 1 otherwise
    critical = ["title", "description", "canonical", "metrika"]
    if all(summary[k] == total for k in critical):
        print("\n✅ critical checks: OK")
        return 0
    print("\n⚠ some critical checks failed")
    return 1

if __name__ == "__main__":
    exit(main())
