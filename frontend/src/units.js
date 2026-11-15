// Одиниці. Англійською показуємо дюйми і °F (для США), українською мм і °C.
// Бекенд завжди віддає мм і °C, переводимо тут.

export function isImperial(lang) {
  return lang === 'en'
}

// число для графіків
export function rainValue(mm, lang) {
  return isImperial(lang) ? Math.round((mm / 25.4) * 10) / 10 : Math.round(mm)
}

// текст з одиницею: "19.8 in" або "502 мм"
export function rainText(mm, lang) {
  return isImperial(lang) ? `${rainValue(mm, lang)} in` : `${rainValue(mm, lang)} мм`
}

export function rainUnit(lang) {
  return isImperial(lang) ? 'in' : 'мм'
}

export function tempValue(c, lang) {
  return isImperial(lang) ? Math.round(c * 1.8 + 32) : Math.round(c * 10) / 10
}

export function tempUnit(lang) {
  return isImperial(lang) ? '°F' : '°C'
}

// GDD: база 10 °C це 50 °F, значення множимо на 1.8
export function gddValue(cDays, lang) {
  return isImperial(lang) ? Math.round(cDays * 1.8) : cDays
}

export function gddBase(lang) {
  return isImperial(lang) ? '50 °F' : '10 °C'
}

export function heatThreshold(lang) {
  return isImperial(lang) ? '95 °F' : '35 °C'
}

// порівняння з поточною сівозміною: краще / так само / гірше
export function compareScore(value, current) {
  if (value - current >= 5) return 'better'
  if (current - value >= 5) return 'worse'
  return 'same'
}
