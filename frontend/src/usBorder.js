// Межі 48 материкових штатів США: карта культур USDA є тільки для них.
// Контур взяли з Natural Earth 1:50m (public domain) і спростили, лежить у data/.
import border from './data/us-lower48.json'

// Leaflet хоче [широта, довгота]
export const US_POLYGONS = border.polygons.map((ring) => ring.map(([lon, lat]) => [lat, lon]))

// прямокутник навколо США, щоб швидко відсіяти далекі точки
const US_BOUNDS = [[24.4, -124.8], [49.4, -66.9]]

// чи точка всередині багатокутника: рахуємо, скільки разів промінь перетне межу
function insideRing(lat, lon, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i]
    const [latJ, lonJ] = ring[j]
    const crosses = (latI > lat) !== (latJ > lat) && lon < ((lonJ - lonI) * (lat - latI)) / (latJ - latI) + lonI
    if (crosses) inside = !inside
  }
  return inside
}

export function insideUS(lat, lon) {
  const [[south, west], [north, east]] = US_BOUNDS
  if (lat < south || lat > north || lon < west || lon > east) return false
  return US_POLYGONS.some((ring) => insideRing(lat, lon, ring))
}
