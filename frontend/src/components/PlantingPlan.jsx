import { useLang } from '../i18n'

// "Коли сіяти і збирати": той самий календар, тільки словами.
// Початок смуги це посів, кінець це збір. Якщо смуга починається 1 січня
// або закінчується 31 грудня, то це продовження з іншого року, такі краї пропускаємо.

// 5.45 -> "Середина травня"
function whenText(value, t) {
  const month = Math.floor(value + 0.001)
  const day = Math.round((value - month) * 31) + 1
  const key = day <= 10 ? 'plan.early' : day <= 20 ? 'plan.mid' : 'plan.late'
  return t(key, { m: t('monthsOf')[month - 1] })
}

function yearEvents(calendar, year) {
  const events = []
  for (const bar of calendar.filter((b) => b.year === year)) {
    if (bar.start > 1) events.push({ at: bar.start, action: 'plan.sow', name: bar.name })
    if (bar.end < 13) {
      // бекенд додає 1/31 до дати збору, тут віднімаємо назад
      events.push({ at: bar.end - 1 / 31, action: bar.kind === 'cover' ? 'plan.end' : 'plan.harvest', name: bar.name })
    }
  }
  return events.sort((a, b) => a.at - b.at)
}

export default function PlantingPlan({ calendar }) {
  const { t } = useLang()
  const years = Math.max(...calendar.map((bar) => bar.year))

  return (
    <div className="plan">
      <h3>{t('plan.title')}</h3>
      <div className="plan-grid">
        {Array.from({ length: years }, (_, i) => i + 1).map((year) => (
          <div className="plan-year" key={year}>
            <h4>{t('cal.year', { n: year })}</h4>
            <ul>
              {yearEvents(calendar, year).map((e) => (
                <li key={e.at + e.action + e.name}>
                  <strong>{whenText(e.at, t)}</strong> — {t(e.action)}: {e.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="small muted">{t('plan.note')}</p>
    </div>
  )
}
