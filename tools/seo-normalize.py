"""Идемпотентный SEO-нормализатор. Добавляет отсутствующие:
- og:title (из <title>)
- og:image (по умолчанию /og-image.svg)
- og:type, og:url (из canonical)
- description (если нет — не трогаем, без контента не додумаем)
"""
import re
from pathlib import Path

PUBLIC = Path(__file__).resolve().parent.parent / "apps" / "bez-it" / "public"

def fix(html: str, url_path: str) -> tuple[str, int]:
    changes = 0
    # достать title
    m_title = re.search(r"<title>([^<]+)</title>", html, re.IGNORECASE)
    title = m_title.group(1).strip() if m_title else "bez-it.ru"

    # og:image
    if not re.search(r'<meta[^>]+property=["\']og:image["\']', html, re.IGNORECASE):
        inject = '<meta property="og:image" content="https://bez-it.ru/og-image.svg">\n'
        html = html.replace("</head>", inject + "</head>", 1)
        changes += 1
    # og:title
    if not re.search(r'<meta[^>]+property=["\']og:title["\']', html, re.IGNORECASE):
        inject = f'<meta property="og:title" content="{title}">\n'
        html = html.replace("</head>", inject + "</head>", 1)
        changes += 1
    # og:type
    if not re.search(r'<meta[^>]+property=["\']og:type["\']', html, re.IGNORECASE):
        html = html.replace("</head>", '<meta property="og:type" content="website">\n</head>', 1)
        changes += 1
    # og:url
    if not re.search(r'<meta[^>]+property=["\']og:url["\']', html, re.IGNORECASE):
        full = f"https://bez-it.ru{url_path}"
        html = html.replace("</head>", f'<meta property="og:url" content="{full}">\n</head>', 1)
        changes += 1
    return html, changes


def main():
    total_files = 0
    total_changes = 0
    for f in sorted(PUBLIC.rglob("*.html")):
        if "/cabinet/" in str(f):
            continue
        rel = f.relative_to(PUBLIC)
        url_path = "/" + str(rel).replace("index.html", "")
        html = f.read_text(encoding="utf-8")
        new, n = fix(html, url_path)
        if n:
            f.write_text(new, encoding="utf-8")
            total_files += 1
            total_changes += n
            print(f"  {rel}: +{n}")
    print(f"\nfiles changed: {total_files}  tags added: {total_changes}")


if __name__ == "__main__":
    main()
