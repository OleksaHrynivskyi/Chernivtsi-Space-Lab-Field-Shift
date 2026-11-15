// Запити до бекенду. Якщо він не відповідає, кидаємо помилку з code "backend_down".

function backendDown() {
  return Object.assign(new Error('Backend is not available'), { code: 'backend_down' })
}

async function request(url, options) {
  let response
  try {
    response = await fetch(url, options)
  } catch {
    throw backendDown()
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    // у FastAPI помилка завжди з "detail". Якщо його нема, значить Vite не достукався до бекенду
    const detail = body?.detail
    if (!detail) throw backendDown()
    if (typeof detail === 'object') {
      // наша помилка з кодом, типу {code: "no_field", message: "..."}
      throw Object.assign(new Error(detail.message), { code: detail.code })
    }
    throw new Error(detail)
  }
  return response.json()
}

export function getField(lat, lon, lang = 'en') {
  return request(`/api/field?lat=${lat}&lon=${lon}&lang=${lang}`)
}

// units: "metric" (мм) або "imperial" (дюйми), щоб бекенд писав числа в поясненнях як треба
export async function getStrategies({ lat, lon, priorities, constraints, scenario, lang = 'en', units = 'metric' }) {
  const data = await request('/api/strategies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, priorities, constraints, scenario, lang, units }),
  })
  return data.strategies
}

// IMERG і SMAP. Довго (до 2 хв), тому окремим запитом
export function getSatellite(lat, lon) {
  return request(`/api/satellite?lat=${lat}&lon=${lon}`)
}

// NDVI по роках, теж окремо
export function getNdvi(lat, lon) {
  return request(`/api/ndvi?lat=${lat}&lon=${lon}`)
}

// пошук місця за назвою. Поверне null, якщо нічого не знайшло
export async function geocode(query) {
  try {
    return await request(`/api/geocode?q=${encodeURIComponent(query)}`)
  } catch (error) {
    if (error.message === 'Place not found') return null
    throw error
  }
}
