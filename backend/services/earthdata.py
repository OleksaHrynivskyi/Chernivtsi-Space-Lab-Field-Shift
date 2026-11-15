"""NASA Earthdata: супутникові дані для точки поля.

GPM IMERG - опади по місяцях (з 2001), SMAP L4 - вологість кореневої зони (з 2016).
Через OPeNDAP можна взяти одну клітинку, а не качати весь файл.

Потрібен EARTHDATA_TOKEN у .env (цей файл не комітимо!).
Перевірка: python -m services.earthdata
"""
import calendar
import time
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from statistics import mean

import requests
from dotenv import load_dotenv
from pyproj import Transformer

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

CMR_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
# старий сервер gpm1.gesdisc у нас не відповідав, тому беремо з хмарного OPeNDAP
IMERG_COLLECTION = "C2723754851-GES_DISC"  # GPM_3IMERGM v07, місячні
IMERG_URL = ("https://opendap.earthdata.nasa.gov/collections/" + IMERG_COLLECTION + "/granules/"
             "GPM_3IMERGM.07:3B-MO.MS.MRG.3IMERG.{year}{month:02d}01-S000000-E235959.{month:02d}.V07B.HDF5.dap.csv")
SMAP_COLLECTION = "C3480440870-NSIDC_CPRD"  # SPL4SMGP v008
SMAP_URL = "https://opendap.earthdata.nasa.gov/collections/" + SMAP_COLLECTION + "/granules/{granule}.dap.csv"

SEASON = range(5, 10)  # травень–вересень
WORKERS = 4  # якщо більше, NASA віддає 503
IMERG_YEARS = range(2001, 2026)
SMAP_YEARS = range(2016, 2026)

# сітка SMAP: EASE-Grid 2.0, 9 км
_to_ease = Transformer.from_crs("EPSG:4326", "EPSG:6933", always_xy=True)
EASE_CELL = 9008.055210146
EASE_X_MIN, EASE_Y_MAX = -17367530.44516138, 7314540.83086444


def token() -> str:
    value = os.getenv("EARTHDATA_TOKEN")
    if not value:
        raise RuntimeError("EARTHDATA_TOKEN not found. Put it into the .env file in the project root.")
    return value


def _get(url: str, **kwargs) -> str:
    """GET з токеном. На 429/5xx чекаємо і пробуємо ще."""
    for attempt in range(5):
        response = requests.get(url, headers={"Authorization": f"Bearer {token()}"}, timeout=120, **kwargs)
        if response.status_code not in (429, 500, 502, 503, 504):
            break
        time.sleep(2 ** attempt)
    response.raise_for_status()
    return response.text


# ---------- GPM IMERG ----------

def imerg_month(lat: float, lon: float, year: int, month: int) -> float:
    """Опади за місяць, мм. IMERG дає мм/год, тому множимо на години в місяці."""
    lon_index = int((lon + 180) / 0.1)
    lat_index = int((lat + 90) / 0.1)
    # одну клітинку сервіс у CSV не віддає, тому просимо 2x2 і беремо першу
    query = f"/Grid/precipitation[0][{lon_index}:{lon_index + 1}][{lat_index}:{lat_index + 1}]"
    text = _get(IMERG_URL.format(year=year, month=month), params={"dap4.ce": query})
    first_row = [line for line in text.splitlines() if line.startswith("/Grid/precipitation[0][0]")][0]
    rate = float(first_row.split(",")[1])  # рядок такий: "/Grid/precipitation[0][0], 0.276, 0.265"
    hours = calendar.monthrange(year, month)[1] * 24
    return round(rate * hours, 1)


def imerg_seasons(lat: float, lon: float) -> list[dict]:
    """Опади за травень–вересень по роках."""
    jobs = [(year, month) for year in IMERG_YEARS for month in SEASON]
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        values = list(pool.map(lambda job: imerg_month(lat, lon, *job), jobs))
    by_year = {}
    for (year, _), value in zip(jobs, values):
        by_year[year] = by_year.get(year, 0) + value
    return [{"year": year, "value": round(total)} for year, total in by_year.items()]


# ---------- SMAP L4 ----------

def _smap_granule(day: str) -> str | None:
    """Назва файлу SMAP за день (знімок о 10:30 UTC)."""
    params = {"collection_concept_id": SMAP_COLLECTION, "page_size": 1,
              "temporal": f"{day}T10:00:00Z,{day}T11:59:59Z"}
    entries = requests.get(CMR_URL, params=params, timeout=60).json()["feed"]["entry"]
    return entries[0]["title"] if entries else None


def smap_value(lat: float, lon: float, day: str) -> float | None:
    """Вологість кореневої зони (м³/м³) на дату."""
    x, y = _to_ease.transform(lon, lat)
    row, col = int((EASE_Y_MAX - y) // EASE_CELL), int((x - EASE_X_MIN) // EASE_CELL)
    granule = _smap_granule(day)
    if not granule:
        return None
    # теж 2x2, як в IMERG
    query = f"/Geophysical_Data/sm_rootzone[{row}:{row + 1}][{col}:{col + 1}]"
    text = _get(SMAP_URL.format(granule=granule), params={"dap4.ce": query})
    first_row = [line for line in text.splitlines() if line.startswith("/Geophysical_Data/sm_rootzone[0]")][0]
    value = float(first_row.split(",")[1])
    return round(value, 3) if value >= 0 else None  # -9999 значить нема даних


def smap_seasons(lat: float, lon: float) -> list[dict]:
    """Середня вологість за травень–вересень по роках (2 знімки на місяць)."""
    days = [f"{year}-{month:02d}-{day:02d}" for year in SMAP_YEARS for month in SEASON for day in (5, 20)]
    with ThreadPoolExecutor(max_workers=WORKERS) as pool:
        values = list(pool.map(lambda d: smap_value(lat, lon, d), days))
    result = []
    for year in SMAP_YEARS:
        year_values = [v for d, v in zip(days, values) if d.startswith(str(year)) and v is not None]
        if year_values:
            result.append({"year": year, "value": round(mean(year_values), 3)})
    return result


def satellite_summary(lat: float, lon: float) -> dict:
    """IMERG і SMAP вантажимо окремо: якщо одне впало, друге все одно покажемо."""
    with ThreadPoolExecutor(max_workers=2) as pool:
        imerg_job = pool.submit(imerg_seasons, lat, lon)
        smap_job = pool.submit(smap_seasons, lat, lon)
    result = {"imerg_season_rain": [], "smap_season_soil": [], "errors": []}
    for key, job in (("imerg_season_rain", imerg_job), ("smap_season_soil", smap_job)):
        try:
            result[key] = job.result()
        except Exception as error:
            result["errors"].append(f"{key}: {error}")
    if not result["imerg_season_rain"] and not result["smap_season_soil"]:
        raise RuntimeError("; ".join(result["errors"]))
    result["sources"] = {
        "imerg": "NASA GPM IMERG V07 monthly, 0.1° (~10 km), via Earthdata Cloud OPeNDAP",
        "smap": "NASA SMAP L4 root-zone soil moisture v008, 9 km, via Earthdata Cloud OPeNDAP",
    }
    return result


def check_access() -> None:
    print("IMERG July 2024, Iowa demo field:", imerg_month(42.1, -93.55, 2024, 7), "mm")
    print("SMAP 2025-07-11, Iowa demo field:", smap_value(42.1, -93.55, "2025-07-11"), "m3/m3")


if __name__ == "__main__":
    check_access()
