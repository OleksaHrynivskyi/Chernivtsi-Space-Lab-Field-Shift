import { useState } from 'react'
import { CircleMarker, MapContainer, Pane, Polygon, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { useLang } from '../i18n'
import { US_POLYGONS } from '../usBorder'

// маска: прямокутник на весь світ з "діркою" у формі США. Все поза США затемнене, бо даних там нема
const WORLD = [[85, -180], [85, 180], [-85, 180], [-85, -180]]
const MASK = [WORLD, ...US_POLYGONS]

// не даємо сильно віддаляти карту, бо Leaflet тоді малює кілька копій світу, а маска є тільки на одній
const MIN_ZOOM = 4
const MAX_ZOOM = 18
const START_ZOOM = 13 // на такому зумі вже видно окремі поля
const MAX_BOUNDS = [[15, -140], [58, -50]]

// підкладка: аерознімки USDA NAIP з підписами доріг. Знімки є до зуму 16, далі Leaflet їх розтягує
const SATELLITE_URL = 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}'

// шари NASA GIBS (як у NASA Worldview). Це просто картинки, числа для розрахунків беремо на бекенді
const NASA_LAYERS = {
  none: null,
  smap: { id: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture', matrix: 'GoogleMapsCompatible_Level6', maxZoom: 6 },
  ndvi: { id: 'MODIS_Terra_NDVI_8Day', matrix: 'GoogleMapsCompatible_Level9', maxZoom: 9 },
  imerg: { id: 'IMERG_Precipitation_Rate', matrix: 'GoogleMapsCompatible_Level6', maxZoom: 6 },
}

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

// коли міняється точка, пересуваємо карту до неї
function FlyTo({ lat, lon }) {
  const map = useMap()
  map.setView([lat, lon], map.getZoom())
  return null
}

export default function FieldMap({ lat, lon, label, onPick }) {
  const { t } = useLang()
  const [layer, setLayer] = useState('none')
  const [date, setDate] = useState('2025-07-12')
  const nasa = NASA_LAYERS[layer]

  return (
    <>
      <MapContainer
        center={[lat, lon]} zoom={START_ZOOM} className="map"
        minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} maxBounds={MAX_BOUNDS} maxBoundsViscosity={1.0} worldCopyJump={false}
      >
        <TileLayer url={SATELLITE_URL} attribution="Imagery: USGS The National Map, USDA NAIP" maxNativeZoom={16} noWrap />
        {/* шари знизу вгору: знімки, шар NASA, маска поза США, кордон, точка поля */}
        {nasa && (
          <TileLayer
            key={layer + date}
            url={`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${nasa.id}/default/${date}/${nasa.matrix}/{z}/{y}/{x}.png`}
            maxNativeZoom={nasa.maxZoom}
            opacity={0.6}
            attribution="NASA GIBS"
          />
        )}
        <Polygon positions={MASK} pathOptions={{ stroke: false, fillColor: '#1f2421', fillOpacity: nasa ? 0.65 : 0.5, className: 'outside-us' }} />
        {/* кордон США: біла лінія з темною обвідкою, щоб було видно на знімках */}
        <Pane name="us-border" style={{ zIndex: 460 }}>
          <Polygon positions={US_POLYGONS} interactive={false} pathOptions={{ color: '#1f2421', weight: 4, opacity: 0.5, fill: false }} />
          <Polygon positions={US_POLYGONS} interactive={false} pathOptions={{ color: '#ffffff', weight: 1.5, fill: false }} />
        </Pane>
        {}
        <CircleMarker center={[lat, lon]} radius={8} pathOptions={{ color: '#1f2421', weight: 3, fillColor: '#ffffff', fillOpacity: 1 }}>
          <Tooltip permanent direction="top" offset={[0, -10]}>{label}</Tooltip>
        </CircleMarker>
        <ClickHandler onPick={onPick} />
        <FlyTo lat={lat} lon={lon} />
      </MapContainer>
      <div className="map-footer">
        <span className="small muted">{t('map.click')}</span>
        <span className="map-controls">
          <select className="layer-select" value={layer} onChange={(e) => setLayer(e.target.value)}>
            <option value="none">{t('map.layerNone')}</option>
            {Object.keys(NASA_LAYERS).filter((key) => NASA_LAYERS[key]).map((key) => (
              <option key={key} value={key}>{t(`map.${key}`)}</option>
            ))}
          </select>
          {nasa && <input className="layer-select" type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
        </span>
      </div>
    </>
  )
}
