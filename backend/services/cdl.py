"""USDA CropScape (Cropland Data Layer): що росло в точці кожного року.

Сервіс хоче координати в EPSG:5070, тому переводимо через pyproj. Ключ не треба.
"""
import re
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from pyproj import Transformer

CDL_URL = "https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLValue"
YEARS = range(2016, 2026)  # коли вийде карта за 2026, додати сюди

_to_albers = Transformer.from_crs("EPSG:4326", "EPSG:5070", always_xy=True)

# назва в CDL -> наш id з crops.json
CDL_TO_CROP = {
    "Corn": "corn",
    "Soybeans": "soybean",
    "Winter Wheat": "winter_wheat",
    "Spring Wheat": "spring_wheat",
    "Sorghum": "sorghum",
    "Alfalfa": "alfalfa",
    "Oats": "oats",
    "Cotton": "cotton",
    "Sunflower": "sunflower",
    "Durum Wheat": "spring_wheat",  # тверда пшениця, рахуємо як яру
    "Barley": "barley",
    "Canola": "canola",
    "Peanuts": "peanuts",
    "Dry Beans": "dry_beans",
    # два врожаї за рік
    "Dbl Crop WinWht/Soybeans": "winter_wheat+soybean",
    "Dbl Crop WinWht/Corn": "winter_wheat+corn",
    "Dbl Crop WinWht/Sorghum": "winter_wheat+sorghum",
    "Dbl Crop WinWht/Cotton": "winter_wheat+cotton",
    "Dbl Crop Oats/Corn": "oats+corn",
    "Dbl Crop Barley/Corn": "barley+corn",
    "Dbl Crop Barley/Soybeans": "barley+soybean",
    "Dbl Crop Barley/Sorghum": "barley+sorghum",
    "Dbl Crop Soybeans/Cotton": "soybean+cotton",
    "Dbl Crop Soybeans/Oats": "soybean+oats",
    "Dbl Crop Corn/Soybeans": "corn+soybean",
}


def land_type(category: str) -> str:
    """Що це за земля, якщо не поле (для повідомлення користувачу)."""
    if category.startswith("Developed"):
        return "town"
    if category in ("Open Water", "Aquaculture"):
        return "water"
    if "Forest" in category:
        return "forest"
    if "Wetlands" in category:
        return "wetland"
    if category in ("Grass/Pasture", "Grassland/Pasture", "Herbaceous Wetlands"):
        return "grass"
    if category == "Shrubland":
        return "shrub"
    if category in ("Barren", "Perennial Ice/Snow"):
        return "barren"
    return "other_crop"  # якась культура не з нашого списку (рис, овочі...)


def no_cropland_reason(history: list[dict]) -> tuple[list[str], list[str]]:
    """Типи землі (найчастіший перший) і назви культур, яких у нас нема."""
    counts = {}
    other_crops = []
    for h in history:
        if not h["category"]:
            continue
        kind = land_type(h["category"])
        counts[kind] = counts.get(kind, 0) + 1
        if kind == "other_crop" and h["category"] not in other_crops:
            other_crops.append(h["category"])
    return sorted(counts, key=counts.get, reverse=True), other_crops


MIN_YEARS = 6  # якщо відповіло менше років, сівозміну не визначаємо


def fetch_year(x: float, y: float, year: int) -> str | None:
    """Культура за один рік. CropScape буває висне, тому 3 спроби."""
    for attempt in range(3):
        try:
            response = requests.get(CDL_URL, params={"year": year, "x": x, "y": y}, timeout=20)
            response.raise_for_status()
            match = re.search(r'category: "([^"]+)"', response.text)
            return match.group(1) if match else None
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


def fetch_history(lat: float, lon: float) -> list[dict]:
    """Історія за 2016–2025. Рік, який не завантажився, йде з failed=True."""
    x, y = _to_albers.transform(lon, lat)

    def safe(year):
        try:
            return fetch_year(x, y, year), False
        except requests.RequestException:
            return None, True

    # паралельно, бо по одному дуже довго
    with ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(safe, YEARS))
    history = [{"year": year, "category": category, "crop": CDL_TO_CROP.get(category), "failed": failed}
               for year, (category, failed) in zip(YEARS, results)]
    if sum(1 for h in history if not h["failed"]) < MIN_YEARS:
        raise RuntimeError("USDA CropScape is not responding")
    return history


def is_complete(history: list[dict]) -> bool:
    """True, якщо всі роки завантажились."""
    return not any(h.get("failed") for h in history)


def detect_rotation(history: list[dict]) -> dict:
    """Шукає, що повторюється: 'corn -> soybean', одна культура і т.д."""
    recent = [h["crop"] for h in history[-6:] if h["crop"]]
    if not recent:
        return {"pattern": [], "label": "Unknown (not cropland in CDL)"}
    unique = list(dict.fromkeys(recent))
    if len(unique) == 1:
        return {"pattern": unique, "label": f"Continuous {unique[0]}"}
    # пробуємо цикл з 2 або 3 культур
    for size in (2, 3):
        cycle = recent[-size:]
        if all(recent[i] == cycle[(i - len(recent)) % size] for i in range(len(recent))):
            if size == 3 and cycle[0] == cycle[2]:
                cycle = [cycle[2], cycle[0], cycle[1]]  # corn, soybean, corn -> corn, corn, soybean (так зрозуміліше)
            return {"pattern": cycle, "label": " -> ".join(cycle)}
    return {"pattern": unique, "label": "Mixed: " + ", ".join(unique)}
