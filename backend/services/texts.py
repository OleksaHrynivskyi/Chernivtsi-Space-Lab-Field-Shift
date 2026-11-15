"""Тексти, які бекенд показує користувачу, англійською і українською.

Якщо треба змінити формулювання, то тут. У {дужках} значення, які підставляє код.
"""

TEXTS = {
    "en": {
        "confidence": {"model": "Model", "measured": "Measured"},
        "sources": {"cdl": "USDA CDL + crop calendar", "gaez": "FAO GAEZ, 5 climate models", "gaez_future": "FAO GAEZ, RCP4.5"},
        "evidence": {
            "bare": "Field is bare about {months} months a year in the current rotation",
            "heavy_rain": "{days} days a year with more than {heavy} of rain",
            "dry_years": "Dry years like {year} brought {dry} in May–Sep (typical: {typical})",
            "soil": "{soil} soil: {om}% organic matter, {slope}% slope",
            "income": "Typical gross income per acre in {state}: {crops} (state yield × US price, 2016–2025)",
            "smap": "Satellite soil moisture was lowest in {year}: {value} m³/m³ in May–Sep (root zone)",
            "ndvi_weak": "Satellite vegetation index (NDVI) on this field was weakest in {year} ({crop}): peak {peak}, "
                         "{drop}% below other years with this crop ({normal})",
            "ndvi_rain": ". May–Sep rain that year: {rain} (typical: {typical})",
            "ndvi_avg": "Peak vegetation index (NDVI) on this field averaged {avg} in 2016–2025 (1 = dense green crop)",
            "water_now": "{crop} needs about {need} of water per season here; without irrigation it is short by about {deficit} (2011–2040)",
            "water_future": "By 2041–2070 {crop_lower} would need about {need}, short by about {deficit} without irrigation",
        },
        "drought_why": {
            "generic": "Crops that are less short of water on this field (FAO GAEZ) hold up better in dry years like {dry_year}.",
            "swap": "{new} is short of water by about {new_deficit} per season here without irrigation, compared with about "
                    "{old_deficit} for {old_lower} (FAO GAEZ, 2011–2040). That helps in dry years like {dry_year}.",
            "mono": "Alternating {old_lower} with {new_lower} breaks the monoculture. {new} is short of water by about "
                    "{new_deficit} per season here without irrigation (FAO GAEZ, 2011–2040).",
            "extra": "No summer crop here needs clearly less water than what you grow now, so this option adds {new_lower} "
                     "as one more crop. It is short of water by about {new_deficit} per season without irrigation (FAO GAEZ, 2011–2040).",
        },
        "kinds": {
            "current": {
                "why": "This is what the field has grown in recent years, detected from USDA Cropland Data Layer maps.",
                "benefits": ["Known equipment, markets and workflow"],
                "gaps": ["Satellite crop maps can mislabel single fields — please confirm"],
                "check_locally": ["Is this rotation detected correctly?"],
            },
            "cover": {
                "why": "Adding a winter cover crop cuts bare soil from about {bare_now} to {bare_new} months a year, when heavy rain hits uncovered ground.",
                "benefits": ["Less soil loss in spring storms", "More organic matter over time", "Roots improve water infiltration"],
                "gaps": ["We do not know your seeding equipment or herbicide program", "Cover crop seed costs vary by region"],
                "check_locally": ["Cover crop termination timing before planting", "Spring water use by the cover crop in dry years",
                                  "Possible yield drag for the crop planted right after rye"],
            },
            "diverse": {
                "why": "One more crop breaks pest and disease cycles and adds a legume or small grain that feeds the soil.",
                "benefits": ["Breaks pest cycles", "Spreads work and risk across the year"],
                "clover": "Clover adds nitrogen for the next crop",
                "gaps": ["Local prices and buyers for the added crop"],
                "check_locally": ["Equipment for small grains", "Grain storage and markets nearby"],
            },
            "drought": {
                "why": "{drought_why}",
                "benefits": ["Smaller water shortfall without irrigation", "Lower risk in dry years"],
                "benefits_no_water": ["One more crop breaks pest and disease cycles", "Spreads weather and price risk across crops"],
                "gaps": ["Market price and contracts for the new crop"],
                "check_locally": ["Seed varieties suited to your area", "Feed or grain buyers within hauling distance"],
            },
            "forage": {
                "why": "Alfalfa grows deep roots, fixes nitrogen and gives forage for livestock.",
                "benefits": ["Forage for your animals", "Deep roots and nitrogen for the next crop"],
                "gaps": ["Hay prices and storage"],
                "check_locally": ["Alfalfa needs about {alfalfa_need} of water per season here (FAO GAEZ) — check irrigation"],
            },
        },
        "no_field": {
            "message": "There is no farm field data for this place: on USDA crop maps for 2016–2025 it is {land}. "
                       "Field Shift works only for crop fields — please pick a field (on the map they look like light rectangular plots).",
            "other_crops": "There is no data for this place in our model: on USDA crop maps for 2016–2025 it grows {crops}, "
                           "and these crops are not in Field Shift yet. Please pick a field with corn, soybean, wheat, barley, oats, "
                           "sorghum, sunflower, canola, cotton, peanuts, dry beans or alfalfa.",
            "no_maps": "USDA crop maps have no information for this place for 2016–2025, so we cannot tell what grows here. "
                       "Please pick another field.",
            "maps_down": "USDA crop maps (CropScape) are not responding right now, so we cannot tell what grows on this field. "
                         "Please try again in a few minutes.",
            "land": {"town": "a town or built-up area", "water": "water", "forest": "forest", "wetland": "wetland",
                     "grass": "grassland or pasture", "shrub": "shrubland", "barren": "bare land",
                     "other_crop": "crops we do not model yet"},
            "other_crop_short": "Other crop",
            "outside_us": "Field Shift works only for the 48 contiguous US states. Please choose a field there.",
            "and": " and ",
        },
        "warnings": {
            "soil_error": "Soil data not available: {error}",
            "gaez_error": "Crop water data (FAO GAEZ) not available, water scores use typical values: {error}",
            "prices_error": "Crop prices not available: {error}",
            "no_soil": "No USDA soil data at this point. Is it farmland? Soil-based scores use default values.",
        },
    },
    "uk": {
        "confidence": {"model": "Модель", "measured": "Вимірювання"},
        "sources": {"cdl": "USDA CDL + календар культур", "gaez": "FAO GAEZ, 5 кліматичних моделей", "gaez_future": "FAO GAEZ, RCP4.5"},
        "evidence": {
            "bare": "Поле стоїть голим приблизно {months} міс. на рік у поточній сівозміні",
            "heavy_rain": "{days} дн. на рік зі зливою понад {heavy}",
            "dry_years": "У сухі роки, як {year}, у травні–вересні випадало {dry} (зазвичай {typical})",
            "soil": "Ґрунт {soil}: {om}% органічної речовини, схил {slope}%",
            "income": "Типовий валовий дохід з акра у штаті {state}: {crops} (урожайність у штаті × ціна в США, 2016–2025)",
            "smap": "Супутникова вологість ґрунту була найнижчою у {year} р.: {value} м³/м³ у травні–вересні (коренева зона)",
            "ndvi_weak": "Супутниковий індекс рослинності (NDVI) на полі був найнижчим у {year} р. ({crop}): пік {peak}, "
                         "на {drop}% нижче, ніж в інші роки з цією культурою ({normal})",
            "ndvi_rain": ". Опадів у травні–вересні того року: {rain} (зазвичай {typical})",
            "ndvi_avg": "Пік індексу рослинності (NDVI) на полі в середньому {avg} за 2016–2025 (1 — густа зелена культура)",
            "water_now": "{crop} потребує тут близько {need} води за сезон; без зрошення бракує близько {deficit} (2011–2040)",
            "water_future": "У 2041–2070 роках {crop_lower} потребуватиме близько {need}, без зрошення бракуватиме близько {deficit}",
        },
        "drought_why": {
            "generic": "Культури, яким на цьому полі менше бракує води (FAO GAEZ), краще витримують сухі роки, як {dry_year}.",
            "swap": "Культурі «{new_lower}» тут без зрошення бракує близько {new_deficit} води за сезон, а культурі «{old_lower}» — "
                    "близько {old_deficit} (FAO GAEZ, 2011–2040). Це допомагає в сухі роки, як {dry_year}.",
            "mono": "Чергування культур «{old_lower}» і «{new_lower}» розриває монокультуру. Культурі «{new_lower}» тут без зрошення "
                    "бракує близько {new_deficit} води за сезон (FAO GAEZ, 2011–2040).",
            "extra": "Літньої культури, якій тут треба помітно менше води, ніж теперішнім, немає, тому цей варіант додає ще одну культуру: "
                     "«{new_lower}». Без зрошення їй бракує близько {new_deficit} води за сезон (FAO GAEZ, 2011–2040).",
        },
        "kinds": {
            "current": {
                "why": "Це те, що росло на полі останні роки, за картами USDA Cropland Data Layer.",
                "benefits": ["Звична техніка, ринки збуту і робота"],
                "gaps": ["Супутникові карти культур можуть помилятися для окремого поля — перевірте"],
                "check_locally": ["Чи правильно визначено сівозміну?"],
            },
            "cover": {
                "why": "Озима покривна культура скорочує час, коли поле голе, з приблизно {bare_now} до {bare_new} міс. на рік — саме тоді зливи змивають ґрунт.",
                "benefits": ["Менше ерозії від весняних злив", "Більше органічної речовини з часом", "Коріння покращує вбирання води"],
                "gaps": ["Ми не знаємо вашої техніки для сівби і системи гербіцидів", "Ціна насіння покривних культур різна в різних регіонах"],
                "check_locally": ["Коли знищувати покривну культуру перед сівбою", "Скільки води покривна культура забирає навесні в сухі роки",
                                  "Можливе зниження врожаю культури, яку сіють одразу після жита"],
            },
            "diverse": {
                "why": "Ще одна культура розриває цикли шкідників і хвороб і додає бобову або зернову культуру, яка живить ґрунт.",
                "benefits": ["Розриває цикли шкідників", "Розподіляє роботу і ризики протягом року"],
                "clover": "Конюшина залишає азот наступній культурі",
                "gaps": ["Місцеві ціни і покупці для нової культури"],
                "check_locally": ["Техніка для зернових", "Зберігання зерна і ринки поблизу"],
            },
            "drought": {
                "why": "{drought_why}",
                "benefits": ["Менший дефіцит води без зрошення", "Менший ризик у сухі роки"],
                "benefits_no_water": ["Ще одна культура розриває цикли шкідників і хвороб", "Розподіляє погодні й цінові ризики між культурами"],
                "gaps": ["Ринкова ціна і контракти для нової культури"],
                "check_locally": ["Сорти, придатні для вашого регіону", "Покупці зерна чи кормів неподалік"],
            },
            "forage": {
                "why": "Люцерна має глибоке коріння, фіксує азот і дає корм для худоби.",
                "benefits": ["Корм для ваших тварин", "Глибоке коріння і азот для наступної культури"],
                "gaps": ["Ціни на сіно і його зберігання"],
                "check_locally": ["Люцерна потребує тут близько {alfalfa_need} води за сезон (FAO GAEZ) — перевірте зрошення"],
            },
        },
        "no_field": {
            "message": "Для цієї території немає даних про поле: на картах культур USDA за 2016–2025 роки тут {land}. "
                       "Field Shift працює лише для сільгосп-полів — оберіть, будь ласка, поле (на карті це світлі прямокутні ділянки).",
            "other_crops": "Для цієї території в нашій моделі немає даних: за картами USDA у 2016–2025 роках тут росте {crops}, "
                           "а цих культур у Field Shift поки немає. Оберіть поле з кукурудзою, соєю, пшеницею, ячменем, вівсом, "
                           "сорго, соняшником, ріпаком, бавовною, арахісом, квасолею або люцерною.",
            "no_maps": "Карти культур USDA не мають інформації про цю територію за 2016–2025 роки, тож ми не знаємо, що тут росте. "
                       "Оберіть, будь ласка, інше поле.",
            "maps_down": "Карти культур USDA (CropScape) зараз не відповідають, тож ми не можемо визначити, що росте на цьому полі. "
                         "Спробуйте ще раз за кілька хвилин.",
            "land": {"town": "місто чи селище (забудова)", "water": "вода", "forest": "ліс", "wetland": "болото",
                     "grass": "луки чи пасовище", "shrub": "чагарники", "barren": "пустир",
                     "other_crop": "культури, яких ще немає в нашій моделі"},
            "other_crop_short": "Інша культура",
            "outside_us": "Field Shift працює лише для 48 материкових штатів США. Оберіть, будь ласка, поле там.",
            "and": " і ",
        },
        "warnings": {
            "soil_error": "Дані про ґрунт недоступні: {error}",
            "gaez_error": "Дані про воду для культур (FAO GAEZ) недоступні, для балів води взято типові значення: {error}",
            "prices_error": "Ціни на культури недоступні: {error}",
            "no_soil": "У цій точці немає даних USDA про ґрунт. Це сільгоспземля? Бали, що залежать від ґрунту, рахуються з типовими значеннями.",
        },
    },
}


def amount(mm: float, lang: str = "en", units: str = "metric") -> str:
    """Число з одиницею: "502 мм" або "19.8 in" (якщо units = "imperial")."""
    if units == "imperial":
        return f"{mm / 25.4:.1f} in" if lang == "en" else f"{mm / 25.4:.1f} дюйм."
    return f"{round(mm)} mm" if lang == "en" else f"{round(mm)} мм"


def get(lang: str) -> dict:
    """Тексти потрібною мовою (якщо мови нема, то англійською)."""
    return TEXTS.get(lang, TEXTS["en"])
