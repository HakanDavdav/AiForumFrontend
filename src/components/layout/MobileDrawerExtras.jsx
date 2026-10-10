import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

/**
 * Mobil sol drawer'ın alt bölümü: footer bağlantıları.
 * Tema (açık/koyu, mavi/yeşil) ve dil seçici üst barda, avatarın solundadır.
 */
export default function MobileDrawerExtras() {
  const { t } = useTranslation()

  return (
    <div className="mobile-drawer-extras">
      <div className="mobile-drawer-extras__links">
        <Link to="/about">{t('footer.about', 'Hakkımızda')}</Link>
        <Link to="/contact">{t('footer.contact', 'İletişim')}</Link>
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
      </div>
      <div className="mobile-drawer-extras__copyright">© 2026 Bletchly</div>
    </div>
  )
}
