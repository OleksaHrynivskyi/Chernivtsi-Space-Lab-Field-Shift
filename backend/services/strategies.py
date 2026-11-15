"""Модель: робимо 3 альтернативи до поточної сівозміни, ставимо бали 0–100 і пишемо пояснення.

Сівозміна = список років, у кожному році культури, які цього року ЗБИРАЮТЬ
(покривні - які закінчують). Наприклад [["corn"], ["soybean"]] це кукурудза -> соя.

Вода і придатність культур - з FAO GAEZ, ціни - USDA NASS, клімат - NASA POWER, ґрунт - SSURGO.
Все, що в crops.json під "estimated", це наші оцінки.
"""
import json
from pathlib import Path
from statistics import mean

from services import texts

CROPS = json.loads((Path(__file__).resolve().parent.parent / "data" / "crops.json").read_text(encoding="utf-8"))
CROPS.pop("_sources")

SUMMER_CROPS = ["sorghum", "sunflower", "soybean", "corn", "cotton"]  # літні культури, які можна замінити одна одною
COVER_CROP_INCOME_PENALTY = 10  # насіння і сівба покривної (наша оцінка)
NO_DATA = (600, 0)  # якщо GAEZ не відповів: (потреба, дефіцит) у мм


def attr(crop_id: str, key: str):
    """Характеристика культури з crops.json (звичайна або з estimated)."""
    crop = CROPS[crop_id]
    return crop[key] if key in crop else crop["estimated"][key]


def name(crop_id: str, lang: str = "en") -> str:
    return CROPS[crop_id]["name_uk" if lang == "uk" else "name"]


# ---------- Вода (FAO GAEZ) ----------

def water(crop_id: str, field, period: str = "now") -> tuple[float, float]:
    """Повертає (потреба у воді, дефіцит без зрошення) в мм. now = 2011–2040, future = 2041–2070."""
    if CROPS[crop_id]["kind"] == "cover":
        return attr(crop_id, "cover_water_mm"), 0  # покривну прибирають навесні, тому не повний сезон
    info = ((field.get("gaez") or {}).get("crops") or {}).get(crop_id)
    if info and info.get(period):
        return info[period]["need_mm"], info[period]["deficit_mm"]
    return NO_DATA


def suitable(crop_id: str, field) -> bool:
    """Чи росте тут культура за GAEZ. Якщо даних нема, вважаємо, що росте."""
    info = ((field.get("gaez") or {}).get("crops") or {}).get(crop_id)
    return info["suitable"] if info else True


def scenario_deficit(deficit: float, climate, scenario: str) -> float:
    """GAEZ дає дефіцит для середнього року. У сухий додаємо різницю в опадах (POWER)."""
    if scenario == "dry":
        return deficit + (climate["season_rain_mm"] - climate["dry_year_rain_mm"])
    if scenario == "wet":
        return max(0, deficit - (climate["wet_year_rain_mm"] - climate["season_rain_mm"]))
    return deficit


# ---------- Календар і покриття поля ----------

def _month(mm_dd: str) -> float:
    """'05-15' -> 5.45, місяць з дробом для календаря."""
    month, day = mm_dd.split("-")
    return int(month) + (int(day) - 1) / 31


def calendar(years: list[list[str]], lang: str = "en") -> list[dict]:
    """Смуги для календаря: яка культура в які місяці на полі."""
    bars = []
    n = len(years)
    for index, crops in enumerate(years):
        for crop_id in crops:
            crop = CROPS[crop_id]
            info = {"crop": crop_id, "name": name(crop_id, lang), "kind": crop["kind"]}
            start, end = _month(crop["plant"]), _month(crop["harvest"]) + 1 / 31
            if start < end:  # сіють і збирають в одному році
                bars.append({"year": index + 1, **info, "start": start, "end": end})
            else:  # озима чи покривна: посіяли восени минулого року
                previous = (index - 1) % n + 1
                bars.append({"year": previous, **info, "start": start, "end": 13})
                bars.append({"year": index + 1, **info, "start": 1, "end": end})
    return bars


