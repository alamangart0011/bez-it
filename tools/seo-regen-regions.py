#!/usr/bin/env python3
"""bez-it.ru — генератор 20 уникальных региональных лендингов.
Использует данные из tools/cities-*.json и шаблон.
"""
import json, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
OUT = ROOT / "apps" / "bez-it" / "public" / "regions"
OUT.mkdir(parents=True, exist_ok=True)

def load_cities():
    cities = {}
    for f in sorted(TOOLS.glob("cities-*.json")):
        with open(f, encoding="utf-8") as fh:
            cities.update(json.load(fh))
    return cities

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

def jsonld(city_slug, city):
    reviews_ld = [
        {
            "@type": "Review",
            "author": {"@type": "Person", "name": r["author"]},
            "reviewRating": {"@type": "Rating", "ratingValue": r["rating"], "bestRating": 5},
            "reviewBody": r["text"],
        }
        for r in city["reviews"]
    ]
    local_business = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": f"bez-it.ru — {city['name_nom']}",
        "description": f"Информационная безопасность, защита КИИ, аттестация ФСТЭК, разработка СКЗИ в {city['name_loc']}. Партнёр — {city['partner']}.",
        "url": f"https://bez-it.ru/regions/{city_slug}.html",
        "telephone": "+7-800-555-35-35",
        "email": "info@bez-it.ru",
        "priceRange": "от 85 000 ₽",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": city["name_nom"],
            "addressRegion": city["region"],
            "addressCountry": "RU",
        },
        "areaServed": [{"@type": "AdministrativeArea", "name": city["region"]}],
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": round(sum(r["rating"] for r in city["reviews"]) / len(city["reviews"]), 1),
            "reviewCount": len(city["reviews"]),
            "bestRating": 5,
        },
        "review": reviews_ld,
    }
    faq = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q["q"],
                "acceptedAnswer": {"@type": "Answer", "text": q["a"]},
            }
            for q in city["faq"]
        ],
    }
    breadcrumb = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Главная", "item": "https://bez-it.ru/"},
            {"@type": "ListItem", "position": 2, "name": "Регионы", "item": "https://bez-it.ru/regions/"},
            {"@type": "ListItem", "position": 3, "name": city["name_nom"], "item": f"https://bez-it.ru/regions/{city_slug}.html"},
        ],
    }
    return json.dumps(local_business, ensure_ascii=False, indent=1), json.dumps(faq, ensure_ascii=False, indent=1), json.dumps(breadcrumb, ensure_ascii=False, indent=1)

print(f"OK: loaded {len(load_cities())} cities")


