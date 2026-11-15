// Переклад сайту: англійська і українська.
// В компоненті: const { t } = useLang(), далі t('field.title') або t('cond.days', { n: 162 })
// Пояснення стратегій сюди не входять, вони приходять з бекенду вже перекладені.
import { createContext, useContext, useState } from 'react'

const DICT = {
  en: {
    'step.field': 'Field', 'step.result': 'Suggestion', 'step.compare': 'Options', 'step.conditions': 'Statistics',
    'nav.how': 'How it works',



    'res.title': 'Our suggestion for your field', 'res.best': 'Best fit for your goals',
    'res.instead': 'Instead of what you grow now: {name}',
    'res.keep': 'What you grow now already fits your goals best. The other options are still worth a look.',
    'res.why': 'Why', 'res.vsNow': 'Compared with what you grow now',
    'res.allOptions': 'See all options', 'res.details': 'Report', 'res.aboutField': 'Field statistics: climate, soil, risks',
    'cmpw.better': 'Better', 'cmpw.same': 'About the same', 'cmpw.worse': 'Worse',




    'footer.disclaimer': 'This tool supports, not replaces, your judgment and local agronomist advice.',
    'footer.data': 'Data: NASA POWER, NASA GPM IMERG, NASA SMAP, NASA MODIS NDVI (ORNL DAAC), NASA GIBS map layers, USDA SSURGO, USDA Cropland Data Layer, USDA NASS, FAO GAEZ. Satellite map: USDA NAIP imagery (USGS The National Map). Place search: © OpenStreetMap contributors (Nominatim).',
    'demo.iowa': 'Demo: Iowa corn–soy', 'demo.kansas': 'Demo: Kansas wheat', 'demo.carolina': 'Demo: North Carolina',
    'field.title': 'Choose your field and priorities',
    'field.subtitle': 'Start with a location, then tell us what matters on your farm.',
    'field.howto': ['Find your field on the map or pick a demo field', 'Set what matters most to you', 'Press “Analyze this field”'],
    'field.search': 'Search a place or paste coordinates, e.g. Ames, Iowa or 42.10, -93.55',
    'field.searchButton': 'Search', 'field.searching': 'Searching…',
    'field.usOnly': 'Choose a point inside the 48 contiguous US states. The shaded area has no USDA soil and crop data.',
    'field.notFound': 'Place not found. Try a town and state, for example: Ames, Iowa',
    'field.searchDown': 'Search is not available right now. Paste coordinates instead, for example: 42.10, -93.55',
    'field.prioritiesTitle': 'What matters most to you?',
    'field.prioritiesHint': 'Choose 1 (less important) to 5 (most important).',
    'priority.water': 'Save water', 'priority.water.hint': 'Use less water across the rotation.',
    'priority.soil': 'Build soil health', 'priority.soil.hint': 'Keep soil productive for the long term.',
    'priority.erosion': 'Reduce erosion', 'priority.erosion.hint': 'Keep topsoil in place after heavy rain.',
    'priority.income': 'Income from crops', 'priority.income.hint': 'Favor crops with stronger earning potential.',
    'constraint.irrigation': 'I can irrigate', 'constraint.livestock': 'I have livestock (need forage)',
    'constraint.small_grain_equipment': 'I have equipment for small grains',
    'field.analyze': 'Analyze this field', 'field.loading': 'Loading NASA and USDA data…',
    'field.loadingHint': 'A new field can take up to a minute the first time.',
    'progress.climate': 'Reading 25 years of NASA POWER climate…', 'progress.soil': 'Reading your soil from USDA SSURGO…',
    'progress.crops': 'Checking what grew here (USDA crop maps)…', 'progress.water': 'Getting crop water needs from FAO GAEZ…',
    'progress.prices': 'Getting yields and prices from USDA NASS…', 'progress.options': 'Comparing rotation options…',
    'field.error': 'Could not analyze this point: {error}',
    'field.backendDown': 'The server is not responding, so there is no data to show. Please try again in a minute.',
    'map.click': 'Click inside the US to choose a field','map.layerNone': 'NASA layer: none',
    'map.smap': 'SMAP root-zone soil moisture', 'map.ndvi': 'MODIS vegetation (NDVI, 8-day)', 'map.imerg': 'GPM IMERG rain rate',

    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    monthsOf: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    'cond.title': 'Field statistics', 'cond.selected': 'Selected field', 'cond.current': 'Current rotation: {name}',
    'cond.frost': 'Frost-free season', 'cond.days': '{n} days', 'cond.allYear': 'All year', 'cond.frostRare': 'Frost is rare here',
    'cond.frostDates': '{from} to {to}',
    'cond.gdd': 'Growing degree days', 'cond.gddNote': 'base {base}, Apr–Oct',
    'cond.rain': 'Season rainfall', 'cond.rainNote': 'May–Sep, typical year',
    'cond.heat': 'Heat days', 'cond.heatNote': 'above {t} per year',
    'cond.soil': 'Soil', 'cond.soilNote': '{om}% organic matter, {slope}% slope', 'cond.noSoil': 'Soil data not available',
    'cond.yearTitle': 'A typical year on this field', 'cond.yearSubtitle': 'Monthly averages, {source}',
    'cond.rainAxis': 'Rainfall ({u})', 'cond.tempAxis': 'Temperature ({u})',
    'cond.rainSeries': 'Rainfall, {u}', 'cond.tempSeries': 'Avg temperature, {u}',
    'cond.bare': 'Bare soil: {n} months', 'cond.cover': 'Crop cover', 'cond.year1': 'Shown for year 1 of the current rotation.',




    'watch.title': 'Things to watch', 'watch.subtitle': 'Planning cautions for this field',
    'watch.none': 'No major warnings from the climate record.',
    'watch.frost': 'Late spring frost', 'watch.frostText': 'Last frost came after May 5 in {n} of 10 years.',
    'watch.bare': 'Uncovered soil', 'watch.bareText': 'Soil is bare about {n} months a year, when heavy rain can wash topsoil away.',
    'watch.heat': 'Hot days', 'watch.heatText': '{n} days above {t} per year can stress crops when soils are dry.',
    'watch.rain': 'Less summer rain', 'watch.rainText': 'May–Sep rain is changing by {n} per decade.',
    'watch.ndvi': 'Weaker crop in {year}', 'watch.ndviText': 'Satellite NDVI in {year} ({crop}) was {drop}% below other years with this crop. Worth recalling what happened that season.',
    'ndvi.title': 'Vegetation on this field (NASA MODIS)',
    'ndvi.subtitle': 'Peak NDVI each season (late April to mid September) for the 250 m satellite pixel at your point. 0 = bare soil, 0.8 and above = dense green crop.',
    'ndvi.loading': 'Loading MODIS satellite images for this field… (about 1 minute)',
    'ndvi.error': 'The NASA MODIS service did not respond. Open this page again a bit later.',
    'ndvi.axis': 'Peak NDVI',
    'ndvi.weak': 'Weakest season: {year} ({crop}) — {drop}% below other years with this crop.',
    'ndvi.rain': 'May–Sep rain that year: {rain} (typical {typical}).',
    'ndvi.steady': 'No season stands out: for each crop the peak stayed within 5% of its usual level.',
    'ndvi.note': 'Clouds lower single images, so we take the season peak. Different crops have different usual NDVI, so each year is compared only with years of the same crop.',











    'sat.title': 'Satellite check',
    'sat.teaser': 'How NASA satellites (GPM IMERG rain, SMAP soil moisture) compare with the model data for your field.',
    'sat.error': 'NASA satellite data is not available right now. Please try again later.',
    'sat.partial': 'This satellite data is not available right now.',
    'sat.loading': 'Loading NASA IMERG and SMAP data… A new field can take about 2 minutes.',
    'sat.rainTitle': 'May–Sep rainfall, {u}', 'sat.power': 'NASA POWER (model)', 'sat.imerg': 'GPM IMERG (satellite)',
    'sat.more': 'On average the satellite shows {p}% more summer rain than the model.',
    'sat.less': 'On average the satellite shows {p}% less summer rain than the model.',
    'sat.soilTitle': 'Root-zone soil moisture, m³/m³', 'sat.smap': 'SMAP L4, May–Sep',
    'sat.soilNote': 'Average of 10 snapshots per season from NASA SMAP (9 km grid).',
    'sat.footnote': 'Satellites measure a whole 10 km cell, not your exact field. A rain gauge or soil probe on the farm is more exact for one spot — combining both gives the best picture.',
    'cmp.title': '{n} rotation options for your field',
    'cmp.subtitle': 'What you grow now compared with three alternatives. The score from 0 to 100 shows how well each option fits your priorities — higher is better.',
    'cmp.normal': 'Typical year', 'cmp.dry': 'Dry year (like {year})', 'cmp.wet': 'Wet year',
    'cmp.current': 'Current', 'cmp.option': 'Option {id}', 'cmp.best': 'Best match for your priorities', 'cmp.why': 'Why this option →',
    'score.water': 'Water use', 'score.soil_health': 'Soil health', 'score.erosion': 'Erosion control',
    'score.pest_break': 'Pest break', 'score.income': 'Income', 'score.climate_risk': 'Weather resilience',
    'cal.year': 'Year {n}',
    'plan.title': 'When to plant and harvest',
    'plan.note': 'Typical dates for US farms, not for this exact field. Adjust them to your weather and seed.',
    'plan.early': 'Early {m}', 'plan.mid': 'Mid {m}', 'plan.late': 'Late {m}',
    'plan.sow': 'plant', 'plan.harvest': 'harvest', 'plan.end': 'terminate',
    'det.back': '← All options', 'det.current': 'Current', 'det.why': 'Why we suggest it', 'det.evidence': 'Evidence from the collected data',
    'det.benefits': 'Possible benefits', 'det.gaps': "What we don't know", 'det.check': 'Check with a local expert',
    'det.bare': 'Bare soil: about {n} months a year', 'det.print': 'Print or save as PDF',
    'det.reportFor': 'Field Shift report · {place}',
  },

  uk: {
    'step.field': 'Поле', 'step.result': 'Порада', 'step.compare': 'Варіанти', 'step.conditions': 'Статистика',
    'nav.how': 'Як це працює',



    'res.title': 'Наша порада для вашого поля', 'res.best': 'Найкраще під ваші цілі',
    'res.instead': 'Замість того, що росте зараз: {name}',
    'res.keep': 'Те, що росте зараз, уже найкраще відповідає вашим цілям. Інші варіанти теж варто переглянути.',
    'res.why': 'Чому', 'res.vsNow': 'Порівняно з тим, що росте зараз',
    'res.allOptions': 'Переглянути всі варіанти', 'res.details': 'Звіт', 'res.aboutField': 'Статистика поля: клімат, ґрунт, ризики',
    'cmpw.better': 'Краще', 'cmpw.same': 'Так само', 'cmpw.worse': 'Гірше',




    'footer.disclaimer': 'Цей інструмент допомагає, але не замінює ваше рішення і пораду місцевого агронома.',
    'footer.data': 'Дані: NASA POWER, NASA GPM IMERG, NASA SMAP, NASA MODIS NDVI (ORNL DAAC), шари карт NASA GIBS, USDA SSURGO, USDA Cropland Data Layer, USDA NASS, FAO GAEZ. Супутникова карта: аерознімки USDA NAIP (USGS The National Map). Пошук місць: © OpenStreetMap contributors (Nominatim).',
    'demo.iowa': 'Демо: Айова, кукурудза–соя', 'demo.kansas': 'Демо: Канзас, пшениця', 'demo.carolina': 'Демо: Північна Кароліна',
    'field.title': 'Оберіть поле і пріоритети',
    'field.subtitle': 'Почніть з місця, потім скажіть, що важливо для вашої ферми.',
    'field.howto': ['Знайдіть своє поле на карті або оберіть демо-поле', 'Вкажіть, що для вас найважливіше', 'Натисніть «Проаналізувати поле»'],
    'field.search': 'Знайдіть місце або вставте координати, напр. Ames, Iowa або 42.10, -93.55',
    'field.searchButton': 'Знайти', 'field.searching': 'Шукаю…',
    'field.usOnly': 'Оберіть точку в межах 48 материкових штатів США. У затемненій зоні немає даних USDA про ґрунт і культури.',
    'field.notFound': 'Місце не знайдено. Спробуйте місто і штат, наприклад: Ames, Iowa',
    'field.searchDown': 'Пошук зараз недоступний. Вставте координати, наприклад: 42.10, -93.55',
    'field.prioritiesTitle': 'Що для вас найважливіше?',
    'field.prioritiesHint': 'Оберіть від 1 (менш важливо) до 5 (найважливіше).',
    'priority.water': 'Економити воду', 'priority.water.hint': 'Менше води на всю сівозміну.',
    'priority.soil': "Покращити здоров'я ґрунту", 'priority.soil.hint': 'Щоб ґрунт лишався родючим надовго.',
    'priority.erosion': 'Зменшити ерозію', 'priority.erosion.hint': 'Щоб зливи не змивали верхній шар ґрунту.',
    'priority.income': 'Дохід з культур', 'priority.income.hint': 'Перевага культурам, що краще заробляють.',
    'constraint.irrigation': 'Я можу зрошувати', 'constraint.livestock': 'У мене є худоба (потрібен корм)',
    'constraint.small_grain_equipment': 'У мене є техніка для зернових',
    'field.analyze': 'Проаналізувати поле', 'field.loading': 'Завантажую дані NASA і USDA…',
    'field.loadingHint': 'Нове поле вперше може вантажитися до хвилини.',
    'progress.climate': 'Читаємо 25 років клімату NASA POWER…', 'progress.soil': 'Читаємо ґрунт поля з USDA SSURGO…',
    'progress.crops': 'Дивимось, що тут росло (карти культур USDA)…', 'progress.water': 'Беремо потребу культур у воді з FAO GAEZ…',
    'progress.prices': 'Беремо врожайність і ціни з USDA NASS…', 'progress.options': 'Порівнюємо варіанти сівозміни…',
    'field.error': 'Не вдалося проаналізувати цю точку: {error}',
    'field.backendDown': 'Сервер не відповідає, тому даних немає. Спробуйте ще раз за хвилину.',
    'map.click': 'Клацніть у межах США, щоб обрати поле','map.layerNone': 'Шар NASA: немає',
    'map.smap': 'SMAP: вологість кореневої зони', 'map.ndvi': 'MODIS: рослинність (NDVI, 8 днів)', 'map.imerg': 'GPM IMERG: інтенсивність опадів',

    months: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'],
    monthsOf: ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'],
    'cond.title': 'Статистика поля', 'cond.selected': 'Обране поле', 'cond.current': 'Поточна сівозміна: {name}',
    'cond.frost': 'Сезон без заморозків', 'cond.days': '{n} дн.', 'cond.allYear': 'Увесь рік', 'cond.frostRare': 'Заморозки тут рідкість',
    'cond.frostDates': 'з {from} до {to}',
    'cond.gdd': 'Сума ефективних температур', 'cond.gddNote': 'база {base}, квітень–жовтень',
    'cond.rain': 'Опади за сезон', 'cond.rainNote': 'травень–вересень, типовий рік',
    'cond.heat': 'Дні спеки', 'cond.heatNote': 'понад {t} за рік',
    'cond.soil': 'Ґрунт', 'cond.soilNote': '{om}% органічної речовини, схил {slope}%', 'cond.noSoil': 'Даних про ґрунт немає',
    'cond.yearTitle': 'Типовий рік на цьому полі', 'cond.yearSubtitle': 'Середні значення по місяцях, {source}',
    'cond.rainAxis': 'Опади ({u})', 'cond.tempAxis': 'Температура ({u})',
    'cond.rainSeries': 'Опади, {u}', 'cond.tempSeries': 'Середня температура, {u}',
    'cond.bare': 'Голий ґрунт: {n} міс.', 'cond.cover': 'Під культурою', 'cond.year1': 'Показано перший рік поточної сівозміни.',




    'watch.title': 'На що звернути увагу', 'watch.subtitle': 'Застереження для планування на цьому полі',
    'watch.none': 'Кліматичні дані не показують серйозних ризиків.',
    'watch.frost': 'Пізні весняні заморозки', 'watch.frostText': 'Останній заморозок був після 5 травня у {n} роках з 10.',
    'watch.bare': 'Неприкритий ґрунт', 'watch.bareText': 'Ґрунт голий приблизно {n} міс. на рік, і зливи можуть змивати верхній шар.',
    'watch.heat': 'Спекотні дні', 'watch.heatText': '{n} дн. понад {t} на рік можуть пригнічувати культури, коли ґрунт сухий.',
    'watch.rain': 'Менше літніх дощів', 'watch.rainText': 'Опади травня–вересня змінюються на {n} за десятиліття.',
    'watch.ndvi': 'Слабша культура у {year} р.', 'watch.ndviText': 'Супутниковий NDVI у {year} р. ({crop}) був на {drop}% нижчим, ніж в інші роки з цією культурою. Варто згадати, що сталося того сезону.',
    'ndvi.title': 'Рослинність на полі (NASA MODIS)',
    'ndvi.subtitle': 'Пік NDVI кожного сезону (з кінця квітня до середини вересня) для супутникового пікселя 250 м у вашій точці. 0 — голий ґрунт, 0.8 і більше — густа зелена культура.',
    'ndvi.loading': 'Завантажуємо супутникові знімки MODIS для цього поля… (близько 1 хвилини)',
    'ndvi.error': 'Сервіс NASA MODIS не відповів. Відкрийте цю сторінку трохи пізніше.',
    'ndvi.axis': 'Пік NDVI',
    'ndvi.weak': 'Найслабший сезон: {year} р. ({crop}) — на {drop}% нижче, ніж в інші роки з цією культурою.',
    'ndvi.rain': 'Опадів у травні–вересні того року: {rain} (зазвичай {typical}).',
    'ndvi.steady': 'Жоден сезон не вирізняється: для кожної культури пік тримався в межах 5% від звичного.',
    'ndvi.note': 'Хмари занижують окремі знімки, тому беремо пік сезону. У різних культур різний звичний NDVI, тому кожен рік порівнюємо лише з роками тієї ж культури.',











    'sat.title': 'Перевірка супутником',
    'sat.teaser': 'Як дані супутників NASA (опади GPM IMERG, вологість ґрунту SMAP) порівнюються з модельними даними для вашого поля.',
    'sat.error': 'Супутникові дані NASA зараз недоступні. Спробуйте пізніше.',
    'sat.partial': 'Ці супутникові дані зараз недоступні.',
    'sat.loading': 'Завантажую дані NASA IMERG і SMAP… Нове поле може вантажитися близько 2 хвилин.',
    'sat.rainTitle': 'Опади травня–вересня, {u}', 'sat.power': 'NASA POWER (модель)', 'sat.imerg': 'GPM IMERG (супутник)',
    'sat.more': 'У середньому супутник показує на {p}% більше літніх опадів, ніж модель.',
    'sat.less': 'У середньому супутник показує на {p}% менше літніх опадів, ніж модель.',
    'sat.soilTitle': 'Вологість кореневої зони, м³/м³', 'sat.smap': 'SMAP L4, травень–вересень',
    'sat.soilNote': 'Середнє з 10 знімків за сезон NASA SMAP (сітка 9 км).',
    'sat.footnote': 'Супутник вимірює цілу клітинку 10 км, а не саме ваше поле. Дощомір чи датчик вологості на фермі точніші для однієї точки — найкраще поєднувати обидва.',
    'cmp.title': 'Варіанти сівозміни для вашого поля: {n}',
    'cmp.subtitle': 'Те, що росте зараз, порівняно з трьома альтернативами. Бал від 0 до 100 показує, наскільки варіант підходить під ваші пріоритети: що більше, то краще.',
    'cmp.normal': 'Типовий рік', 'cmp.dry': 'Сухий рік (як {year})', 'cmp.wet': 'Вологий рік',
    'cmp.current': 'Поточна', 'cmp.option': 'Варіант {id}', 'cmp.best': 'Найкраще під ваші пріоритети', 'cmp.why': 'Чому цей варіант →',
    'score.water': 'Використання води', 'score.soil_health': "Здоров'я ґрунту", 'score.erosion': 'Захист від ерозії',
    'score.pest_break': 'Розрив циклу шкідників', 'score.income': 'Дохід', 'score.climate_risk': 'Стійкість до погоди',
    'cal.year': 'Рік {n}',
    'plan.title': 'Коли сіяти і збирати',
    'plan.note': 'Типові строки для ферм США, а не саме для цього поля. Уточніть їх під свою погоду і насіння.',
    'plan.early': 'Початок {m}', 'plan.mid': 'Середина {m}', 'plan.late': 'Кінець {m}',
    'plan.sow': 'посів', 'plan.harvest': 'збір урожаю', 'plan.end': 'знищення',
    'det.back': '← Усі варіанти', 'det.current': 'Поточна', 'det.why': 'Чому ми це пропонуємо', 'det.evidence': 'Докази із зібраних даних',
    'det.benefits': 'Можливі переваги', 'det.gaps': 'Чого ми не знаємо', 'det.check': 'Перевірте з місцевим експертом',
    'det.bare': 'Голий ґрунт: близько {n} міс. на рік', 'det.print': 'Друкувати або зберегти як PDF',
    'det.reportFor': 'Звіт Field Shift · {place}',
  },
}

const LangContext = createContext(null)

function savedLang() {
  try {
    return localStorage.getItem('lang') === 'uk' ? 'uk' : 'en'
  } catch {
    return 'en' // в приватному режимі localStorage може не працювати
  }
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(savedLang)

  function setLang(newLang) {
    setLangState(newLang)
    try {
      localStorage.setItem('lang', newLang)
    } catch {
      // ну значить не запам'ятаємо
    }
  }

  // підставляє значення замість {n}. Масиви (місяці) віддає як є
  function t(key, vars = {}) {
    let text = DICT[lang][key] ?? DICT.en[key] ?? key
    if (typeof text !== 'string') return text
    for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, value)
    return text
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
