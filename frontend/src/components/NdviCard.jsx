import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useLang } from '../i18n'
import { rainText } from '../units'
import { CROP_COLORS } from './RotationCalendar'

// Картка NDVI (NASA MODIS): пік рослинності за кожен сезон.
// Колір стовпця = культура того року, кольори ті самі, що в календарі.

const NO_CROP_COLOR = '#d3cdc1' // рік, коли росло щось не з нашого списку

function barColor(crop) {
  if (!crop) return NO_CROP_COLOR
  return CROP_COLORS[crop.split('+')[0]] || NO_CROP_COLOR // якщо два врожаї, беремо колір першої
}

// підказка при наведенні
function NdviTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{row.year}</strong> · {row.crop_name || '—'}<br />
      NDVI {row.peak.toFixed(2)}
    </div>
  )
}

export default function NdviCard({ ndvi, status, typicalRain }) {
  const { t, lang } = useLang()

  if (!ndvi) {
    return (
      <div className="card">
        <h2>{t('ndvi.title')}</h2>
        <p className="muted">{status === 'error' ? t('ndvi.error') : t('ndvi.loading')}</p>
      </div>
    )
  }

  const weak = ndvi.weakest
  const weakRow = weak && ndvi.years.find((y) => y.year === weak.year)
  // культури для легенди, без повторів
  const legend = [...new Map(ndvi.years.map((y) => [y.crop_name || '—', barColor(y.crop)])).entries()]

  return (
    <div className="card">
      <h2>{t('ndvi.title')}</h2>
      <p className="card-subtitle">{t('ndvi.subtitle')}</p>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={ndvi.years} margin={{ top: 20, right: 8, left: 8, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="#e2ded5" />
          <XAxis dataKey="year" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tick={{ fontSize: 12 }}
            label={{ value: t('ndvi.axis'), angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
          <Tooltip content={<NdviTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Bar dataKey="peak" radius={[4, 4, 0, 0]}>
            {ndvi.years.map((y) => <Cell key={y.year} fill={barColor(y.crop)} />)}
            {/* підпис тільки над найслабшим роком */}
            <LabelList dataKey="year" position="top"
              formatter={(year) => (weak && year === weak.year ? `−${weak.drop_pct}%` : '')}
              style={{ fontSize: 12, fontWeight: 600, fill: '#1f2421' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="legend" style={{ flexWrap: 'wrap', gap: '8px 16px', marginLeft: 60 }}>
        {legend.map(([name, color]) => (
          <span key={name}><span className="legend-dot" style={{ background: color }} />{name}</span>
        ))}
      </div>

      <p style={{ marginTop: 16 }}>
        {weak
          ? <>
              <strong>{t('ndvi.weak', { year: weak.year, crop: (weakRow?.crop_name || '').toLowerCase(), drop: weak.drop_pct })}</strong>
              {weak.rain_mm ? ' ' + t('ndvi.rain', { rain: rainText(weak.rain_mm, lang), typical: rainText(typicalRain, lang) }) : ''}
            </>
          : t('ndvi.steady')}
      </p>
      <p className="small muted">{t('ndvi.note')}</p>
    </div>
  )
}
