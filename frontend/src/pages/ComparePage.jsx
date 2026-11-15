import ScoreBars from '../components/ScoreBars'
import RotationCalendar from '../components/RotationCalendar'
import { useLang } from '../i18n'

export default function ComparePage({ strategies, field, scenario, onScenario, openDetails }) {
  const { t } = useLang()
  const dryYear = field.climate.year_types.dry[0]
  const scenarios = [
    { id: 'normal', label: t('cmp.normal') },
    { id: 'dry', label: t('cmp.dry', { year: dryYear }) },
    { id: 'wet', label: t('cmp.wet') },
  ]

  return (
    <>
      <div className="page-title">
        <h1>{t('cmp.title', { n: strategies.length })}</h1>
        <p className="muted" style={{ maxWidth: 760 }}>{t('cmp.subtitle')}</p>
        <div className="segmented" style={{ marginTop: 16 }}>
          {scenarios.map((s) => (
            <button key={s.id} className={scenario === s.id ? 'active' : ''} onClick={() => onScenario(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-4">
        {strategies.map((s) => (
          <div className={'card option-card' + (s.best_match ? ' best' : '')} key={s.id}>
            {/* шапка однакової висоти в усіх картках, щоб бали стояли рівно */}
            <div className="option-head">
              <div>
                <span className="tag">{s.is_current ? t('cmp.current') : t('cmp.option', { id: s.id })}</span>{' '}
                {s.best_match && <span className="tag green">{t('cmp.best')}</span>}
              </div>
              <h3>{s.name}</h3>
            </div>
            <div className="total-score">{s.total_score} <span>/ 100</span></div>
            <ScoreBars scores={s.scores} />
            <RotationCalendar calendar={s.calendar} compact />
            <button className="link-button" style={{ textAlign: 'left', marginTop: 'auto' }} onClick={() => openDetails(s.id)}>
              {t('cmp.why')}
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
