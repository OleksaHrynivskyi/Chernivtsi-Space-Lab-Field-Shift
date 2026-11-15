import { useLang } from '../i18n'

// Текст сторінки двома мовами
const CONTENT = {
  en: {
    title: 'How it works',
    intro: 'Field Shift compares crop rotations for one field using public NASA, USDA and FAO data.',
    stepsTitle: 'Steps',
    steps: [
      'We read 25 years (2001–2025) of daily weather for your point from NASA POWER and turn it into frost dates, heat days, rainfall and trends.',
      'We read your soil (organic matter, slope, erosion factor) from USDA SSURGO.',
      'We detect your current rotation from USDA Cropland Data Layer maps of the last 10 years.',
      'We take crop water needs for your field from FAO GAEZ (2011–2040, mean of 5 climate models).',
      'We check the model against NASA satellites: GPM IMERG rainfall since 2001 and SMAP root-zone soil moisture since 2016.',
      'We measure how green your field was each season with NASA MODIS NDVI (250 m pixel, 2016–2025) and compare each year with other years of the same crop.',
      'We build three alternatives and score all options from 0 to 100 on six criteria, weighted by your priorities.',
    ],
    scoresTitle: 'How the scores work',
    scores: [
      ['Water use', 'how much water each crop needs on this field and how much it would be short without irrigation, from FAO GAEZ (2011–2040, mean of 5 climate models). In a dry year the shortfall grows by the missing rain from NASA POWER.'],
      ['Soil health', 'crop residue, nitrogen-fixing legumes and months with living cover.'],
      ['Erosion control', 'months the soil is covered, weighted by slope, heavy-rain days and how easily the soil washes away (USDA K factor).'],
      ['Pest break', 'how many different crop families the rotation has.'],
      ['Income', 'USDA NASS yields and prices when available, otherwise a team estimate; cover crops add seed costs.'],
      ['Weather resilience', "how big the water shortfall is compared with the crop's need (FAO GAEZ), plus heat tolerance; in the dry-year scenario water counts double."],
    ],
    scoresNote: 'The dry and wet year scenarios use the 20% driest and wettest seasons from 25 years (2001–2025) of NASA POWER data. Crop water numbers are model estimates from FAO GAEZ on a ~9 km grid; they assume deep, good soil, so sandy fields may run short sooner. We also show FAO GAEZ values for 2041–2070 to help plan for a changing climate.',
    periodsTitle: 'Which years we use and why',
    periodsIntro: 'Climate needs a long period to be reliable; the state of your field needs recent years.',
    periods: [
      ['Climate: NASA POWER, satellite rain GPM IMERG', '2001–2025', 'Long enough for dry/wet years and trends; the same years for model and satellite.'],
      ['Your field now: crops (USDA CDL), vegetation (NASA MODIS NDVI), soil moisture (NASA SMAP), yields and prices (USDA NASS)', '2016–2025', 'The last 10 years show what you grow and what it earns today.'],
      ['Crop water needs: FAO GAEZ', '2011–2040 and 2041–2070', 'Climate-model estimates: today and the coming decades.'],
      ['Soil: USDA SSURGO', '—', 'Soil properties barely change from year to year.'],
    ],
    satTitle: 'Satellite and model data vs. field measurements',
    sat: 'Satellites and models cover every field, but they average over areas from 30 m to 50 km and can miss local details. Ground measurements, like a rain gauge or a soil test on your farm, are more exact for one spot. The best picture comes from combining both.',
    glossaryTitle: 'Glossary',
    glossary: [
      ['Soil moisture anomaly', 'How much wetter or drier the soil is than its usual level for that time of year. A negative anomaly in summer is an early sign of drought stress.'],
      ['Water balance', 'Rain plus water stored in the soil, minus what the crop uses. A negative balance means the crop may run short of water without irrigation.'],
      ['Growing degree days (GDD)', 'Heat a crop gets over the season: each day adds the average temperature minus 10 °C. Crops need a certain total to mature.'],
      ['Frost-free season', 'Days between the last spring frost and the first fall frost (minimum temperature at or below 0 °C).'],
      ['Evapotranspiration (ET)', 'Water that leaves the field as vapour from soil and plant leaves. More ET means the crop needs more water.'],
      ['Root-zone soil moisture', 'How much water is in the soil where roots grow, in m³ of water per m³ of soil. Measured by the NASA SMAP satellite on a 9 km grid.'],
      ['NDVI', 'A satellite index of how green and dense plants are, from 0 (bare soil) to about 0.9 (dense green crop). A season peak lower than usual for the same crop can mean drought, hail, disease or late planting.'],
      ['Cover crop', 'A crop grown between cash crops to protect and feed the soil, not for sale.'],
      ['Nitrogen-fixing crop', 'Legumes like soybean, clover and alfalfa take nitrogen from the air and leave some for the next crop.'],
    ],
    limitsTitle: 'Limits of this tool',
    limits: 'Scores are simple rules based on public data and typical crop traits. They do not know your equipment, contracts, pests or local markets. Use them to start a conversation with your agronomist or extension office, not as a final answer.',
  },
  uk: {
    title: 'Як це працює',
    intro: 'Field Shift порівнює сівозміни для одного поля на основі відкритих даних NASA, USDA і FAO.',
    stepsTitle: 'Кроки',
    steps: [
      'Беремо 25 років (2001–2025) щоденної погоди для вашої точки з NASA POWER і рахуємо дати заморозків, дні спеки, опади й тренди.',
      'Беремо дані про ваш ґрунт (органічна речовина, схил, схильність до ерозії) з USDA SSURGO.',
      'Визначаємо поточну сівозміну за картами USDA Cropland Data Layer за останні 10 років.',
      'Беремо потребу культур у воді для вашого поля з FAO GAEZ (2011–2040, середнє 5 кліматичних моделей).',
      'Перевіряємо модель супутниками NASA: опади GPM IMERG з 2001 року і вологість кореневої зони SMAP з 2016 року.',
      'Вимірюємо, наскільки зеленим було ваше поле кожного сезону, за NASA MODIS NDVI (піксель 250 м, 2016–2025), і порівнюємо кожен рік з іншими роками тієї ж культури.',
      'Складаємо три альтернативи і оцінюємо всі варіанти від 0 до 100 за шістьма критеріями з урахуванням ваших пріоритетів.',
    ],
    scoresTitle: 'Як рахуються бали',
    scores: [
      ['Використання води', 'скільки води потребує кожна культура на цьому полі і скільки їй бракуватиме без зрошення, за FAO GAEZ (2011–2040, середнє 5 кліматичних моделей). У сухий рік дефіцит зростає на нестачу дощу за даними NASA POWER.'],
      ["Здоров'я ґрунту", 'рослинні рештки, бобові культури, що фіксують азот, і місяці, коли поле вкрите рослинами.'],
      ['Захист від ерозії', 'скільки місяців ґрунт вкритий, з урахуванням схилу, днів зі зливами і того, наскільки легко ґрунт змивається (фактор K, USDA).'],
      ['Розрив циклу шкідників', 'скільки різних родин культур у сівозміні.'],
      ['Дохід', 'урожайність і ціни USDA NASS, якщо вони є, інакше — оцінка команди; покривні культури додають витрати на насіння.'],
      ['Стійкість до погоди', 'наскільки великий дефіцит води порівняно з потребою культури (FAO GAEZ), плюс стійкість до спеки; у сценарії сухого року вода важить удвічі більше.'],
    ],
    scoresNote: 'Сценарії сухого і вологого року — це 20% найсухіших і найвологіших сезонів за 25 років (2001–2025) даних NASA POWER. Потреба культур у воді — модельна оцінка FAO GAEZ на сітці ~9 км; вона припускає глибокий хороший ґрунт, тож на піщаних полях води може забракнути раніше. Ми також показуємо значення FAO GAEZ на 2041–2070 роки, щоб допомогти планувати під зміну клімату.',
    periodsTitle: 'Які роки ми використовуємо і чому',
    periodsIntro: 'Клімату потрібен довгий період, щоб бути надійним; стану поля — останні роки.',
    periods: [
      ['Клімат: NASA POWER, супутникові опади GPM IMERG', '2001–2025', 'Досить довго для сухих/вологих років і трендів; ті самі роки для моделі й супутника.'],
      ['Ваше поле зараз: культури (USDA CDL), рослинність (NASA MODIS NDVI), вологість ґрунту (NASA SMAP), урожайність і ціни (USDA NASS)', '2016–2025', 'Останні 10 років показують, що ви вирощуєте і скільки це приносить сьогодні.'],
      ['Потреба культур у воді: FAO GAEZ', '2011–2040 і 2041–2070', 'Оцінки кліматичних моделей: сьогодення і наступні десятиліття.'],
      ['Ґрунт: USDA SSURGO', '—', 'Властивості ґрунту майже не змінюються з року в рік.'],
    ],
    satTitle: 'Супутникові й модельні дані проти вимірювань на полі',
    sat: 'Супутники й моделі покривають кожне поле, але усереднюють площу від 30 м до 50 км і можуть пропустити місцеві деталі. Вимірювання на землі, як-от дощомір чи аналіз ґрунту на вашій фермі, точніші для однієї точки. Найкраще поєднувати обидва.',
    glossaryTitle: 'Словник термінів',
    glossary: [
      ['Аномалія вологості ґрунту', 'Наскільки ґрунт вологіший або сухіший, ніж зазвичай у цю пору року. Від\'ємна аномалія влітку — ранній сигнал посухи.'],
      ['Водний баланс', 'Дощ плюс вода, запасена в ґрунті, мінус те, що споживає культура. Від\'ємний баланс означає, що без зрошення культурі може забракнути води.'],
      ['Сума ефективних температур (GDD)', 'Скільки тепла культура отримує за сезон: кожен день додає середню температуру мінус 10 °C. Щоб дозріти, культурі потрібна певна сума.'],
      ['Сезон без заморозків', 'Дні між останнім весняним і першим осіннім заморозком (мінімальна температура 0 °C або нижче).'],
      ['Евапотранспірація (ET)', 'Вода, яка випаровується з поля — з ґрунту і листя рослин. Більша ET означає, що культурі потрібно більше води.'],
      ['Вологість кореневої зони', 'Скільки води в ґрунті там, де ростуть корені: м³ води на м³ ґрунту. Вимірює супутник NASA SMAP на сітці 9 км.'],
      ['NDVI', 'Супутниковий індекс того, наскільки рослини зелені й густі: від 0 (голий ґрунт) до близько 0.9 (густа зелена культура). Пік нижчий, ніж зазвичай для тієї ж культури, може означати посуху, град, хворобу чи пізній посів.'],
      ['Покривна культура', 'Культура, яку вирощують між основними, щоб захищати й живити ґрунт, а не на продаж.'],
      ['Азотфіксуюча культура', 'Бобові — соя, конюшина, люцерна — беруть азот з повітря і частину залишають наступній культурі.'],
    ],
    limitsTitle: 'Обмеження інструмента',
    limits: 'Бали — це прості правила на основі відкритих даних і типових властивостей культур. Вони не знають вашої техніки, контрактів, шкідників чи місцевих ринків. Використовуйте їх, щоб почати розмову з агрономом чи дорадчою службою, а не як остаточну відповідь.',
  },
}

