import { useLang } from '../i18n'
import CompareWords from '../components/CompareWords'
import PlantingPlan from '../components/PlantingPlan'
import RotationCalendar from '../components/RotationCalendar'

// Сторінка після аналізу: одна порада простими словами, решта за кнопками
export default function ResultPage({ field, strategies, setPage, openDetails }) {
  const { t } = useLang()
  const current = strategies[0]
  const best = strategies.find((s) => s.best_match) || current
  const { explanation } = best

  return (
    <>
      <div className="page-title">
        <h1>{t('res.title')}</h1>
        <p className="muted">{field.location.area || t('cond.selected')} · {field.location.lat.toFixed(4)}, {field.location.lon.toFixed(4)}</p>
      </div>

      {field.warnings?.map((w) => <div className="banner" key={w}>{w}</div>)}

      <div className="card result-card">
        <span className="tag green">{t('res.best')}</span>
        <h2 className="result-name">{best.name}</h2>
        <p className="muted">{best.is_current ? t('res.keep') : t('res.instead', { name: current.name })}</p>

        {/* зліва чому, справа порівняння з тим, що росте зараз */}
        <div className="result-grid">
          <div>
            <h3>{t('res.why')}</h3>
            <p>{explanation.why}</p>
            {}
            <ul>{explanation.benefits.map((r) => <li key={r}>{r}</li>)}</ul>
          </div>
          <div>
            {!best.is_current && (
              <>
                <h3>{t('res.vsNow')}</h3>
                <CompareWords strategy={best} current={current} />
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <RotationCalendar calendar={best.calendar} />
        </div>
        <PlantingPlan calendar={best.calendar} />

        <div className="button-row">
          <button className="button" onClick={() => openDetails(best.id)}>{t('res.details')}</button>
          <button className="button secondary" onClick={() => setPage('compare')}>{t('res.allOptions')}</button>
          <button className="link-button" onClick={() => setPage('conditions')}>{t('res.aboutField')} →</button>
        </div>
      </div>
    </>
  )
}
