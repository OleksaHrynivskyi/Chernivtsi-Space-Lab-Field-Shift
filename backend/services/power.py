"""NASA POWER: щоденна погода для точки і все, що ми з неї рахуємо. Ключ не треба.

API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
"""
from datetime import date
from statistics import mean, median

import requests

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = ["T2M_MAX", "T2M_MIN", "T2M", "PRECTOTCORR"]
START_YEAR = 2001  # з 2001, бо з цього року є супутникові опади IMERG
END_YEAR = 2025
MISSING = -999


def fetch_daily(lat: float, lon: float) -> dict:
    """Качає щоденні дані за всі роки. Формат: {параметр: {"YYYYMMDD": значення}}."""
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "latitude": lat,
        "longitude": lon,
        "start": f"{START_YEAR}0101",
        "end": f"{END_YEAR}1231",
        "format": "JSON",
    }
    response = requests.get(POWER_URL, params=params, timeout=120)
    response.raise_for_status()
    return response.json()["properties"]["parameter"]


def _to_days(raw: dict) -> list[dict]:
    """Робить з відповіді POWER список днів."""
    days = []
    for key in raw["T2M"]:
        day = {
            "date": date(int(key[:4]), int(key[4:6]), int(key[6:])),
            "tmax": raw["T2M_MAX"][key],
            "tmin": raw["T2M_MIN"][key],
            "tavg": raw["T2M"][key],
            "rain": raw["PRECTOTCORR"][key],
        }
        if MISSING not in day.values():
            days.append(day)
    if not days:
        raise ValueError("NASA POWER has no data for this point")
    return days


def _trend_per_decade(years: list[int], values: list[float]) -> float:
    """Тренд: на скільки значення змінюється за 10 років (лінійна регресія)."""
    x_mean, y_mean = mean(years), mean(values)
    top = sum((x - x_mean) * (y - y_mean) for x, y in zip(years, values))
    bottom = sum((x - x_mean) ** 2 for x in years)
    return round(top / bottom * 10, 2) if bottom else 0.0


def _year_stats(days: list[dict]) -> dict:
    """Показники за один рік."""
    spring = [d for d in days if d["date"].month < 7 and d["tmin"] <= 0]
    fall = [d for d in days if d["date"].month >= 7 and d["tmin"] <= 0]
    last_frost = spring[-1]["date"] if spring else None
    first_frost = fall[0]["date"] if fall else None
    season = [d for d in days if 5 <= d["date"].month <= 9]  # травень–вересень
    return {
        "last_frost_doy": last_frost.timetuple().tm_yday if last_frost else None,
        "first_frost_doy": first_frost.timetuple().tm_yday if first_frost else None,
        "frost_free_days": (first_frost - last_frost).days if last_frost and first_frost else None,
        # GDD: додаємо (середня температура - 10) за кожен день квітня–жовтня
        "gdd": sum(max(0, d["tavg"] - 10) for d in days if 4 <= d["date"].month <= 10),
        "season_rain": sum(d["rain"] for d in season),
        "heat_days": sum(1 for d in days if d["tmax"] > 35),
        "heavy_rain_days": sum(1 for d in days if d["rain"] > 25),
    }


def _doy_to_text(doy: float) -> str:
    """Номер дня в році -> 'Apr 28'."""
    day = date.fromordinal(date(2001, 1, 1).toordinal() + round(doy) - 1)
    return day.strftime("%b %d").replace(" 0", " ")


def climate_summary(raw: dict) -> dict:
    """З сирих даних POWER рахує все для сторінки «Статистика» і для моделі."""
    days = _to_days(raw)
    years = sorted({d["date"].year for d in days})
    per_year = {y: _year_stats([d for d in days if d["date"].year == y]) for y in years}

    def values(name):
        return [per_year[y][name] for y in years if per_year[y][name] is not None]

    last_frosts = values("last_frost_doy")
    may_5 = date(2001, 5, 5).timetuple().tm_yday
    late_frost_years = sum(1 for doy in last_frosts if doy > may_5)

    # типовий рік: середнє по місяцях
    monthly = []
    for month in range(1, 13):
        month_days = [d for d in days if d["date"].month == month]
        monthly.append({
            "month": month,
            "tavg": round(mean(d["tavg"] for d in month_days), 1),
            "rain_mm": round(sum(d["rain"] for d in month_days) / len(years)),
        })

    # сухі і вологі роки: по 20% з кожного краю
    by_rain = sorted(years, key=lambda y: per_year[y]["season_rain"])
    n = max(1, len(years) // 5)
    year_types = {"dry": by_rain[:n], "wet": by_rain[-n:]}

    # на півдні заморозків майже нема, тоді вважаємо, що сезон цілий рік
    frost_years = values("frost_free_days")
    if len(frost_years) >= len(years) / 2:
        frost_free = round(median(frost_years))
        last_frost, first_frost = _doy_to_text(median(last_frosts)), _doy_to_text(median(values("first_frost_doy")))
    else:
        frost_free, last_frost, first_frost = 365, None, None

    return {
        "source": f"NASA POWER {years[0]}-{years[-1]}",
        "years": len(years),
        "frost_free_days": frost_free,
        "last_spring_frost": last_frost,
        "first_fall_frost": first_frost,
        "late_frost_years_per_10": round(late_frost_years / len(years) * 10),
        "gdd_base10": round(median(values("gdd"))),
        "season_rain_mm": round(median(values("season_rain"))),
        "heat_days_35c": round(mean(values("heat_days")), 1),
        "heavy_rain_days_25mm": round(mean(values("heavy_rain_days")), 1),
        "monthly": monthly,
        "trends": {"season_rain_mm_per_decade": _trend_per_decade(years, values("season_rain"))},
        "series": {"season_rain": [{"year": y, "value": round(per_year[y]["season_rain"])} for y in years]},
        "year_types": year_types,
        "dry_year_rain_mm": round(mean(per_year[y]["season_rain"] for y in year_types["dry"])),
        "wet_year_rain_mm": round(mean(per_year[y]["season_rain"] for y in year_types["wet"])),
    }