export default function HowItWorks() {
  const { lang } = useLang()
  const c = CONTENT[lang]

  return (
    <div className="stack">
      <div>
        <h1>{c.title}</h1>
        <p className="muted">{c.intro}</p>
      </div>

      <div className="card">
        <h2>{c.stepsTitle}</h2>
        <ol>{c.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      </div>

      <div className="card">
        <h2>{c.scoresTitle}</h2>
        <ul>
          {c.scores.map(([name, text]) => <li key={name}><strong>{name}</strong> — {text}</li>)}
        </ul>
        <p className="small muted" style={{ marginTop: 8 }}>{c.scoresNote}</p>
      </div>

      <div className="card">
        <h2>{c.periodsTitle}</h2>
        <p className="card-subtitle">{c.periodsIntro}</p>
        {c.periods.map(([what, years, why]) => (
          <div className="evidence-row" key={what}>
            <strong style={{ minWidth: 240, maxWidth: 360 }}>{what}</strong>
            <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{years}</span>
            <span className="muted small" style={{ maxWidth: 360 }}>{why}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>{c.satTitle}</h2>
        <p>{c.sat}</p>
      </div>

      <div className="card">
        <h2>{c.glossaryTitle}</h2>
        {c.glossary.map(([term, text]) => (
          <div className="evidence-row" key={term}>
            <strong style={{ minWidth: 240 }}>{term}</strong>
            <span>{text}</span>
          </div>
        ))}
      </div>

      <div className="card check-local">
        <h2>{c.limitsTitle}</h2>
        <p>{c.limits}</p>
      </div>
    </div>
  )
}