def covered_share(years: list[list[str]]) -> float:
    """Частка місяців, коли на полі щось росте (0..1). Місяць рахуємо, якщо культура стоїть хоча б пів місяця."""
    bars = calendar(years)
    covered = 0
    for year in range(1, len(years) + 1):
        for month in range(1, 13):
            overlap = sum(max(0, min(b["end"], month + 1) - max(b["start"], month)) for b in bars if b["year"] == year)
            if overlap >= 0.5:
                covered += 1
    return covered / (12 * len(years))


# ---------- Генерація стратегій ----------

def _mains(years):
    return [c for crops in years for c in crops if CROPS[c]["kind"] == "main"]


def _has_winter_crop(crops):
    return any(_month(CROPS[c]["plant"]) > _month(CROPS[c]["harvest"]) for c in crops)


def label(years, lang: str = "en") -> str:
    """Назва сівозміни, типу "Corn → Soybean + cereal rye cover"."""
    parts = []
    for crops in years:
        mains = [name(c, lang) for c in crops if CROPS[c]["kind"] == "main"]
        parts.append(" + ".join(mains))
    text = " → ".join(parts)
    covers = sorted({name(c, lang).split(" (")[0].lower() for crops in years for c in crops if CROPS[c]["kind"] == "cover"})
    if not covers:
        return text
    return text + (f" + покривна: {', '.join(covers)}" if lang == "uk" else f" + {', '.join(covers)} cover")


def add_cover_crop(years):
    """A: в роки без озимої культури додаємо озиме жито як покривну."""
    return [crops if _has_winter_crop(crops) else ["cereal_rye"] + crops for crops in years]


# що пробуємо додати у варіанті B, по черзі
SMALL_GRAIN_OR_LEGUME = ("winter_wheat", "soybean", "oats", "barley", "spring_wheat", "dry_beans")


def add_small_grain_and_legume(years, field):
    """B: додаємо рік із зерновою чи бобовою, якої ще нема і яка тут росте (GAEZ).
    Якщо всі вже є, то додаємо покривну конюшину, щоб не повторювати культуру двічі."""
    present = set(_mains(years))
    options = [c for c in SMALL_GRAIN_OR_LEGUME if c not in present and suitable(c, field)]
    result = [list(crops) for crops in years]
    if not options:
        if not _has_winter_crop(result[0]):
            result[0] = ["clover"] + result[0]
        return result
    new_crop = options[0]
    result.append([new_crop])
    if new_crop == "winter_wheat" and not _has_winter_crop(result[0]):
        result[0] = ["clover"] + result[0]  # після пшениці поле пусте до весни, тому конюшина
    return result


def lower_water(years, field, livestock):
    """C: якщо є худоба, додаємо люцерну. Інакше міняємо літню культуру, якій найбільше
    бракує води, на ту, якій бракує найменше (GAEZ)."""
    if livestock:
        return [list(crops) for crops in years] + [["alfalfa"], ["alfalfa"]]
    mains = _mains(years)
    summer = [c for c in mains if c in SUMMER_CROPS] or mains
    thirsty = max(summer, key=lambda c: water(c, field)[1])
    options = [c for c in SUMMER_CROPS if c not in mains and suitable(c, field)
               and water(c, field)[1] < water(thirsty, field)[1]]
    if options:
        swap = min(options, key=lambda c: water(c, field)[1])
        if len(years) == 1:  # якщо культура одна, то чергуємо її з новою
            return [[swap], list(years[0])]
        # міняємо тільки в одному році, щоб нова культура не йшла два роки поспіль
        first = next(i for i, crops in enumerate(years) if thirsty in crops)
        return [[swap if c == thirsty and i == first else c for c in crops] for i, crops in enumerate(years)]
    extra = min((c for c in SUMMER_CROPS if c not in mains and suitable(c, field)),
                key=lambda c: water(c, field)[1], default="sunflower")
    return [list(crops) for crops in years] + [[extra]]


def add_other_crop(years, field, taken):
    """Запасний варіант: додаємо рік з будь-якою культурою, яка тут росте і ще не використана."""
    present = set(_mains(years))
    for crop in SMALL_GRAIN_OR_LEGUME + tuple(SUMMER_CROPS):
        candidate = [list(crops) for crops in years] + [[crop]]
        if crop not in present and suitable(crop, field) and candidate not in taken:
            return candidate
    return None


