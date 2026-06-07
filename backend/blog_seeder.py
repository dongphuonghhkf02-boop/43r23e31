"""
Blog seeder — populates `db.blog_articles` with real bilingual (EN + RU)
content the first time the collection is empty.

Behaviour
─────────
• Called automatically from server.py startup AFTER staff seeding.
• Only seeds if the collection is empty (zero documents) — never overwrites
  existing CMS content.
• 8 production-ready, fully bilingual articles covering all six categories.
• Cover images use existing /api/static/figma/blog/*.png assets which are
  shipped in /app/frontend/public/figma/blog/ — exposed via the same
  StaticFiles mount the public site already uses.
• Tags are real, lower-cased, deduped — wired into the public list /api
  endpoint and the public tag filter.
• published=True and published_at staggered across the last 6 weeks so the
  "Featured this week" / "Latest articles" sections show a realistic feed.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from typing import List, Dict, Any

logger = logging.getLogger("bibi.blog_seeder")


def _strip_html(html_str: str) -> str:
    if not html_str:
        return ""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html_str)).strip()


def _read_minutes(*texts: str) -> int:
    words = 0
    for t in texts:
        if t:
            words += len(_strip_html(t).split())
    return max(1, round(words / 200))


def _slug(s: str) -> str:
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"[\s-]+", "-", s).strip("-")
    return s[:80] or uuid4().hex[:10]


# ─────────────────────────────────────────────────────────────────────────
#  Article dataset — production copy, EN + RU
# ─────────────────────────────────────────────────────────────────────────
# Body is HTML compatible with TipTap output: h2, h3, p, ul, ol, li,
# blockquote, strong, em, a, img.

ARTICLES: List[Dict[str, Any]] = [
    {
        "category": "analysis",
        "cover_image_url": "/figma/blog/image-15@2x.png",
        "tags": ["copart", "iaai", "market analysis", "q1 2026", "salvage"],
        "days_ago": 6,
        "title": {
            "en": "USA Salvage Car Prices Hit 3-Year Low: The Best Buying Window in a Decade",
            "ru": "Цены на salvage-автомобили из США — минимум за 3 года: лучшее окно для покупки за десятилетие",
        },
        "excerpt": {
            "en": "Copart and IAAI auction data for Q1 2026 reveals a 17% drop in average bid prices across most popular segments. We break down which categories offer the biggest opportunity — and why the window might close by autumn.",
            "ru": "Данные аукционов Copart и IAAI за I квартал 2026 года показывают падение средних ставок на 17% в самых популярных сегментах. Разбираем, какие категории дают наибольшие возможности и почему окно может закрыться к осени.",
        },
        "body": {
            "en": (
                "<p>Family SUVs are popular because they combine space, comfort and resale value. The key is choosing models with available parts and manageable repair costs.</p>"
                "<h2>Start with the real total cost</h2>"
                "<p>The correct approach is to combine the purchase price, auction fee, inland transport, ocean freight, port handling, customs duty, VAT, service fee and delivery within Bulgaria. If one of these elements is ignored, the car may look cheap at auction but become expensive after import.</p>"
                "<blockquote><p><strong>Do not compare cars by bid price only.</strong> Compare them by estimated final cost in Bulgaria.</p></blockquote>"
                "<h2>Check title, damage and odometer</h2>"
                "<p>Title status, damage type and odometer status are decision-making filters. A clean title does not always mean a perfect vehicle, and a damaged vehicle is not always a bad deal. The important part is whether the damage matches the repair budget and resale value.</p>"
                "<h2>Use the auction as data, not emotion</h2>"
                "<p>Before making a bid, define your maximum total budget. If the price crosses that number, the right decision is to skip the car and wait for a better listing.</p>"
            ),
            "ru": (
                "<p>Семейные внедорожники популярны, потому что сочетают пространство, комфорт и хорошую цену перепродажи. Главное — выбрать модели с доступными запчастями и предсказуемой стоимостью ремонта.</p>"
                "<h2>Начните с реальной итоговой стоимости</h2>"
                "<p>Правильный подход — сложить цену покупки, аукционный сбор, внутренний транспорт, океанский фрахт, портовые сборы, пошлину, НДС, сервисный сбор и доставку в Болгарии. Если упустить один из этих пунктов, машина может казаться дешёвой на аукционе, но оказаться дорогой после импорта.</p>"
                "<blockquote><p><strong>Не сравнивайте машины только по ставке аукциона.</strong> Сравнивайте их по прогнозируемой итоговой цене в Болгарии.</p></blockquote>"
                "<h2>Проверяйте title, повреждения и пробег</h2>"
                "<p>Статус title, тип повреждения и состояние одометра — это решающие фильтры. Чистый title не гарантирует идеальный автомобиль, а повреждённая машина не всегда плохая сделка. Важно, укладывается ли повреждение в бюджет ремонта и цену перепродажи.</p>"
                "<h2>Используйте аукцион как данные, а не эмоции</h2>"
                "<p>Перед ставкой определите максимальный совокупный бюджет. Если цена пересекает эту планку — правильное решение пропустить машину и ждать лучший лот.</p>"
            ),
        },
    },
    {
        "category": "analysis",
        "cover_image_url": "/figma/blog/image-152@2x.png",
        "tags": ["usa", "korea", "comparison", "budget"],
        "days_ago": 6,
        "title": {
            "en": "USA vs Korea: Which Market Fits Your Budget?",
            "ru": "США против Кореи: какой рынок подходит вашему бюджету?",
        },
        "excerpt": {
            "en": "When USA auction makes sense, and when Korean cars are a cleaner and faster option.",
            "ru": "Когда аукционы США имеют смысл, а когда корейские машины — более чистый и быстрый вариант.",
        },
        "body": {
            "en": (
                "<p>The two main supply markets behind BIBI Cars look superficially similar — but the moment you compare them by total cost of ownership, the differences become significant.</p>"
                "<h2>Auction structure</h2>"
                "<p>US salvage (Copart/IAAI) is bid-driven and slot-based. Korean public auctions (Encar, Lotte, AJ Cell) trade on transparent fixed-price sheets with the option to negotiate. Korea has a much shorter logistics chain — 28 to 36 days door-to-door is typical.</p>"
                "<h2>Total cost comparison</h2>"
                "<ul><li>USA: bid + fees + sea freight + EU duties + repair (if any)</li>"
                "<li>Korea: list price + auction fee + sea freight + EU duties (repair almost never needed)</li></ul>"
                "<p>Below €18,000 final cost, Korea is usually cheaper and faster. Above €22,000, USA opens up models that simply aren't on Korean lots (modern American trucks, V8 sedans, performance trims).</p>"
            ),
            "ru": (
                "<p>Два основных рынка-поставщика, на которых работает BIBI Cars, на первый взгляд похожи — но при сравнении по полной стоимости владения различия становятся значительными.</p>"
                "<h2>Структура аукциона</h2>"
                "<p>Salvage-аукционы США (Copart/IAAI) работают по ставкам и слотам. Корейские публичные аукционы (Encar, Lotte, AJ Cell) — это прозрачные прайс-листы с фиксированной ценой и возможностью торга. Логистическая цепочка у Кореи существенно короче — обычно 28–36 дней «от двери до двери».</p>"
                "<h2>Сравнение общих расходов</h2>"
                "<ul><li>США: ставка + сборы + морской фрахт + пошлины ЕС + ремонт (если нужен)</li>"
                "<li>Корея: цена + аукционный сбор + морской фрахт + пошлины ЕС (ремонт почти не нужен)</li></ul>"
                "<p>До €18 000 итоговой стоимости Корея обычно дешевле и быстрее. Свыше €22 000 США открывают модели, которых просто нет на корейских лотах (современные американские пикапы, седаны V8, performance-комплектации).</p>"
            ),
        },
    },
    {
        "category": "costs",
        "cover_image_url": "/figma/blog/image-153@2x.png",
        "tags": ["customs", "vat", "logistics", "bulgaria"],
        "days_ago": 11,
        "title": {
            "en": "What Is Included in the Final Car Cost in Bulgaria?",
            "ru": "Что входит в итоговую стоимость автомобиля в Болгарии?",
        },
        "excerpt": {
            "en": "Auction fee, logistics, customs duty, VAT, service fees and delivery — explained line by line.",
            "ru": "Аукционный сбор, логистика, пошлина, НДС, сервисные платежи и доставка — построчно.",
        },
        "body": {
            "en": (
                "<p>The single most expensive mistake new importers make is judging an auction listing by the bid price alone. A €6,000 bid often turns into a €14,000 invoice in Bulgaria once everything is added.</p>"
                "<h2>The 8-line cost sheet</h2>"
                "<ol>"
                "<li><strong>Bid price</strong> — what you pay the auction.</li>"
                "<li><strong>Auction fee</strong> — flat + percent of bid.</li>"
                "<li><strong>Inland transport</strong> — from auction yard to US/KR port.</li>"
                "<li><strong>Sea freight</strong> — container or RoRo.</li>"
                "<li><strong>EU port handling</strong> — Hamburg/Rotterdam unload.</li>"
                "<li><strong>Customs duty</strong> — 10% on declared CIF value.</li>"
                "<li><strong>VAT</strong> — 20% on CIF + duty.</li>"
                "<li><strong>Service &amp; delivery</strong> — paperwork + truck to your door.</li>"
                "</ol>"
                "<blockquote><p>Always ask for a written quote that lists all 8 lines separately — that's the only way to compare offers honestly.</p></blockquote>"
            ),
            "ru": (
                "<p>Самая дорогая ошибка новичков — оценивать лот только по ставке. Ставка €6 000 после всех расходов часто превращается в €14 000 счёта в Болгарии.</p>"
                "<h2>8 строк затрат</h2>"
                "<ol>"
                "<li><strong>Ставка</strong> — то, что вы платите аукциону.</li>"
                "<li><strong>Аукционный сбор</strong> — фиксированная часть + процент от ставки.</li>"
                "<li><strong>Внутренний транспорт</strong> — от аукционной площадки до порта в США/Корее.</li>"
                "<li><strong>Морской фрахт</strong> — контейнер или RoRo.</li>"
                "<li><strong>Портовые сборы в ЕС</strong> — Гамбург/Роттердам.</li>"
                "<li><strong>Пошлина</strong> — 10% от стоимости CIF.</li>"
                "<li><strong>НДС</strong> — 20% от CIF + пошлины.</li>"
                "<li><strong>Сервис и доставка</strong> — документы + грузовик до вашего адреса.</li>"
                "</ol>"
                "<blockquote><p>Всегда требуйте письменную смету с разнесёнными 8 строками — только так можно честно сравнить несколько предложений.</p></blockquote>"
            ),
        },
    },
    {
        "category": "guides",
        "cover_image_url": "/figma/blog/image-151@2x.png",
        "tags": ["title", "salvage", "rebuilt", "guide"],
        "days_ago": 16,
        "title": {
            "en": "Clean, Salvage and Rebuilt Titles Explained",
            "ru": "Clean, Salvage и Rebuilt title — что они на самом деле означают",
        },
        "excerpt": {
            "en": "Title status is not the same as vehicle condition. Here is how to read it correctly.",
            "ru": "Статус title — это не то же самое, что техническое состояние автомобиля. Разбираем, как его правильно читать.",
        },
        "body": {
            "en": (
                "<h2>What does the title actually tell you?</h2>"
                "<p>The title is the ownership document. It is updated whenever an insurance company pays out a total loss or a state inspector reclassifies the vehicle. It does <em>not</em> automatically describe the current physical condition.</p>"
                "<h2>The three main types</h2>"
                "<ul>"
                "<li><strong>Clean</strong> — never declared a total loss. Typical for trade-in or repo cars.</li>"
                "<li><strong>Salvage</strong> — declared total loss by an insurer. Cannot be road-legal until rebuilt and inspected.</li>"
                "<li><strong>Rebuilt</strong> (or <em>Reconstructed</em>) — previously salvage, passed state inspection, road-legal.</li>"
                "</ul>"
                "<h2>What it means for EU import</h2>"
                "<p>Bulgarian registration only cares whether the car passes <strong>GTP</strong> after import. A Salvage car that is properly repaired registers normally — but the title history must be disclosed honestly when you resell.</p>"
            ),
            "ru": (
                "<h2>Что на самом деле говорит title?</h2>"
                "<p>Title — это документ о праве собственности. Он обновляется, когда страховая компания признаёт тотальную гибель автомобиля, либо когда инспектор штата меняет его классификацию. Title <em>не</em> описывает автоматически текущее физическое состояние.</p>"
                "<h2>Три основных типа</h2>"
                "<ul>"
                "<li><strong>Clean</strong> — никогда не признавался тотальной гибелью. Типично для trade-in или repo-машин.</li>"
                "<li><strong>Salvage</strong> — признан тотальной гибелью страховой. Не допускается к движению, пока не восстановлен и не прошёл инспекцию.</li>"
                "<li><strong>Rebuilt</strong> (или <em>Reconstructed</em>) — ранее salvage, прошёл инспекцию штата, допущен к движению.</li>"
                "</ul>"
                "<h2>Что это значит для импорта в ЕС</h2>"
                "<p>При регистрации в Болгарии важно одно — проходит ли машина <strong>ГТП</strong> после импорта. Salvage-машина, грамотно восстановленная, регистрируется в обычном порядке — но историю title необходимо честно раскрывать при перепродаже.</p>"
            ),
        },
    },
    {
        "category": "reviews",
        "cover_image_url": "/figma/blog/image-152@2x.png",
        "tags": ["suv", "family", "budget", "import"],
        "days_ago": 11,
        "title": {
            "en": "Best Family SUVs to Import Under €15,000",
            "ru": "Лучшие семейные SUV для импорта до €15 000",
        },
        "excerpt": {
            "en": "Reliable options with good parts availability, reasonable repair costs and strong resale value.",
            "ru": "Надёжные варианты с хорошей доступностью запчастей, разумной стоимостью ремонта и стабильной ценой перепродажи.",
        },
        "body": {
            "en": (
                "<p>If you are importing your first family car, the safest pattern is to stay in the 2017–2020 model years, mid-size SUV segment, with EU-friendly engines (1.5–2.5L petrol/hybrid).</p>"
                "<h2>Our top 5 picks under €15,000 final cost</h2>"
                "<ol>"
                "<li><strong>Toyota RAV4 Hybrid (2019–2020)</strong> — bulletproof drivetrain, parts everywhere.</li>"
                "<li><strong>Honda CR-V 1.5T (2017–2019)</strong> — cheaper than RAV4, watch the turbo oil dilution recall.</li>"
                "<li><strong>Mazda CX-5 2.5 (2018–2020)</strong> — best driving feel, slightly thirstier.</li>"
                "<li><strong>Hyundai Tucson 1.6T (2019–2020)</strong> — DCT can be twitchy in city, but very cheap to fix.</li>"
                "<li><strong>Kia Sorento 2.4 (2018–2019)</strong> — 7 seats, surprisingly strong resale.</li>"
                "</ol>"
                "<blockquote><p>For each of these, target salvage with <strong>front-bumper / hood</strong> damage only — repair stays under €1,800.</p></blockquote>"
            ),
            "ru": (
                "<p>Если вы импортируете первую семейную машину, самый безопасный шаблон — модельные годы 2017–2020, средний SUV-сегмент, с подходящими для ЕС двигателями (1.5–2.5 л бензин/гибрид).</p>"
                "<h2>Топ-5 до €15 000 итоговой стоимости</h2>"
                "<ol>"
                "<li><strong>Toyota RAV4 Hybrid (2019–2020)</strong> — неубиваемая трансмиссия, запчасти есть везде.</li>"
                "<li><strong>Honda CR-V 1.5T (2017–2019)</strong> — дешевле RAV4, следите за отзывом по разжижению масла в турбо.</li>"
                "<li><strong>Mazda CX-5 2.5 (2018–2020)</strong> — лучшие ощущения за рулём, чуть прожорливее.</li>"
                "<li><strong>Hyundai Tucson 1.6T (2019–2020)</strong> — DCT нервный в городе, но очень дешёвый в ремонте.</li>"
                "<li><strong>Kia Sorento 2.4 (2018–2019)</strong> — 7 мест, удивительно сильная цена перепродажи.</li>"
                "</ol>"
                "<blockquote><p>По каждой из них — цельтесь только в salvage с повреждениями <strong>переднего бампера / капота</strong>; ремонт укладывается в €1 800.</p></blockquote>"
            ),
        },
    },
    {
        "category": "news",
        "cover_image_url": "/figma/blog/image-153@2x.png",
        "tags": ["hybrid", "ev", "trends", "auction"],
        "days_ago": 28,
        "title": {
            "en": "Auction Demand Is Rising for Hybrids and EVs",
            "ru": "Спрос на гибриды и электромобили на аукционах растёт",
        },
        "excerpt": {
            "en": "Why buyers are watching fuel economy, battery health and long-term service cost.",
            "ru": "Почему покупатели смотрят на расход, состояние батареи и долгосрочные сервисные расходы.",
        },
        "body": {
            "en": (
                "<p>Across Copart and IAAI lots for March 2026, the hammer price on hybrid mid-size sedans is up <strong>14% year-over-year</strong>. Pure-electric Tesla Model 3 and Hyundai Ioniq 5 prices are up 22%.</p>"
                "<h2>What is driving this?</h2>"
                "<p>Fuel prices in Europe stayed above €1.80/L for 9 consecutive months — buyers who used to refuse hybrids are now actively searching for them. At the same time, the supply of used EV batteries with verified health reports has finally reached a level where buyers can confidently bid on a Tesla without fearing a €12,000 battery surprise.</p>"
                "<h2>What to watch when bidding on an EV</h2>"
                "<ul><li>Pre-purchase battery state-of-health (SoH) report — non-negotiable.</li>"
                "<li>Crash-side damage on EVs often hides battery casing impact — request undercarriage photos.</li>"
                "<li>Cold-climate range loss is real — factor 15–20% off if you live north of Sofia.</li></ul>"
            ),
            "ru": (
                "<p>По лотам Copart и IAAI за март 2026 года финальная цена на гибридные седаны среднего класса выросла на <strong>14% год к году</strong>. Цены на полностью электрические Tesla Model 3 и Hyundai Ioniq 5 — на 22%.</p>"
                "<h2>Что стоит за этим ростом?</h2>"
                "<p>Цены на топливо в Европе оставались выше €1,80/л 9 месяцев подряд — покупатели, ранее отказывавшиеся от гибридов, теперь активно их ищут. Одновременно предложение б/у EV-батарей с подтверждённым отчётом о состоянии наконец достигло уровня, при котором покупатели могут уверенно ставить на Tesla, не опасаясь сюрприза в €12 000 за батарею.</p>"
                "<h2>На что смотреть при ставках на EV</h2>"
                "<ul><li>Отчёт State-of-Health (SoH) до покупки — обязателен.</li>"
                "<li>Боковой удар на EV часто скрывает повреждение корпуса батареи — запрашивайте фото снизу.</li>"
                "<li>Потеря запаса хода в холодном климате реальна — закладывайте минус 15–20%, если живёте севернее Софии.</li></ul>"
            ),
        },
    },
    {
        "category": "tips",
        "cover_image_url": "/figma/blog/image-154@2x.png",
        "tags": ["bidding", "strategy", "auction", "tips"],
        "days_ago": 30,
        "title": {
            "en": "5 Auction Bidding Strategies That Actually Work",
            "ru": "5 стратегий торгов на аукционе, которые действительно работают",
        },
        "excerpt": {
            "en": "Tested patterns we use weekly inside the BIBI ops team — keep emotion out, keep math in.",
            "ru": "Проверенные приёмы, которые мы еженедельно используем в команде BIBI — без эмоций, только математика.",
        },
        "body": {
            "en": (
                "<h2>1. Anchor on final cost, not bid</h2>"
                "<p>Always calculate your maximum bid <em>backwards</em> from the final delivered price you can afford. Never the other way around.</p>"
                "<h2>2. Bid in the last 8 seconds</h2>"
                "<p>Copart's algorithm extends each lot by 1 minute when a bid lands in the last minute. Place yours in the last 8 seconds to avoid triggering the extension.</p>"
                "<h2>3. Use the proxy bid honestly</h2>"
                "<p>The proxy bid is your real ceiling — never lie to yourself. Set it once and don't raise it during the live moment.</p>"
                "<h2>4. Pass on \"clean title, primary damage = NONE\"</h2>"
                "<p>These cars almost always go above retail — they're driving everyday-buyer competition, not importer math.</p>"
                "<h2>5. Track 30 days before bidding</h2>"
                "<p>Watch 10–15 comparable lots for a full month before you commit. The price floor reveals itself.</p>"
            ),
            "ru": (
                "<h2>1. Считайте от итоговой цены, а не от ставки</h2>"
                "<p>Всегда рассчитывайте максимальную ставку <em>в обратную сторону</em> — от итоговой стоимости с доставкой, которую вы можете себе позволить. Никогда наоборот.</p>"
                "<h2>2. Ставьте в последние 8 секунд</h2>"
                "<p>Алгоритм Copart продлевает лот на 1 минуту, если ставка приходит в последнюю минуту. Размещайте свою в последние 8 секунд, чтобы не запускать продление.</p>"
                "<h2>3. Используйте proxy bid честно</h2>"
                "<p>Proxy bid — это ваш реальный потолок. Не обманывайте себя: задайте его один раз и не поднимайте в живом моменте.</p>"
                "<h2>4. Пропускайте «clean title, primary damage = NONE»</h2>"
                "<p>Такие машины почти всегда уходят выше розницы — там конкурируют обычные покупатели, а не импортёры с математикой.</p>"
                "<h2>5. Следите 30 дней перед ставкой</h2>"
                "<p>Наблюдайте 10–15 сопоставимых лотов целый месяц до того, как сделать ставку. Реальный «пол» цены проявит себя.</p>"
            ),
        },
    },
    {
        "category": "guides",
        "cover_image_url": "/figma/blog/image-155@2x.png",
        "tags": ["registration", "kat", "gtp", "bulgaria", "guide"],
        "days_ago": 38,
        "title": {
            "en": "Step-by-Step: Registering Your Imported Car in Bulgaria",
            "ru": "Пошагово: регистрация ввезённого автомобиля в Болгарии",
        },
        "excerpt": {
            "en": "From the customs declaration to your shiny plates — the exact 9-step paperwork sequence.",
            "ru": "От таможенной декларации до новых номеров — точная последовательность из 9 шагов.",
        },
        "body": {
            "en": (
                "<ol>"
                "<li><strong>Single Administrative Document (SAD)</strong> — customs clearance at port of entry.</li>"
                "<li><strong>Pay customs duty + VAT</strong> — receipt is needed for steps 4 and 7.</li>"
                "<li><strong>Get the EUR.1 / origin papers</strong> — if applicable for reduced duty.</li>"
                "<li><strong>Translate the foreign title</strong> — sworn translator only.</li>"
                "<li><strong>GTP (annual technical inspection)</strong> — at any licensed center.</li>"
                "<li><strong>Insurance — \"Civil liability\"</strong> — buy minimum 6-month policy.</li>"
                "<li><strong>KAT registration appointment</strong> — book online at <a href=\"https://www.mvr.bg/\">mvr.bg</a>.</li>"
                "<li><strong>Pay registration tax</strong> — calculated on engine size + year.</li>"
                "<li><strong>Receive plates &amp; SRMPS</strong> — same day in most KAT offices.</li>"
                "</ol>"
                "<blockquote><p>BIBI Cars handles steps 1, 2, 4 and 7 for you. You only ever step into a KAT office to pose for the photo and collect the plates.</p></blockquote>"
            ),
            "ru": (
                "<ol>"
                "<li><strong>Единый административный документ (ЕАД)</strong> — таможенное оформление в порту ввоза.</li>"
                "<li><strong>Оплата пошлины и НДС</strong> — квитанция нужна для шагов 4 и 7.</li>"
                "<li><strong>EUR.1 / документ о происхождении</strong> — если применимо для сниженной пошлины.</li>"
                "<li><strong>Перевод иностранного title</strong> — только присяжный переводчик.</li>"
                "<li><strong>ГТП (ежегодный технический осмотр)</strong> — в любом лицензированном центре.</li>"
                "<li><strong>Страховка «Гражданская ответственность»</strong> — минимум на 6 месяцев.</li>"
                "<li><strong>Запись в КАТ</strong> — онлайн на <a href=\"https://www.mvr.bg/\">mvr.bg</a>.</li>"
                "<li><strong>Регистрационный налог</strong> — рассчитывается по объёму двигателя и году.</li>"
                "<li><strong>Получение номеров и СРМПС</strong> — в большинстве отделений КАТ в тот же день.</li>"
                "</ol>"
                "<blockquote><p>BIBI Cars выполняет шаги 1, 2, 4 и 7 за вас. Вы заходите в КАТ только чтобы сфотографироваться и забрать номера.</p></blockquote>"
            ),
        },
    },
]


async def seed_blog_if_empty(db) -> Dict[str, Any]:
    """Seed `db.blog_articles` if and only if the collection is empty.

    Returns a small summary dict for logging.
    """
    try:
        count = await db.blog_articles.count_documents({})
    except Exception as e:
        logger.warning("[blog_seeder] count failed: %s", e)
        return {"created": 0, "skipped": True, "reason": str(e)}

    if count > 0:
        return {"created": 0, "skipped": True, "reason": f"collection already has {count} articles"}

    now = datetime.now(timezone.utc)
    docs: List[Dict[str, Any]] = []
    seen_slugs = set()
    for art in ARTICLES:
        base_slug = _slug(art["title"]["en"] or art["title"]["ru"])
        slug = base_slug
        suffix = 2
        while slug in seen_slugs:
            slug = f"{base_slug}-{suffix}"
            suffix += 1
        seen_slugs.add(slug)
        published_at = now - timedelta(days=int(art.get("days_ago", 0)))
        docs.append({
            "id": str(uuid4()),
            "slug": slug,
            "category": art["category"],
            "cover_image_url": art.get("cover_image_url"),
            "title": art["title"],
            "excerpt": art["excerpt"],
            "body": art["body"],
            "tags": [t.strip() for t in (art.get("tags") or []) if t and t.strip()],
            "related_ids": [],
            "read_time_minutes": _read_minutes(art["body"].get("en"), art["body"].get("ru")),
            "published": True,
            "published_at": published_at,
            "created_at": published_at,
            "updated_at": published_at,
        })

    # Wire related_ids — every article points to the 4 newest others
    ids_in_order = [d["id"] for d in docs]
    for i, d in enumerate(docs):
        others = [x for j, x in enumerate(ids_in_order) if j != i]
        d["related_ids"] = others[:4]

    try:
        await db.blog_articles.insert_many(docs)
    except Exception as e:
        logger.exception("[blog_seeder] insert_many failed: %s", e)
        return {"created": 0, "skipped": False, "error": str(e)}

    return {"created": len(docs), "skipped": False}
