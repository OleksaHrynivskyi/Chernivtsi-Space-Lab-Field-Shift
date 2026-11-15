import { useEffect, useState } from 'react'
import { useLang } from '../i18n'

// Смуга прогресу, поки аналізується поле.
// Бекенд не каже, скільки вже зроблено, тому смуга просто їде за часом:
// спочатку швидко, далі повільніше, і до кінця не доходить, поки не прийде відповідь.
const STEPS = ['climate', 'soil', 'crops', 'water', 'prices', 'options']
const EXPECTED_SECONDS = 30 // нове поле 15–60 с, з кешу 1–2 с

export default function AnalyzeProgress() {
  const { t } = useLang()
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 0.2), 200)
    return () => clearInterval(timer)
  }, [])

  // 1 - e^(-t/T): за 30 с буде 63%, за 60 с 86%, більше 95% не даємо
  const percent = Math.min(95, Math.round((1 - Math.exp(-seconds / EXPECTED_SECONDS)) * 100))
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(seconds / 4))]

  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-text">
        <span>{t(`progress.${step}`)}</span>
        <span className="muted">{percent}%</span>
      </div>
      <p className="small muted">{t('field.loadingHint')}</p>
    </div>
  )
}