# ---------- Бали ----------

def season_rain(climate, scenario):
    return {"dry": climate["dry_year_rain_mm"], "wet": climate["wet_year_rain_mm"]}.get(scenario, climate["season_rain_mm"])


def score(years, field, scenario, constraints) -> dict:
    climate, soil = field["climate"], field.get("soil") or {}
    cover = covered_share(years)
    mains = _mains(years)
    cover_years = sum(1 for crops in years if any(CROPS[c]["kind"] == "cover" for c in crops)) / len(years)

    # вода 1: скільки води треба сівозміні за рік (GAEZ). 400 мм = 100 балів, 1200 мм = 0
    yearly_need = mean(sum(water(c, field)[0] for c in crops) for crops in years)
    water_score = 100 - (yearly_need - 400) / 8
    # вода 2: скільки бракує без зрошення
    deficit = mean(scenario_deficit(water(c, field)[1], climate, scenario) for c in mains)
    if not constraints.get("irrigation"):
        water_score -= deficit / 8  # 400 мм дефіциту це -50 балів

    # здоров'я ґрунту: рештки + бобові (азот) + скільки поле вкрите
    legume_years = sum(1 for crops in years if any(CROPS[c]["n_fixing"] for c in crops)) / len(years)
    residue = mean(attr(c, "residue") for c in mains)
    soil_health = residue * 8 + legume_years * 30 + cover * 30

    # ерозія: чим довше поле вкрите, тим краще. На схилі і при зливах ризик більший
    k_factor = soil.get("k_factor") or 0.3  # 0.3 це звичайний ґрунт, більше - легше змивається
    risk = 1 + (soil.get("slope_pct") or 0) / 10 + climate["heavy_rain_days_25mm"] / 20 + (k_factor - 0.3)
    erosion = 100 - (1 - cover) * 60 * risk

    # шкідники: рахуємо, скільки різних родин культур
    families = len({CROPS[c]["family"] for crops in years for c in crops})
    pest_break = {1: 20, 2: 60, 3: 80}.get(families, 95)

    # дохід: ціни NASS ($1000 з акра = 100 балів), а якщо їх нема, то наша оцінка.
    # мінус витрати на покривні і на техніку для зернових
    revenue = (field.get("revenue") or {}).get("revenue_per_acre", {})
    income = mean(revenue[c] / 10 if c in revenue else attr(c, "income") * 20 for c in mains)
    income -= cover_years * COVER_CROP_INCOME_PENALTY
    if not constraints.get("small_grain_equipment") and any(CROPS[c]["small_grain"] for c in mains):
        income -= 10  # техніку доведеться орендувати

    # стійкість до погоди: вода (яка частка потреби бракує, GAEZ) і спека (оцінка).
    # якщо бракує половини і більше, це 0 балів. У сухий рік вода важить удвічі більше
    security = mean(100 * (1 - min(1, scenario_deficit(water(c, field)[1], climate, scenario) / water(c, field)[0] * 2))
                    for c in mains)
    heat = mean(attr(c, "heat_tolerance") for c in mains) * 20
    climate_risk = (heat + 2 * security) / 3 if scenario == "dry" else (heat + security) / 2

    scores = {"water": water_score, "soil_health": soil_health, "erosion": erosion,
              "pest_break": pest_break, "income": income, "climate_risk": climate_risk}
    return {k: round(max(0, min(100, v))) for k, v in scores.items()}


def total(scores, priorities) -> int:
    weights = {"water": priorities.get("water", 3), "soil_health": priorities.get("soil", 3),
               "erosion": priorities.get("erosion", 3), "income": priorities.get("income", 3),
               "pest_break": 3, "climate_risk": 3}
    return round(sum(scores[k] * w for k, w in weights.items()) / sum(weights.values()))


# ---------- Пояснення ----------

