"""FAO GAEZ v4: скільки води треба кожній культурі на цьому полі і скільки бракує без зрошення.

Дані беремо з сервера FAO (ArcGIS ImageServer), ключ не треба. Сайт: https://gaez.fao.org/

Беремо дві карти (без зрошення, високий рівень агротехніки):
- "Crop-specific actual evapotranspiration (mm)" - скільки води культура реально випаровує
- "Crop water deficit (mm)" - скільки їй бракує
Потреба = випаровування + дефіцит.

Періоди 2011–2040 і 2041–2070, сценарій RCP4.5, середнє з 5 кліматичних моделей.
Сітка ~9 км. Якщо в GAEZ стоїть 0, культура тут не росте.
"""
import json
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from statistics import mean

import requests

URL = "https://gaez-services.fao.org/server/rest/services/res02/ImageServer"
VARIABLES = {
    "Crop-specific actual evapotranspiration (mm)": "eta",
    "Crop water deficit (mm)": "deficit",
}
PERIODS = {"2011-2040": "now", "2041-2070": "future"}
SCENARIO = "RCP4.5"

# наш id -> назва в GAEZ
GAEZ_CROPS = {
    "corn": "Maize",
    "soybean": "Soybean",
    "winter_wheat": "Winter wheat",
    "spring_wheat": "Spring wheat",
    "oats": "Oat",
    "sorghum": "Sorghum",
    "sunflower": "Sunflower",
    "cotton": "Cotton",
    "alfalfa": "Alfalfa",
    "cereal_rye": "Winter rye",
    "clover": "Pasture legumes",
    "barley": "Barley",
    "canola": "Rapeseed",
    "peanuts": "Groundnut",
    "dry_beans": "Phaseolus bean",
}


def _catalog() -> dict:
    """Які растри нам треба: objectid -> (культура, змінна, період)."""
    names = ",".join(f"'{n}'" for n in GAEZ_CROPS.values())
    variables = ",".join(f"'{v}'" for v in VARIABLES)
    periods = ",".join(f"'{p}'" for p in PERIODS)
    where = (f"crop IN ({names}) AND variable IN ({variables}) AND year IN ({periods}) "
             f"AND rcp='{SCENARIO}' AND input_level='High' AND water_supply LIKE '%rain-fed%'")
    response = requests.get(f"{URL}/query", params={"where": where, "outFields": "objectid,crop,variable,year",
                                                    "returnGeometry": "false", "f": "json"}, timeout=120)
    response.raise_for_status()
    by_name = {name: crop_id for crop_id, name in GAEZ_CROPS.items()}
    return {f["attributes"]["objectid"]: (by_name[f["attributes"]["crop"]], VARIABLES[f["attributes"]["variable"]],
                                          PERIODS[f["attributes"]["year"]])
            for f in response.json()["features"]}


def _values_at(lat: float, lon: float, ids: list[int]) -> dict:
    """Значення багатьох растрів у точці за один запит: {objectid: значення}."""
    params = {
        "geometry": json.dumps({"x": lon, "y": lat, "spatialReference": {"wkid": 4326}}),
        "geometryType": "esriGeometryPoint",
        "mosaicRule": json.dumps({"mosaicMethod": "esriMosaicLockRaster", "lockRasterIds": ids}),
        "returnCatalogItems": "true", "returnGeometry": "false", "maxItemCount": len(ids), "f": "json",
    }
    response = requests.get(f"{URL}/identify", params=params, timeout=180)
    response.raise_for_status()
    data = response.json()
    items = data.get("catalogItems", {}).get("features", [])
    values = data.get("properties", {}).get("Values", [])
    result = {}
    for item, value in zip(items, values):
        oid = item["attributes"].get("objectid") or item["attributes"].get("OBJECTID")
        try:
            result[oid] = float(value)
        except (TypeError, ValueError):
            result[oid] = None  # нема даних
    return result


def crop_water(lat: float, lon: float) -> dict:
    """Потреба у воді і дефіцит для кожної культури (середнє з 5 моделей)."""
    catalog = _catalog()
    ids = list(catalog)
    chunks = [ids[i:i + 60] for i in range(0, len(ids), 60)]  # більше 60 за раз сервер не любить
    with ThreadPoolExecutor(max_workers=4) as pool:
        values = {}
        for part in pool.map(lambda chunk: _values_at(lat, lon, chunk), chunks):
            values.update(part)

    # (культура, період, змінна) -> значення з різних моделей
    collected = defaultdict(list)
    for oid, (crop_id, variable, period) in catalog.items():
        if values.get(oid) is not None:
            collected[(crop_id, period, variable)].append(values[oid])

    crops = {}
    for crop_id in GAEZ_CROPS:
        result = {}
        for period in PERIODS.values():
            eta = collected.get((crop_id, period, "eta"), [])
            deficit = collected.get((crop_id, period, "deficit"), [])
            if not eta or mean(eta) == 0:  # 0 значить, що культура тут не росте
                result[period] = None
            else:
                result[period] = {"need_mm": round(mean(eta) + mean(deficit or [0])),
                                  "deficit_mm": round(mean(deficit or [0]))}
        crops[crop_id] = {"suitable": result["now"] is not None, **result}

    return {
        "crops": crops,
        "source": "FAO GAEZ v4, rain-fed, high input, RCP4.5, mean of 5 climate models",
        "periods": {"now": "2011-2040", "future": "2041-2070"},
    }


if __name__ == "__main__":
    import time
    start = time.time()
    data = crop_water(37.95, -98.0)
    print(f"{round(time.time() - start)} s")
    for crop, info in data["crops"].items():
        print(crop, info)
