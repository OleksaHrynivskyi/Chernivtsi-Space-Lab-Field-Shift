"""API для Field Shift.

Запуск з папки backend: uvicorn main:app --port 8000
Потикати ендпоінти можна тут: http://127.0.0.1:8000/docs
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from services import cache, cdl, earthdata, gaez, nass, ndvi, power, soil, strategies, texts

app = FastAPI(title="Field Shift API")

# щоб фронтенд з порту 5173 міг ходити на API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_crop_history(lat: float, lon: float, key: str) -> list[dict]:
    """Історія культур: з кешу або з CropScape. Неповну не кешуємо, щоб потім довантажити."""
    saved = cache.load(f"cdl_{key}")
    if saved:
        return saved
    history = cdl.fetch_history(lat, lon)
    if cdl.is_complete(history):
        cache.save(f"cdl_{key}", history)
    return history


def no_field_message(history: list[dict], cdl_failed: bool, lang: str) -> str:
    """Текст, чому в цій точці немає поля."""
    say = texts.get(lang)["no_field"]
    if cdl_failed:
        return say["maps_down"]
    land_types, other_crops = cdl.no_cropland_reason(history)
    if not land_types:
        return say["no_maps"]
    if land_types[0] == "other_crop" and other_crops:
        return say["other_crops"].format(crops=", ".join(other_crops))
    names = [say["land"][kind] for kind in land_types[:2]]  # беремо два найчастіші
    return say["message"].format(land=say["and"].join(names))


def year_label(year: dict, lang: str) -> str:
    """Підпис року на графіку NDVI: культура, тип землі або прочерк."""
    if year["crop"]:
        return strategies.crop_label(year["crop"], lang)
    if not year["category"]:
        return "—"
    say = texts.get(lang)["no_field"]
    kind = cdl.land_type(year["category"])
    return say["other_crop_short"] if kind == "other_crop" else say["land"][kind].capitalize()


def get_field(lat: float, lon: float, lang: str = "en") -> dict:
    """Збирає все про поле з усіх джерел."""
    # культури і ґрунт беремо точно в точці кліку.
    # клімат і GAEZ мають грубу сітку, тому там координати округлюємо, щоб частіше попадати в кеш
    lat, lon = round(lat, 4), round(lon, 4)
    # точки далеко від США відсіюємо одразу, бо карти культур USDA є тільки там
    if not (24 <= lat <= 50 and -125 <= lon <= -66):
        raise HTTPException(status_code=422, detail={"code": "no_field", "message": texts.get(lang)["no_field"]["outside_us"]})
    key = f"{lat}_{lon}"
    coarse_lat, coarse_lon = round(lat, 2), round(lon, 2)
    coarse_key = f"{coarse_lat}_{coarse_lon}"
    warnings = []
    say = texts.get(lang)["warnings"]

    # все вантажимо паралельно
    with ThreadPoolExecutor(max_workers=4) as pool:
        climate_job = pool.submit(cache.cached, f"climate_{coarse_key}",
                                  lambda: power.climate_summary(power.fetch_daily(coarse_lat, coarse_lon)))
        soil_job = pool.submit(cache.cached, f"soil_{key}", lambda: soil.fetch_soil(lat, lon))
        cdl_job = pool.submit(load_crop_history, lat, lon, key)
        gaez_job = pool.submit(cache.cached, f"gaez_{coarse_key}", lambda: gaez.crop_water(coarse_lat, coarse_lon))

    try:
        climate = climate_job.result()
    except Exception as error:  # без клімату нічого не порахуємо
        raise HTTPException(status_code=502, detail=f"no NASA POWER climate data ({error})")

    try:
        soil_info = soil_job.result()
    except Exception as error:
        soil_info = None
        warnings.append(say["soil_error"].format(error=error))

    try:
        history = cdl_job.result()
        cdl_failed = False
    except Exception:
        history = []
        cdl_failed = True

    try:
        crop_water = gaez_job.result()
    except Exception as error:
        crop_water = None
        warnings.append(say["gaez_error"].format(error=error))

    rotation = cdl.detect_rotation(history) if history else {"pattern": [], "label": "Unknown"}
    if soil_info is None and not warnings:
        warnings.append(say["no_soil"])
    # поля тут нема (місто, ліс, вода) або CropScape лежить. Нічого не вигадуємо, віддаємо причину
    if not rotation["pattern"]:
        raise HTTPException(status_code=422, detail={"code": "no_field", "message": no_field_message(history, cdl_failed, lang)})

    # ціни NASS, якщо є ключ. Без них модель бере оцінки з crops.json
    revenue = None
    if nass.api_key() and soil_info:
        state = soil_info["area"].split(", ")[-1]  # "Story County, Iowa" -> "Iowa"
        try:
            revenue = cache.cached(f"nass_{state}", lambda: nass.state_revenues(state))
        except Exception as error:
            warnings.append(say["prices_error"].format(error=error))

    # NDVI є тільки якщо його вже завантажили через /api/ndvi
    saved_ndvi = cache.load(f"ndvi_{key}")
    rain_by_year = {r["year"]: r["value"] for r in climate["series"]["season_rain"]}
    vegetation = ndvi.with_crops(saved_ndvi, history, rain_by_year) if saved_ndvi else None
    for year in (vegetation or {}).get("years", []):
        year["crop_name"] = year_label(year, lang)

    return {
        "location": {"lat": lat, "lon": lon, "area": soil_info["area"] if soil_info else None},
        "soil": soil_info,
        "climate": climate,
        "current_rotation": {**rotation, "history": history, "source": "USDA CDL"},
        "satellite": cache.load(f"satellite_{coarse_key}"),  # є тільки після /api/satellite
        "ndvi": vegetation,
        "revenue": revenue,
        "gaez": crop_water,
        "warnings": warnings,
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/satellite")
def satellite(lat: float, lon: float):
    """Опади IMERG і вологість SMAP. Для нового поля це хвилини дві."""
    lat, lon = round(lat, 2), round(lon, 2)
    key = f"satellite_{lat}_{lon}"
    saved = cache.load(key)
    if saved:
        return saved
    try:
        data = earthdata.satellite_summary(lat, lon)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"NASA Earthdata is not available: {error}")
    # кешуємо тільки коли прийшли обидва джерела
    if data["imerg_season_rain"] and data["smap_season_soil"]:
        cache.save(key, data)
    return data


@app.get("/api/ndvi")
def field_ndvi(lat: float, lon: float):
    """Пік NDVI по роках (MODIS). Нове поле вантажиться десь хвилину."""
    lat, lon = round(lat, 4), round(lon, 4)
    key = f"ndvi_{lat}_{lon}"
    saved = cache.load(key)
    if saved:
        return saved
    try:
        data = ndvi.season_peaks(lat, lon)
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"NASA MODIS is not available: {error}")
    cache.save(key, data)
    return data


@app.get("/api/geocode")
def geocode(q: str):
    """Пошук місця за назвою (Nominatim, тільки США)."""
    response = requests.get(
        "https://nominatim.openstreetmap.org/search",
        params={"q": q, "format": "json", "countrycodes": "us", "limit": 1},
        headers={"User-Agent": "FieldShift-hackathon-app/0.1"},
        timeout=20,
    )
    response.raise_for_status()
    results = response.json()
    if not results:
        raise HTTPException(status_code=404, detail="Place not found")
    return {"lat": float(results[0]["lat"]), "lon": float(results[0]["lon"]), "name": results[0]["display_name"]}


@app.get("/api/field")
def field(lat: float, lon: float, lang: str = "en"):
    return get_field(lat, lon, lang)


class StrategyRequest(BaseModel):
    lat: float
    lon: float
    priorities: dict = {"water": 3, "soil": 3, "erosion": 3, "income": 3}
    constraints: dict = {"irrigation": False, "livestock": False, "small_grain_equipment": True}
    scenario: str = "normal"  # normal | dry | wet
    lang: str = "en"  # en | uk
    units: str = "metric"  # metric (мм) | imperial (дюйми)


@app.post("/api/strategies")
def build(request: StrategyRequest):
    field_data = get_field(request.lat, request.lon, request.lang)
    return {
        "scenario": request.scenario,
        "strategies": strategies.build_strategies(field_data, request.priorities, request.constraints, request.scenario, request.lang, request.units),
    }


# на хостингу бекенд сам віддає зібраний фронтенд (frontend/dist), щоб сайт і API були на одній адресі.
# локально цієї папки може не бути, тоді фронтенд запускаємо окремо через npm run dev.
# має стояти в кінці файлу, після всіх /api
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