def _evidence(field, current_years, lang, units):
    """Докази про саме поле, однакові для всіх варіантів."""
    t = texts.get(lang)
    amt = lambda mm: texts.amount(mm, lang, units)
    e, conf = t["evidence"], t["confidence"]
    climate, soil, sat = field["climate"], field.get("soil") or {}, field.get("satellite")
    items = [
        {"text": e["bare"].format(months=round((1 - covered_share(current_years)) * 12)),
         "source": t["sources"]["cdl"], "confidence": conf["model"]},
        {"text": e["heavy_rain"].format(days=climate["heavy_rain_days_25mm"], heavy=amt(25)), "source": "NASA POWER", "confidence": conf["model"]},
        {"text": e["dry_years"].format(year=climate["year_types"]["dry"][0], dry=amt(climate["dry_year_rain_mm"]),
                                       typical=amt(climate["season_rain_mm"])), "source": "NASA POWER", "confidence": conf["model"]},
    ]
    if soil:
        items.append({"text": e["soil"].format(soil=soil["name"], om=soil["organic_matter_pct"], slope=soil["slope_pct"]),
                      "source": "USDA SSURGO", "confidence": conf["measured"]})
    revenue = (field.get("revenue") or {}).get("revenue_per_acre", {})
    known = [c for c in dict.fromkeys(_mains(current_years)) if c in revenue]
    if known:
        crops = ", ".join(f"{name(c, lang).lower()} ${revenue[c]}" for c in known)
        items.append({"text": e["income"].format(state=field["revenue"]["state"], crops=crops),
                      "source": "USDA NASS", "confidence": conf["measured"]})
    if sat and sat.get("smap_season_soil"):
        driest = min(sat["smap_season_soil"], key=lambda r: r["value"])
        items.append({"text": e["smap"].format(year=driest["year"], value=driest["value"]),
                      "source": "NASA SMAP", "confidence": conf["measured"]})
    vegetation = field.get("ndvi")
    if vegetation:
        items.append({"text": _ndvi_text(vegetation, climate, e, amt, lang), "source": "NASA MODIS NDVI", "confidence": conf["measured"]})
    return items


def crop_label(crop_id, lang="en"):
    """Назва культури; для подвійного посіву буде "Озима пшениця + соя"."""
    names = [name(c, lang) for c in crop_id.split("+") if c in CROPS]
    return " + ".join([names[0]] + [n.lower() for n in names[1:]]) if names else crop_id


def _ndvi_text(vegetation, climate, e, amt, lang):
    """Текст про найслабший рік за NDVI. Якщо порівнювати нема з чим, то просто середній пік."""
    weak = vegetation.get("weakest")
    if not weak:
        avg = round(sum(y["peak"] for y in vegetation["years"]) / len(vegetation["years"]), 2)
        return e["ndvi_avg"].format(avg=avg)
    crop = crop_label(weak["crop"], lang).lower()
    text = e["ndvi_weak"].format(year=weak["year"], crop=crop, peak=f"{weak['peak']:.2f}", drop=weak["drop_pct"], normal=f"{weak['normal']:.2f}")
    if weak.get("rain_mm"):
        text += e["ndvi_rain"].format(rain=amt(weak["rain_mm"]), typical=amt(climate["season_rain_mm"]))
    return text


def _water_evidence(years, field, lang, units):
    """Докази про воду для конкретного варіанту (GAEZ, зараз і в майбутньому)."""
    if not field.get("gaez"):
        return []
    t = texts.get(lang)
    mains = list(dict.fromkeys(_mains(years)))
    thirsty = max(mains, key=lambda c: water(c, field)[1])
    need, deficit = water(thirsty, field)
    need_future, deficit_future = water(thirsty, field, "future")
    crop = name(thirsty, lang)
    amt = lambda mm: texts.amount(mm, lang, units)
    return [
        {"text": t["evidence"]["water_now"].format(crop=crop, need=amt(need), deficit=amt(deficit)),
         "source": t["sources"]["gaez"], "confidence": t["confidence"]["model"]},
        {"text": t["evidence"]["water_future"].format(crop_lower=crop.lower(), need=amt(need_future), deficit=amt(deficit_future)),
         "source": t["sources"]["gaez_future"], "confidence": t["confidence"]["model"]},
    ]


