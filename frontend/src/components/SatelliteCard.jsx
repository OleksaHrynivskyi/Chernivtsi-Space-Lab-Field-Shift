import { useEffect, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getSatellite } from '../api'
import { useLang } from '../i18n'
import { rainUnit, rainValue } from '../units'

// Порівнюємо модель NASA POWER із супутниками (GPM IMERG, SMAP).
// В челенджі просили пояснити різницю між супутниковими даними і рештою.
export default function SatelliteCard({ lat, lon, powerRain }) {
  const { t, lang } = useLang()
  const [data, setData] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setData(null)
    setFailed(false)
    getSatellite(lat, lon)
      .then(setData)
      .catch((e) => {
        console.warn('Satellite data not available:', e.message)
        setFailed(true)
      })
  }, [lat, lon])

  return (
    <div className="card">
      <h2>{t('sat.title')}</h2>
      <p className="card-subtitle">{t('sat.teaser')}</p>
      {failed && <p className="muted">{t('sat.error')}</p>}
      {!failed && !data && <p className="muted">{t('sat.loading')}</p>}
      {data && <SatelliteCharts data={data} powerRain={powerRain} t={t} lang={lang} />}
    </div>
  )
}

function SatelliteCharts({ data, powerRain, t, lang }) {
  // зводимо по роках: опади з POWER і з IMERG
  const imerg = Object.fromEntries(data.imerg_season_rain.map((r) => [r.year, r.value]))
  const rainRows = powerRain.filter((r) => imerg[r.year] !== undefined)
    .map((r) => ({ year: r.year, power: r.value, imerg: imerg[r.year] }))
  const meanOf = (key) => rainRows.reduce((sum, r) => sum + r[key], 0) / rainRows.length
  const difference = rainRows.length ? Math.round(((meanOf('imerg') - meanOf('power')) / meanOf('power')) * 100) : 0
  // для графіка в дюймах або мм, залежно від мови
  const chartRows = rainRows.map((r) => ({ year: r.year, power: rainValue(r.power, lang), imerg: rainValue(r.imerg, lang) }))

  return (
    <>
      <div className="grid-2-equal">
        <div>
          <h3>{t('sat.rainTitle', { u: rainUnit(lang) })}</h3>
          {rainRows.length === 0 ? (
            <p className="muted small">{t('sat.partial')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartRows} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2ded5" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line dataKey="power" name={t('sat.power')} stroke="#1f2421" dot={false} />
                  <Line dataKey="imerg" name={t('sat.imerg')} stroke="#2f6690" dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="small">{t(difference >= 0 ? 'sat.more' : 'sat.less', { p: Math.abs(difference) })}</p>
            </>
          )}
        </div>
        <div>
          <h3>{t('sat.soilTitle')}</h3>
          {data.smap_season_soil.length === 0 ? (
            <p className="muted small">{t('sat.partial')}</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.smap_season_soil} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2ded5" />
                  <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line dataKey="value" name={t('sat.smap')} stroke="#3f6b3a" dot />
                </LineChart>
              </ResponsiveContainer>
              <p className="small">{t('sat.soilNote')}</p>
            </>
          )}
        </div>
      </div>
      <p className="small muted" style={{ marginTop: 16 }}>{t('sat.footnote')}</p>
    </>
  )
}
