"""Генерирует /regions/index.html — каталог всех 20 городов."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
OUT = ROOT / "apps" / "bez-it" / "public" / "regions" / "index.html"

cities = {}
for f in sorted(TOOLS.glob("cities-*.json")):
    cities.update(json.loads(f.read_text(encoding="utf-8")))

# группируем по федеральным округам
by_fd = {}
for slug, c in cities.items():
    by_fd.setdefault(c["federal_district"], []).append((slug, c))

FD_ORDER = ["ЦФО", "СЗФО", "ЮФО", "ПФО", "УрФО", "СФО"]

items_ld = [
    {
        "@type": "ListItem",
        "position": i + 1,
        "url": f"https://bez-it.ru/regions/{slug}.html",
        "name": c["name_nom"],
    }
    for i, (slug, c) in enumerate(cities.items())
]

itemlist = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "География работы bez-it.ru по России",
    "numberOfItems": len(cities),
    "itemListElement": items_ld,
}

breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://bez-it.ru/"},
        {"@type": "ListItem", "position": 2, "name": "Регионы", "item": "https://bez-it.ru/regions/"},
    ],
}

METRIKA = """<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=108625027', 'ym');
    ym(108625027, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script>
<noscript><div><img src="https://mc.yandex.ru/watch/108625027" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->"""

fd_blocks = []
for fd in FD_ORDER:
    items = by_fd.get(fd, [])
    if not items:
        continue
    cards = "\n      ".join(
        f'''<a class="city-card" href="/regions/{slug}.html" onclick="ym(108625027,'reachGoal','region_click_{slug}')">
        <h3>{c["name_nom"]}</h3>
        <p>{c["region"]}</p>
        <span>{c["delivery"].split(",")[0]}</span>
      </a>'''
        for slug, c in sorted(items, key=lambda x: x[1]["name_nom"])
    )
    fd_blocks.append(f'''<section class="fd-block"><div class="wrap">
  <h2>{fd} — {len(items)} {"регион" if len(items)==1 else "региона" if len(items)<5 else "регионов"}</h2>
  <div class="cities-grid">
      {cards}
  </div>
</div></section>''')

fd_html = "\n".join(fd_blocks)

html = f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>География работы bez-it.ru — 20 регионов России | Защита КИИ, ФСТЭК, СКЗИ</title>
<meta name="description" content="Работаем во всех федеральных округах России: Москва, СПб, Екатеринбург, Казань, Новосибирск и ещё 15 городов. Защита КИИ, аттестация ФСТЭК, разработка СКЗИ по ПП-313.">
<meta name="keywords" content="КИИ регионы, ФСТЭК города России, СКЗИ регионы, защита КИИ по России, аттестация ФСТЭК регионы">
<meta name="robots" content="index,follow">
<meta name="yandex-verification" content="__YANDEX_VERIFY__">
<link rel="canonical" href="https://bez-it.ru/regions/">
<meta property="og:title" content="География работы bez-it.ru — 20 регионов России">
<meta property="og:type" content="website">
<meta property="og:url" content="https://bez-it.ru/regions/">
<meta property="og:image" content="https://bez-it.ru/og-image.svg">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">
{json.dumps(itemlist, ensure_ascii=False, indent=1)}
</script>
<script type="application/ld+json">
{json.dumps(breadcrumb, ensure_ascii=False, indent=1)}
</script>
{METRIKA}
<style>
.region-crumb{{padding:14px 0;font-size:14px;opacity:.75}}
.hero.regions-hub{{padding:56px 0 30px}}
.hero.regions-hub h1{{font-size:36px;max-width:820px}}
.hero.regions-hub p{{font-size:18px;max-width:760px;margin:14px 0 20px;line-height:1.55}}
.fd-block{{padding:28px 0;border-bottom:1px solid #eaeef4}}
.fd-block h2{{font-size:22px;margin-bottom:16px;color:#0b1b2b}}
.cities-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}}
.city-card{{background:#fff;border:1px solid #e6ebf2;border-radius:12px;padding:16px 18px;color:inherit;text-decoration:none;transition:border-color .15s}}
.city-card:hover{{border-color:#ff5a1f}}
.city-card h3{{margin:0 0 4px;font-size:17px;color:#ff5a1f}}
.city-card p{{margin:0;font-size:13px;opacity:.7;line-height:1.35}}
.city-card span{{display:block;margin-top:8px;font-size:12px;opacity:.6}}
.cta-final{{background:#0b1b2b;color:#fff;text-align:center;padding:44px 0}}
.cta-final h2{{color:#fff;margin-bottom:10px}}
.cta-final p{{opacity:.85;max-width:580px;margin:0 auto 20px}}
.cta-final .btn{{background:#ff5a1f;color:#fff}}
</style>
</head>
<body>
<header class="hdr"><div class="wrap hdr-in">
  <a href="/" class="logo">bez<span>-it</span>.ru</a>
  <a class="btn" href="/#leadHero" onclick="ym(108625027,'reachGoal','header_cta')">Вызвать инженера</a>
</div></header>

<nav class="region-crumb"><div class="wrap">
  <a href="/">Главная</a> · Регионы
</div></nav>

<section class="hero regions-hub"><div class="wrap">
  <h1>География работы: {len(cities)} регионов России</h1>
  <p>Работаем в 6 федеральных округах через собственные офисы партнёров в Москве и СПб + удалённая поддержка по всей стране. Выезд инженера в ваш город — от 1 до 5 рабочих дней.</p>
</div></section>

{fd_html}

<section class="cta-final"><div class="wrap">
  <h2>Вашего города нет в списке?</h2>
  <p>Работаем по всей России, в большинство регионов выезд возможен за 3–5 рабочих дней. Оставьте заявку — сориентируем по срокам и логистике.</p>
  <a class="btn" href="/#leadHero" onclick="ym(108625027,'reachGoal','regions_hub_cta')">Оставить заявку</a>
</div></section>

<footer><div class="wrap">
  © 2026 bez-it.ru · <a href="/">Главная</a> · <a href="/privacy.html">Политика ПДн</a> · <a href="/oferta.html">Оферта</a>
</div></footer>
</body>
</html>
"""

OUT.write_text(html, encoding="utf-8")
print(f"written {OUT}: {len(html.splitlines())} lines, {len(cities)} cities in {len(by_fd)} federal districts")