def _drought_why(years, current_years, field, lang, units):
    """Пояснення для варіанту C: що прибрали, що додали і скільки їм бракує води."""
    templates = texts.get(lang)["drought_why"]
    dry_year = field["climate"]["year_types"]["dry"][0]
    removed = [c for c in dict.fromkeys(_mains(current_years)) if c not in _mains(years)]
    added = [c for c in dict.fromkeys(_mains(years)) if c not in _mains(current_years)]
    if not added:
        return templates["generic"].format(dry_year=dry_year)
    new = added[0]
    # з чим порівнюємо: з культурою, яку прибрали, або з тією, якій зараз найбільше бракує води
    old = removed[0] if removed else max(_mains(current_years), key=lambda c: water(c, field)[1])
    values = {"new": name(new, lang), "new_lower": name(new, lang).lower(), "old_lower": name(old, lang).lower(),
              "new_deficit": texts.amount(water(new, field)[1], lang, units),
              "old_deficit": texts.amount(water(old, field)[1], lang, units), "dry_year": dry_year}
    if not removed and len(set(_mains(current_years))) == 1:
        return templates["mono"].format(**values)
    if water(new, field)[1] < water(old, field)[1]:
        return templates["swap"].format(**values)
    return templates["extra"].format(**values)


def _saves_water(years, current_years, field) -> bool:
    """Чи новій сівозміні в середньому бракує менше води, ніж поточній."""
    deficit = lambda rotation: mean(water(c, field)[1] for c in _mains(rotation))
    return deficit(years) < deficit(current_years)


def explain(kind, years, current_years, field, lang="en", units="metric") -> dict:
    values = {
        "bare_now": round((1 - covered_share(current_years)) * 12),
        "bare_new": round((1 - covered_share(years)) * 12),
        "alfalfa_need": texts.amount(water("alfalfa", field)[0], lang, units),
        "drought_why": _drought_why(years, current_years, field, lang, units) if kind == "drought" else "",
    }
    template = texts.get(lang)["kinds"][kind]
    result = {"why": template["why"].format(**values)}
    for key in ("benefits", "gaps", "check_locally"):
        result[key] = [line.format(**values) for line in template[key]]
    # варіант C не завжди економить воду (буває, що менш вологолюбної культури тут нема), тоді про воду не обіцяємо
    if kind == "drought" and not _saves_water(years, current_years, field):
        result["benefits"] = list(template["benefits_no_water"])
    # про азот від конюшини пишемо, тільки якщо вона є в сівозміні
    if "clover" in template and any("clover" in crops for crops in years):
        result["benefits"].append(template["clover"])
    result["evidence"] = _water_evidence(years, field, lang, units) + _evidence(field, current_years, lang, units)
    return result


# ---------- Головна функція ----------

def build_strategies(field, priorities, constraints, scenario="normal", lang="en", units="metric") -> list[dict]:
    # "winter_wheat+soybean" (два врожаї за рік) -> ["winter_wheat", "soybean"]
    current = [[c for c in year.split("+") if c in CROPS] for year in field["current_rotation"]["pattern"]]
    current = [year for year in current if year]
    if not current:  # main.py сюди такі поля не пускає, але про всяк випадок
        raise ValueError("No known crops in the current rotation")
    options = [
        ("current", "Current", current),
        ("cover", "A", add_cover_crop(current)),
        ("diverse", "B", add_small_grain_and_legume(current, field)),
        ("forage" if constraints.get("livestock") else "drought", "C", lower_water(current, field, constraints.get("livestock"))),
    ]
    result, taken = [], []
    for kind, letter, years in options:
        # буває, що варіант вийшов таким самим, як поточна сівозміна чи інший варіант
        # (наприклад, до озимої пшениці озиме жито не додаси). Тоді пробуємо додати іншу культуру
        if years in taken:
            kind, years = "diverse", add_other_crop(current, field, taken)
            if years is None:
                continue
        taken.append(years)
        scores = score(years, field, scenario, constraints)
        result.append({
            "id": letter,
            "is_current": kind == "current",
            "name": label(years, lang),
            "years": years,
            "total_score": total(scores, priorities),
            "scores": scores,
            "bare_months_per_year": round((1 - covered_share(years)) * 12),
            "calendar": calendar(years, lang),
            "explanation": explain(kind, years, current, field, lang, units),
        })
    best = max(result, key=lambda s: s["total_score"])
    for strategy in result:
        strategy["best_match"] = strategy is best
    return result