TEMPLATE = """<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{descr}">
<meta name="keywords" content="{keywords}">
<meta name="robots" content="index,follow">
<meta name="yandex-verification" content="__YANDEX_VERIFY__">
<link rel="canonical" href="https://bez-it.ru/regions/{slug}.html">
<meta property="og:title" content="{og_title}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://bez-it.ru/regions/{slug}.html">
<meta property="og:image" content="https://bez-it.ru/og-image.svg">
<meta property="og:description" content="{descr}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="stylesheet" href="/style.css">
<script type="application/ld+json">
{ld_biz}
</script>
<script type="application/ld+json">
{ld_faq}
</script>
<script type="application/ld+json">
{ld_crumb}
</script>
{metrika}
<style>
.region-crumb{{padding:14px 0;font-size:14px;opacity:.75}}
.region-crumb a{{color:#0b1b2b}}
.hero.region{{padding:56px 0 40px}}
.hero.region h1{{font-size:38px;max-width:820px}}
.hero.region .lede{{font-size:18px;line-height:1.55;max-width:780px;margin:14px 0 24px}}
.kpi-row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin:30px 0}}
.kpi{{background:#fff;border:1px solid #e6ebf2;border-radius:12px;padding:18px 20px}}
.kpi b{{display:block;font-size:26px;color:#ff5a1f;margin-bottom:6px}}
.kpi span{{font-size:14px;opacity:.75;line-height:1.4}}
.partners{{background:#f7f9fc;padding:38px 0}}
.partners h2{{margin-bottom:18px}}
.partner-list{{display:flex;flex-wrap:wrap;gap:12px;font-size:15px}}
.partner-list span{{background:#fff;border:1px solid #e6ebf2;padding:8px 16px;border-radius:100px}}
.reviews{{padding:44px 0}}
.review-card{{background:#fff;border:1px solid #e6ebf2;border-radius:14px;padding:22px 24px;margin-bottom:14px}}
.review-stars{{color:#ff5a1f;font-size:18px;margin-bottom:6px}}
.review-author{{font-size:13px;opacity:.7;margin-top:10px}}
.case{{background:#0b1b2b;color:#fff;padding:44px 0}}
.case p{{max-width:780px;font-size:17px;line-height:1.6;opacity:.9}}
.faq{{padding:44px 0;background:#f7f9fc}}
.faq details{{background:#fff;border:1px solid #e6ebf2;border-radius:12px;padding:14px 20px;margin-bottom:10px}}
.faq summary{{font-weight:700;cursor:pointer;padding:6px 0}}
.faq p{{margin-top:10px;line-height:1.6;opacity:.85}}
.cta-final{{background:#ff5a1f;color:#fff;text-align:center;padding:54px 0}}
.cta-final h2{{color:#fff;font-size:30px;margin-bottom:10px}}
.cta-final p{{opacity:.95;max-width:560px;margin:0 auto 22px}}
.cta-final .btn{{background:#fff;color:#ff5a1f}}
</style>
</head>
<body>
<header class="hdr"><div class="wrap hdr-in">
  <a href="/" class="logo">bez<span>-it</span>.ru</a>
  <a class="btn" href="/#leadHero" onclick="ym(108625027,'reachGoal','header_cta')">Вызвать инженера</a>
</div></header>

<nav class="region-crumb"><div class="wrap">
  <a href="/">Главная</a> · <a href="/regions/">Регионы</a> · {name_nom}
</div></nav>

<section class="hero region"><div class="wrap">
  <h1>{h1}</h1>
  <p class="lede">{lede}</p>
  <a class="btn" href="/#leadHero" onclick="ym(108625027,'reachGoal','hero_cta_{slug}')">Оставить заявку в {name_loc}</a>

  <div class="kpi-row">
    <div class="kpi"><b>{industries_count}</b><span>ключевых отраслей в {name_loc}</span></div>
    <div class="kpi"><b>{delivery_short}</b><span>срок первого выезда</span></div>
    <div class="kpi"><b>{avg_rating}/5</b><span>средняя оценка клиентов</span></div>
    <div class="kpi"><b>от 75 000 ₽</b><span>категорирование КИИ</span></div>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <h2>Ключевые отрасли, в которых работаем в {name_loc}</h2>
  <div class="grid-3">
    {industry_cards}
  </div>
</div></section>

<section class="partners"><div class="wrap">
  <h2>Клиенты и партнёры в регионе</h2>
  <p style="margin-bottom:16px;opacity:.8">Работаем с предприятиями уровня:</p>
  <div class="partner-list">
    {partner_tags}
  </div>
</div></section>

<section class="reviews"><div class="wrap">
  <h2>Отзывы клиентов из {name_gen}</h2>
  {review_cards}
</div></section>

<section class="case"><div class="wrap">
  <h2 style="color:#fff">Пример кейса: {name_nom}</h2>
  <p>{case_study}</p>
</div></section>

<section class="section"><div class="wrap">
  <h2>Что чаще заказывают в {name_loc}</h2>
  <div class="grid-3">
    <div class="card"><h3><a href="/kii-2026.html">Защита КИИ 187-ФЗ</a></h3><p>Категорирование, модель угроз, подключение к ГосСОПКА. От 75 000 ₽. Сроки — 20–30 рабочих дней в зависимости от сложности.</p></div>
    <div class="card"><h3><a href="/fstek-attestaciya.html">Аттестация ФСТЭК № 17/21</a></h3><p>ИСПДн и ГИС, классы защищённости 1Г, 1В, К1, К2. От 150 000 ₽, срок 30–45 рабочих дней.</p></div>
    <div class="card"><h3><a href="/skzi-razrabotka.html">СКЗИ и ГОСТ-VPN</a></h3><p>Разработка и сертификация СКЗИ по ПП-313, внедрение ГОСТ-VPN для защищённой связи между офисами в {name_loc} и другими регионами.</p></div>
    <div class="card"><h3><a href="/gossopka-podklyuchenie.html">Подключение к ГосСОПКА</a></h3><p>Для значимых объектов КИИ. Передача инцидентов в НКЦКИ, регистрация, методика. От 350 000 ₽.</p></div>
    <div class="card"><h3><a href="/ispdn-152fz.html">ИСПДн 152-ФЗ</a></h3><p>Категории К1–К4, модель угроз ФСТЭК БДУ, уведомление РКН. От 120 000 ₽, 15 рабочих дней.</p></div>
    <div class="card"><h3><a href="/audit-ib.html">Экспресс-аудит ИБ</a></h3><p>Анализ соответствия 187-ФЗ, 152-ФЗ, № 17/21. Отчёт с приоритезированными рекомендациями за 5 рабочих дней.</p></div>
  </div>
</div></section>

<section class="faq"><div class="wrap">
  <h2>Часто задаваемые вопросы о работе в {name_loc}</h2>
  {faq_blocks}
</div></section>

<section class="cta-final"><div class="wrap">
  <h2>Нужна защита КИИ, ИСПДн или ФСТЭК в {name_loc}?</h2>
  <p>Оставьте заявку — свяжемся в течение 2 часов в рабочее время. Первичная смета и оценка срока — бесплатно.</p>
  <a class="btn" href="/#leadHero" onclick="ym(108625027,'reachGoal','final_cta_{slug}')">Оставить заявку</a>
</div></section>

<footer><div class="wrap">
  © 2026 bez-it.ru · <a href="/">Главная</a> · <a href="/privacy.html">Политика ПДн</a> · <a href="/oferta.html">Оферта</a> · <a href="/regions/">Все регионы</a>
</div></footer>
</body>
</html>
"""


