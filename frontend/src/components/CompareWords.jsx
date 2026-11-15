import { useLang } from '../i18n'
import { compareScore } from '../units'

// Порівняння з поточною сівозміною словами ("Використання води ▲ Краще"), так зрозуміліше, ніж бали.
const KEYS = ['water', 'soil_health', 'erosion', 'income', 'climate_risk']
const ICON = { better: '▲', same: '●', worse: '▼' }

export default function CompareWords({ strategy, current }) {
  const { t } = useLang()
  return (
    <div className="compare-words">
      {KEYS.map((key) => {
        const result = compareScore(strategy.scores[key], current.scores[key])
        return (
          <div className="compare-row" key={key}>
            <span>{t(`score.${key}`)}</span>
            <span className={`compare-value ${result}`}>{ICON[result]} {t(`cmpw.${result}`)}</span>
          </div>
        )
      })}
    </div>
  )
}

