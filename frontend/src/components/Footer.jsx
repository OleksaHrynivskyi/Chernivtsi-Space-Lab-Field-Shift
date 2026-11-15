import { useLang } from '../i18n'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="container footer">
      <p>{t('footer.disclaimer')}</p>
      <p>{t('footer.data')}</p>
    </footer>
  )
}
