import { useLang } from '../i18n'

const SCORE_KEYS = ['water', 'soil_health', 'erosion', 'pest_break', 'income', 'climate_risk']

export default function ScoreBars({ scores }) {
  const { t } = useLang()
  return (
    <div>
      {SCORE_KEYS.map((key) => (
        <div className="score-row" key={key}>
          <div className="score-head">
            <span>{t(`score.${key}`)}</span>
            <span className="muted">{scores[key]}</span>
          </div>
          <div className="score-track">
            <div className="score-fill" style={{ width: `${scores[key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
