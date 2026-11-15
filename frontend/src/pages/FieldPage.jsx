import { useState } from 'react'
import FieldMap from '../components/FieldMap'
import AnalyzeProgress from '../components/AnalyzeProgress'
import { DEMO_FIELDS } from '../demoFields'
import { geocode } from '../api'
import { useLang } from '../i18n'
import { insideUS } from '../usBorder'

const PRIORITIES = ['water', 'soil', 'erosion', 'income']
const CONSTRAINTS = ['irrigation', 'livestock', 'small_grain_equipment']

export default function FieldPage({ location, setLocation, priorities, setPriorities, constraints, setConstraints, onAnalyze, loading, error }) {
  const { t } = useLang()
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [searching, setSearching] = useState(false)

  function pick(lat, lon) {
    if (!insideUS(lat, lon)) {
      setMessage(t('field.usOnly'))
      return
    }
    setMessage('')
    setLocation({ lat: +lat.toFixed(4), lon: +lon.toFixed(4) }) // 4 знаки після коми це десь 10 м
  }

  // якщо ввели "42.10, -93.55", то це координати, інакше шукаємо за назвою
  async function search() {
    const parts = query.split(',').map((p) => Number(p.trim()))
    if (parts.length === 2 && parts.every((n) => !isNaN(n) && query.trim() !== '')) {
      pick(parts[0], parts[1])
      return
    }
    setSearching(true)
    try {
      const place = await geocode(query)
      if (!place) setMessage(t('field.notFound'))
      else pick(place.lat, place.lon)
    } catch {
      setMessage(t('field.searchDown'))
    }
    setSearching(false)
  }

  const activeDemo = DEMO_FIELDS.find((d) => d.lat === location.lat && d.lon === location.lon)
  const label = `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`

  return (
    <>
      <div className="page-title">
        <h1>{t('field.title')}</h1>
        <p className="muted">{t('field.subtitle')}</p>
        {}
        <ol className="howto">
          {t('field.howto').map((step) => <li key={step}>{step}</li>)}
        </ol>
      </div>

      <div className="grid-2">
        <div>
          <div className="search-row">
            <input
              className="input"
              placeholder={t('field.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <button className="button secondary" onClick={search} disabled={searching || !query.trim()}>
              {searching ? t('field.searching') : t('field.searchButton')}
            </button>
          </div>
          {message && <p className="error">{message}</p>}
          <div className="chips">
            {DEMO_FIELDS.map((demo) => (
              <button
                key={demo.id}
                className={'chip' + (activeDemo?.id === demo.id ? ' active' : '')}
                onClick={() => pick(demo.lat, demo.lon)}
              >
                {t(`demo.${demo.id}`)}
              </button>
            ))}
          </div>
          <div className="card map-card">
            <FieldMap lat={location.lat} lon={location.lon} label={label} onPick={pick} />
          </div>
        </div>

        <div className="card">
          <h2>{t('field.prioritiesTitle')}</h2>
          <p className="card-subtitle">{t('field.prioritiesHint')}</p>
          {PRIORITIES.map((key) => (
            <div className="slider-row" key={key}>
              <div className="slider-head">
                <h3>{t(`priority.${key}`)}</h3>
                <span className="muted small">{priorities[key]} / 5</span>
              </div>
              <p className="small muted">{t(`priority.${key}.hint`)}</p>
              <input
                type="range" min="1" max="5" step="1"
                value={priorities[key]}
                onChange={(e) => setPriorities({ ...priorities, [key]: Number(e.target.value) })}
              />
            </div>
          ))}

          {CONSTRAINTS.map((key) => (
            <label className="toggle-row" key={key}>
              <span>{t(`constraint.${key}`)}</span>
              <input
                type="checkbox"
                checked={constraints[key]}
                onChange={(e) => setConstraints({ ...constraints, [key]: e.target.checked })}
              />
            </label>
          ))}

          <button className="button full" style={{ marginTop: 16 }} onClick={onAnalyze} disabled={loading}>
            {loading ? t('field.loading') : t('field.analyze')}
          </button>
          {loading && <AnalyzeProgress />}
          {/* no_field: тут нема поля, показуємо причину з бекенду */}
          {error && error.code === 'no_field' && <div className="banner" style={{ marginTop: 16 }}>{error.message}</div>}
          {error && error.code === 'backend_down' && <p className="error">{t('field.backendDown')}</p>}
          {error && !['no_field', 'backend_down'].includes(error.code) && <p className="error">{t('field.error', { error: error.message })}</p>}
        </div>
      </div>
    </>
  )
}