def render(slug, city):
    ld_biz, ld_faq, ld_crumb = jsonld(slug, city)
    avg = round(sum(r["rating"] for r in city["reviews"]) / len(city["reviews"]), 1)
    industry_cards = "\n    ".join(
        f'<div class="card"><h3>{i["name"]}</h3><p><b>{i["count"]}</b> — {i["details"]}</p></div>'
        for i in city["industries"]
    )
    partner_tags = "\n    ".join(f"<span>{c}</span>" for c in city["companies"])
    review_cards = "\n  ".join(
        f'''<div class="review-card"><div class="review-stars">{"★" * r["rating"]}{"☆" * (5 - r["rating"])}</div><p>«{r["text"]}»</p><div class="review-author">— {r["author"]}</div></div>'''
        for r in city["reviews"]
    )
    faq_blocks = "\n  ".join(
        f'<details><summary>{q["q"]}</summary><p>{q["a"]}</p></details>'
        for q in city["faq"]
    )
    delivery_short = city["delivery"].split(",")[0].strip()
    title = f"КИИ, ФСТЭК, СКЗИ в {city['name_loc']} — {delivery_short} | bez-it.ru"
    descr = f"Защита КИИ, аттестация ФСТЭК, разработка СКЗИ и подключение к ГосСОПКА в {city['name_loc']}. Партнёр — {city['partner']}. {delivery_short}. От 75 000 ₽."
    keywords = f"КИИ {city['name_nom']}, ФСТЭК {city['name_nom']}, СКЗИ {city['name_nom']}, 187-ФЗ {city['name_loc']}, аттестация {city['name_loc']}, ИБ {city['region']}"
    og_title = f"Информационная безопасность в {city['name_loc']}: КИИ, ФСТЭК, СКЗИ"
    h1 = f"Защита КИИ, аттестация ФСТЭК и СКЗИ в {city['name_loc']}"
    lede = f"Партнёр в регионе — {city['partner']}. {city['office']}. Выезд инженера: {city['delivery']}. Лицензии ФСТЭК, ФСБ, Минцифры — действующие. Работаем с 2015 года, 140+ сданных проектов по всей России."
    return TEMPLATE.format(
        slug=slug, title=title, descr=descr, keywords=keywords, og_title=og_title,
        ld_biz=ld_biz, ld_faq=ld_faq, ld_crumb=ld_crumb, metrika=METRIKA,
        name_nom=city["name_nom"], name_gen=city["name_gen"], name_loc=city["name_loc"],
        h1=h1, lede=lede, industries_count=len(city["industries"]),
        delivery_short=delivery_short, avg_rating=avg,
        industry_cards=industry_cards, partner_tags=partner_tags,
        review_cards=review_cards, faq_blocks=faq_blocks,
        case_study=city["case_study"],
    )


def main():
    cities = load_cities()
    count = 0
    for slug, city in cities.items():
        html = render(slug, city)
        (OUT / f"{slug}.html").write_text(html, encoding="utf-8")
        count += 1
    print(f"generated {count} region pages in {OUT}")


if __name__ == "__main__":
    main()
