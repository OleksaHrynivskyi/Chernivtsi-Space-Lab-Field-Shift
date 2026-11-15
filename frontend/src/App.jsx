import { useEffect, useRef, useState } from 'react'
import { getField, getNdvi, getSatellite, getStrategies } from './api'
import { useLang } from './i18n'
import { isImperial } from './units'
import Header from './components/Header'
import Footer from './components/Footer'
import FieldPage from './pages/FieldPage'
import ResultPage from './pages/ResultPage'
import ConditionsPage from './pages/ConditionsPage'
import ComparePage from './pages/ComparePage'
import DetailsPage from './pages/DetailsPage'
import HowItWorks from './pages/HowItWorks'

export default function App() {
  const { t, lang } = useLang()
  const units = isImperial(lang) ? 'imperial' : 'metric'

  // сторінки: field, result (порада), compare (варіанти), details (звіт), conditions (статистика), how
  const [page, setPage] = useState('field')
  const [location, setLocation] = useState({ lat: 42.1, lon: -93.55 })
  const [priorities, setPriorities] = useState({ water: 2, soil: 5, erosion: 2, income: 5 })
  const [constraints, setConstraints] = useState({ irrigation: false, livestock: false, small_grain_equipment: false })
  const [scenario, setScenario] = useState('normal')

  const [field, setField] = useState(null)
  const [analyzed, setAnalyzed] = useState(null) // для якої точки і налаштувань зараз завантажені дані
  const [strategies, setStrategies] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [ndviStatus, setNdviStatus] = useState('idle') // loading | done | error

  // фонове завантаження закінчується пізніше, тому тримаємо свіжі значення в ref
  const latest = useRef({})
  latest.current = { analyzed, scenario, lang, units }

  // поки вантажилось, користувач міг відкрити вже інше поле
  function isSameField(params) {
    const now = latest.current.analyzed
    return now && now.lat === params.lat && now.lon === params.lon
  }

  // довантажилось у фоні: оновлюємо поле і варіанти, в доказах з'являться нові рядки
  function refresh(params) {
    if (!isSameField(params)) return
    const now = latest.current
    getField(params.lat, params.lon, now.lang).then(setField)
    getStrategies({ ...now.analyzed, scenario: now.scenario, lang: now.lang, units: now.units }).then(setStrategies)
  }

  // IMERG і SMAP вантажимо у фоні, бо для нового поля це до 2 хвилин
  function loadSatelliteInBackground(params) {
    getSatellite(params.lat, params.lon)
      .then(() => refresh(params))
      .catch(() => {}) // не завантажилось, то буде без цього рядка
  }

  // NDVI теж у фоні, десь хвилина
  function loadNdviInBackground(params) {
    setNdviStatus('loading')
    getNdvi(params.lat, params.lon)
      .then(() => {
        if (!isSameField(params)) return
        setNdviStatus('done')
        refresh(params)
      })
      .catch(() => isSameField(params) && setNdviStatus('error'))
  }

  async function analyze() {
    setLoading(true)
    setError(null)
    try {
      const fieldData = await getField(location.lat, location.lon, lang)
      const strategyList = await getStrategies({ ...location, priorities, constraints, scenario: 'normal', lang, units })
      setField(fieldData)
      setStrategies(strategyList)
      const params = { ...location, priorities, constraints }
      setAnalyzed(params)
      setScenario('normal')
      setPage('result')
      if (!fieldData.satellite) loadSatelliteInBackground(params)
      if (fieldData.ndvi) setNdviStatus('done')
      else loadNdviInBackground(params)
    } catch (e) {
      setError({ message: e.message, code: e.code }) // code: no_field (тут нема поля) або backend_down (сервер лежить)
    }
    setLoading(false)
  }

  async function changeScenario(newScenario) {
    setScenario(newScenario)
    try {
      setStrategies(await getStrategies({ ...analyzed, scenario: newScenario, lang, units }))
    } catch (e) {
      console.error(e)
    }
  }

  // при зміні мови перезапитуємо бекенд, бо пояснення приходять звідти вже перекладені (дані в кеші, це швидко)
  useEffect(() => {
    if (!analyzed) return
    getField(analyzed.lat, analyzed.lon, lang).then(setField).catch(console.error)
    getStrategies({ ...analyzed, scenario, lang, units }).then(setStrategies).catch(console.error)
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  function openDetails(id) {
    setSelectedId(id)
    setPage('details')
  }

  return (
    <>
      <Header page={page} setPage={setPage} hasData={Boolean(field)} />
      <main className="container page">
        {page === 'field' && (
          <FieldPage
            location={location} setLocation={setLocation}
            priorities={priorities} setPriorities={setPriorities}
            constraints={constraints} setConstraints={setConstraints}
            onAnalyze={analyze} loading={loading} error={error}
          />
        )}
        {page === 'result' && strategies && (
          <ResultPage field={field} strategies={strategies} setPage={setPage} openDetails={openDetails} />
        )}
        {page === 'conditions' && field && <ConditionsPage field={field} current={strategies[0]} ndviStatus={ndviStatus} />}
        {page === 'compare' && strategies && (
          <ComparePage strategies={strategies} field={field} scenario={scenario} onScenario={changeScenario} openDetails={openDetails} />
        )}
        {page === 'details' && strategies && (
          <DetailsPage field={field} strategy={strategies.find((s) => s.id === selectedId)} setPage={setPage} />
        )}
        {page === 'how' && <HowItWorks />}
      </main>
      <Footer />
    </>
  )
}
