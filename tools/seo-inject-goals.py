"""Проходит по всем публичным HTML-страницам bez-it.ru и добавляет:
1. yandex-verification meta (если нет)
2. Metrika reachGoal() на CTA-кнопки с href=/#leadHero, tel:, mailto:
Идемпотентно — можно запускать повторно.
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "apps" / "bez-it" / "public"

# 1) yandex-verification meta
YV_META = '<meta name="yandex-verification" content="__YANDEX_VERIFY__">'

def ensure_yandex_verify(html: str) -> tuple[str, bool]:
    if "yandex-verification" in html:
        return html, False
    # вставить перед </head>
    if "</head>" not in html:
        return html, False
    return html.replace("</head>", f"{YV_META}\n</head>", 1), True

# 2) reachGoal wrapping
# Паттерны ссылок-CTA, куда нужно добавить onclick, если его ещё нет
CTA_PATTERNS = [
    # <a href="/#leadHero" class="btn">...</a> или без class
    (re.compile(r'(<a[^>]*href=["\']\/#leadHero["\'][^>]*?)(>)', re.IGNORECASE), "lead_cta_click"),
    (re.compile(r'(<a[^>]*href=["\']#leadHero["\'][^>]*?)(>)', re.IGNORECASE), "lead_cta_click"),
    (re.compile(r'(<a[^>]*href=["\']tel:[^"\']+["\'][^>]*?)(>)', re.IGNORECASE), "phone_click"),
    (re.compile(r'(<a[^>]*href=["\']mailto:[^"\']+["\'][^>]*?)(>)', re.IGNORECASE), "email_click"),
]

def add_goals(html: str) -> tuple[str, int]:
    n = 0
    for pat, goal in CTA_PATTERNS:
        def repl(m):
            nonlocal n
            tag = m.group(1)
            if "onclick" in tag.lower():
                return m.group(0)
            n += 1
            return f'{tag} onclick="ym(108625027,\'reachGoal\',\'{goal}\')"{m.group(2)}'
        html = pat.sub(repl, html)
    return html, n


def process(path: Path) -> tuple[bool, int, bool]:
    html = path.read_text(encoding="utf-8")
    html2, goals = add_goals(html)
    html3, yv_added = ensure_yandex_verify(html2)
    changed = (html3 != html)
    if changed:
        path.write_text(html3, encoding="utf-8")
    return changed, goals, yv_added


def main():
    files = []
    for p in PUBLIC.rglob("*.html"):
        # пропускаем cabinet если он тут же
        if "/cabinet/" in str(p):
            continue
        files.append(p)
    total_goals = 0
    total_changed = 0
    total_yv = 0
    for f in sorted(files):
        changed, goals, yv = process(f)
        if changed:
            total_changed += 1
            total_goals += goals
            total_yv += int(yv)
            rel = f.relative_to(PUBLIC)
            print(f"  {rel}: goals+{goals} yv+{int(yv)}")
    print(f"\nfiles changed: {total_changed}/{len(files)}  goals added: {total_goals}  yandex-verification added: {total_yv}")


if __name__ == "__main__":
    main()
