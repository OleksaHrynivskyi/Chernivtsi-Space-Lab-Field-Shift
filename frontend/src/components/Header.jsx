import { useLang } from '../i18n'

// Вкладки зверху. Поки поле не проаналізоване, активна тільки перша
const TABS = ['field', 'result', 'compare', 'conditions']

// звіт відкривається з «Варіантів», тому підсвічуємо їх
const ACTIVE_TAB = { details: 'compare' }

export default function Header({ page, setPage, hasData }) {
  const { t, lang, setLang } = useLang()
  const active = ACTIVE_TAB[page] || page
  return (
    <header className="header">
      <div className="container">
        <span className="logo" onClick={() => setPage('field')}>Field Shift</span>
        <nav className="steps">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={'step' + (active === tab ? ' active' : '')}
              disabled={tab !== 'field' && !hasData}
              onClick={() => setPage(tab)}
            >
              {t(`step.${tab}`)}
            </button>
          ))}
        </nav>
        <button className={'link-button' + (page === 'how' ? ' active-link' : '')} onClick={() => setPage('how')}>{t('nav.how')}</button>
        <div className="lang-switch" role="group" aria-label="Language">
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'uk' ? 'active' : ''} onClick={() => setLang('uk')}>УК</button>
        </div>
      </div>
    </header>
  )
}
