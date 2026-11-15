import PlantingPlan from '../components/PlantingPlan'
import ScoreBars from '../components/ScoreBars'
import RotationCalendar from '../components/RotationCalendar'
import { useLang } from '../i18n'

export default function DetailsPage({ field, strategy, setPage }) {
  const { t } = useLang()
  const { explanation } = strategy

  return (
    <>
      <button className="link-button no-print" onClick={() => setPage('compare')}>{t('det.back')}</button>
      {/* цей рядок видно тільки при друку */}
      <p className="print-only muted">
        {t('det.reportFor', { place: field.location.area || t('cond.selected') })} · {field.location.lat.toFixed(4)}, {field.location.lon.toFixed(4)}
      </p>
      <h1 style={{ margin: '16px 0 24px' }}>
        {strategy.is_current ? t('det.current') : strategy.id} · {strategy.name}
      </h1>

      <div className="details-grid">
        <div className="card">
          <div className="section">
            <h2>{t('det.why')}</h2>
            <p>{explanation.why}</p>
          </div>

          {}
          <div className="section">
            <h2>{t('det.evidence')}</h2>
            {explanation.evidence.map((e) => (
              <div className="evidence-row" key={e.text}>
                <span>{e.text}</span>
                <span className="evidence-tags">
                  <span className="tag">{e.source}</span> <span className="tag">{e.confidence}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="section">
            <PlantingPlan calendar={strategy.calendar} />
          </div>

          <div className="section two-columns">
            <div>
              <h2>{t('det.benefits')}</h2>
              <ul>{explanation.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
              <h2 style={{ marginTop: 24 }}>{t('det.gaps')}</h2>
              <ul>{explanation.gaps.map((g) => <li key={g}>{g}</li>)}</ul>
            </div>
            <div className="check-local">
              <h2>{t('det.check')}</h2>
              <ul>{explanation.check_locally.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          </div>
        </div>

        <div className="card sticky">
          <div className="total-score">{strategy.total_score} <span>/ 100</span></div>
          <p className="small muted" style={{ marginBottom: 16 }}>{t('det.bare', { n: strategy.bare_months_per_year })}</p>
          <ScoreBars scores={strategy.scores} />
          <div style={{ margin: '16px 0' }}>
            <RotationCalendar calendar={strategy.calendar} />
          </div>
          <button className="button secondary full no-print" onClick={() => window.print()}>{t('det.print')}</button>
        </div>
      </div>
    </>
  )
}
