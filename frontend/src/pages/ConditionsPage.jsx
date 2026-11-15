import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import NdviCard from '../components/NdviCard'
import SatelliteCard from '../components/SatelliteCard'
import { useLang } from '../i18n'
import { gddBase, gddValue, heatThreshold, rainText, rainUnit, rainValue, tempUnit, tempValue } from '../units'

// кольори стовпців: поле під культурою або голе
const COVER_COLOR = '#3f6b3a'
const BARE_COLOR = '#cdb48a'

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function StatCard({ label, value, note, water }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className={'stat-value' + (water ? ' water' : '')}>{value}</div>
      <div className="stat-note">{note}</div>
    </div>
  )
}

// в які місяці першого року поле вкрите (як на бекенді: культура стоїть хоча б пів місяця)
function coveredMonths(calendar) {
  return EN_MONTHS.map((_, i) => {
    const month = i + 1
    const overlap = calendar
      .filter((bar) => bar.year === 1)
      .reduce((sum, bar) => sum + Math.max(0, Math.min(bar.end, month + 1) - Math.max(bar.start, month)), 0)
    return overlap >= 0.5
  })
}

export default function ConditionsPage({ field, current, ndviStatus }) {
  const { t, lang } = useLang()
  const { climate, soil, location } = field
  const covered = coveredMonths(current.calendar)
  const bareCount = covered.filter((c) => !c).length

  // з бекенду дата приходить як "Apr 22", українською робимо "22 квітня"
  function frostDate(text) {
    if (lang !== 'uk') return text
    const [month, day] = text.split(' ')
    return `${day} ${t('monthsOf')[EN_MONTHS.indexOf(month)]}`
  }

  // попередження збираємо з даних
  const warnings = []
  if (climate.late_frost_years_per_10 >= 2) {
    warnings.push({ title: t('watch.frost'), text: t('watch.frostText', { n: climate.late_frost_years_per_10 }) })
  }
  if (bareCount >= 4) {
    warnings.push({ title: t('watch.bare'), text: t('watch.bareText', { n: bareCount }), high: bareCount >= 6 })
  }
  if (climate.heat_days_35c >= 3) {
    warnings.push({ title: t('watch.heat'), text: t('watch.heatText', { n: climate.heat_days_35c, t: heatThreshold(lang) }) })
  }
  // NDVI: рік, коли культура була слабша на 10% і більше
  const weak = field.ndvi?.weakest
  if (weak && weak.drop_pct >= 10) {
    const crop = field.ndvi.years.find((y) => y.year === weak.year)?.crop_name || ''
    warnings.push({ title: t('watch.ndvi', { year: weak.year }), text: t('watch.ndviText', { year: weak.year, crop: crop.toLowerCase(), drop: weak.drop_pct }) })
  }
  if (climate.trends.season_rain_mm_per_decade < -5) {
    warnings.push({ title: t('watch.rain'), text: t('watch.rainText', { n: rainText(climate.trends.season_rain_mm_per_decade, lang) }) })
  }

  const monthNames = t('months')
  const months = climate.monthly.map((m) => ({
    name: monthNames[m.month - 1],
    rain: rainValue(m.rain_mm, lang),
    temp: tempValue(m.tavg, lang),
  }))

  return (
    <>
      <div className="page-title-row">
        <div>
          <h1>{t('cond.title')}</h1>
          <p className="muted">{location.area || t('cond.selected')} · {location.lat.toFixed(4)}, {location.lon.toFixed(4)}</p>
        </div>
        <p className="muted">{t('cond.current', { name: current.name })}</p>
      </div>
      {field.warnings?.map((w) => <div className="banner" key={w}>{w}</div>)}

      <div className="grid-5">
        <StatCard
          label={t('cond.frost')}
          value={climate.last_spring_frost ? t('cond.days', { n: climate.frost_free_days }) : t('cond.allYear')}
          note={climate.last_spring_frost
            ? t('cond.frostDates', { from: frostDate(climate.last_spring_frost), to: frostDate(climate.first_fall_frost) })
            : t('cond.frostRare')}
        />
        <StatCard label={t('cond.gdd')} value={gddValue(climate.gdd_base10, lang).toLocaleString('en-US')} note={t('cond.gddNote', { base: gddBase(lang) })} />
        <StatCard label={t('cond.rain')} value={rainText(climate.season_rain_mm, lang)} note={t('cond.rainNote')} water />
        <StatCard label={t('cond.heat')} value={climate.heat_days_35c} note={t('cond.heatNote', { t: heatThreshold(lang) })} />
        <StatCard
          label={t('cond.soil')}
          value={soil ? soil.name : '—'}
          note={soil ? t('cond.soilNote', { om: soil.organic_matter_pct, slope: soil.slope_pct }) : t('cond.noSoil')}
        />
      </div>

      <div className="card">
        <h2>{t('cond.yearTitle')}</h2>
        <p className="card-subtitle">{t('cond.yearSubtitle', { source: climate.source })}</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={months} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2ded5" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="rain" label={{ value: t('cond.rainAxis', { u: rainUnit(lang) }), angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="temp" orientation="right" label={{ value: t('cond.tempAxis', { u: tempUnit(lang) }), angle: 90, position: 'insideRight' }} />
            <Tooltip />
            {/* зелений стовпець: поле під культурою, бежевий: голе */}
            <Bar yAxisId="rain" dataKey="rain" name={t('cond.rainSeries', { u: rainUnit(lang) })}>
              {covered.map((isCovered, i) => <Cell key={i} fill={isCovered ? COVER_COLOR : BARE_COLOR} />)}
            </Bar>
            <Line yAxisId="temp" dataKey="temp" name={t('cond.tempSeries', { u: tempUnit(lang) })} stroke="#1f2421" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="legend" style={{ marginLeft: 60, marginTop: 8 }}>
          <span><span className="legend-dot" style={{ background: BARE_COLOR }} />{t('cond.bare', { n: bareCount })}</span>
          <span><span className="legend-dot" style={{ background: COVER_COLOR }} />{t('cond.cover')}</span>
          <span>{t('cond.year1')}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>{t('watch.title')}</h2>
        <p className="card-subtitle">{t('watch.subtitle')}</p>
        {warnings.length === 0 && <p className="muted">{t('watch.none')}</p>}
        <div className="watch-grid">
          {warnings.map((w) => (
            <div className={'watch-item' + (w.high ? ' high' : '')} key={w.title}>
              <h3>{w.title}</h3>
              <p className="small muted">{w.text}</p>
            </div>
          ))}
        </div>
      </div>

      {}
      <div style={{ marginTop: 24 }}>
        <NdviCard ndvi={field.ndvi} status={ndviStatus} typicalRain={climate.season_rain_mm} />
      </div>

      {}
      <div style={{ marginTop: 24 }}>
        <SatelliteCard lat={location.lat} lon={location.lon} powerRain={climate.series.season_rain} />
      </div>
    </>
  )
}
