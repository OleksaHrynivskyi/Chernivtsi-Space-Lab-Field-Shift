import { useLang } from '../i18n'

// Календар сівозміни: рядок на кожен рік, смуги культур по місяцях.
// З бекенду приходить calendar = [{year, crop, name, kind, start, end}], start/end це місяці 1..13.

export const CROP_COLORS = {
  corn: '#c9a227',
  soybean: '#3f6b3a',
  winter_wheat: '#b5895a',
  spring_wheat: '#b5895a',
  oats: '#a3a86b',
  sorghum: '#a1392b',
  sunflower: '#e0b43a',
  cotton: '#8c8c8c',
  alfalfa: '#6a8f4e',
  cereal_rye: '#7d6b4f',
  clover: '#9b5d7a',
  barley: '#d4a76a',
  canola: '#e8d44d',
  peanuts: '#8d6e4f',
  dry_beans: '#6b8e9b',
}

// основна культура суцільним кольором, покривна штриховкою
function barFill(crop, kind) {
  const color = CROP_COLORS[crop] || '#999999'
  if (kind !== 'cover') return color
  return `repeating-linear-gradient(135deg, ${color} 0 3px, ${color}40 3px 6px)`
}

// compact: для вузьких карток місяці однією літерою, інакше злипаються
export default function RotationCalendar({ calendar, compact = false }) {
  const { t } = useLang()
  const years = Math.max(...calendar.map((bar) => bar.year))
  // культури для легенди, без повторів
  const crops = [...new Map(calendar.map((bar) => [bar.crop, { name: bar.name, kind: bar.kind }])).entries()]

  return (
    <div className="calendar">
      {Array.from({ length: years }, (_, i) => i + 1).map((year) => (
        <div className="calendar-row" key={year}>
          <span className="calendar-label">{t('cal.year', { n: year })}</span>
          {}
          <div className="calendar-track">
            {calendar.filter((bar) => bar.year === year).map((bar, i) => (
              <div
                key={i}
                className="calendar-bar"
                title={bar.name}
                style={{
                  left: `${((bar.start - 1) / 12) * 100}%`,
                  width: `${((bar.end - bar.start) / 12) * 100}%`,
                  background: barFill(bar.crop, bar.kind),
                }}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="calendar-months">
        {t('months').map((m) => <span key={m}>{compact ? m[0] : m}</span>)}
      </div>
      <div className="legend calendar-legend">
        {crops.map(([id, crop]) => (
          <span key={id}><span className="legend-dot" style={{ background: barFill(id, crop.kind) }} />{crop.name}</span>
        ))}
      </div>
    </div>
  )
}
