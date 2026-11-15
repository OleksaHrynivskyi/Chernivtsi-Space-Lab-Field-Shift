"""NASA MODIS NDVI: наскільки зеленим було поле кожного сезону.

Продукт MOD13Q1 (супутник Terra, піксель 250 м, знімок раз на 16 днів).
Беремо через сервіс NASA ORNL DAAC, ключ не треба.

NDVI: 0 - голий ґрунт, 0.8 і більше - густа зелена культура.
Хмари занижують окремі знімки, тому за сезон беремо найбільше значення (пік).

Одну дату сервіс віддає за секунду, а діапазон дат дуже довго,
тому просимо кожну дату окремо (100 запитів, десь хвилина).
"""
import time
from concurrent.futures import ThreadPoolExecutor
from statistics import mean

import requests

URL = "https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset"
YEARS = range(2016, 2026)  # ті самі роки, що й CDL
# дні року, коли є знімки: з 23 квітня по 14 вересня
DAYS = [113, 129, 145, 161, 177, 193, 209, 225, 241, 257]
SCALE = 0.0001
MIN_VALID = -2000  # -3000 значить "нема даних"
WORKERS = 6
SOURCE = "NASA MODIS MOD13Q1 (Terra, 250 m, 16-day), ORNL DAAC"


def ndvi_on(lat: float, lon: float, year: int, day: int) -> float | None:
    """NDVI в точці на одну дату. 3 спроби, бо сервіс буває не відповідає."""
    date = f"A{year}{day:03d}"
    params = {"latitude": lat, "longitude": lon, "band": "250m_16_days_NDVI",
              "startDate": date, "endDate": date, "kmAboveBelow": 0, "kmLeftRight": 0}
    for attempt in range(3):
        try:
            response = requests.get(URL, params=params, headers={"Accept": "application/json"}, timeout=60)
            response.raise_for_status()
            subset = response.json().get("subset", [])
            if not subset or subset[0]["data"][0] < MIN_VALID:
                return None
            return round(subset[0]["data"][0] * SCALE, 3)
        except (requests.RequestException, ValueError):
            if attempt == 2:
                return None
            time.sleep(2 * (attempt + 1))


def season_peaks(lat: float, lon: float) -> dict:
    """Пік NDVI за кожен сезон. Якщо даних менше ніж за 6 років, кидаємо помилку."""
    jobs = [(year, day) for year in YEARS for day in DAYS]
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        values = list(pool.map(lambda job: ndvi_on(lat, lon, *job), jobs))

    years = []
    for year in YEARS:
        season = [v for (y, _), v in zip(jobs, values) if y == year and v is not None]
        years.append({"year": year, "peak": max(season) if season else None})
    if sum(1 for y in years if y["peak"] is not None) < 6:
        raise RuntimeError("NASA MODIS (ORNL DAAC) is not responding")
    return {"source": SOURCE, "years": years}


def with_crops(data: dict, history: list[dict], rain_by_year: dict) -> dict:
    """Додає до кожного року культуру (CDL) і опади (POWER) та шукає найслабший рік."""
    by_year = {h["year"]: h for h in history}
    years = [{**y, "crop": by_year.get(y["year"], {}).get("crop"), "category": by_year.get(y["year"], {}).get("category"),
              "rain_mm": rain_by_year.get(y["year"])}
             for y in data["years"] if y["peak"] is not None]

    weakest = None
    for y in years:
        # порівнюємо тільки з тією ж культурою, бо в сої і кукурудзи різний звичний NDVI
        same = [o["peak"] for o in years if o["crop"] == y["crop"] and o["year"] != y["year"]]
        if not y["crop"] or len(same) < 2:
            continue
        normal = mean(same)
        drop = round((normal - y["peak"]) / normal * 100)
        if weakest is None or drop > weakest["drop_pct"]:
            weakest = {"year": y["year"], "crop": y["crop"], "peak": y["peak"], "normal": round(normal, 2),
                       "drop_pct": drop, "rain_mm": y["rain_mm"]}
    if weakest and weakest["drop_pct"] < 5:  # менше 5% це вже просто шум
        weakest = None
    return {**data, "years": years, "weakest": weakest}


if __name__ == "__main__":
    start = time.time()
    print(season_peaks(37.95, -98.0), f"{round(time.time() - start)} s")
