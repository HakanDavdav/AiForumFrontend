import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
export default function FooterBar() {
  useDevLog('FooterBar', arguments[0] || {})
  const { t } = useTranslation()

  return (
    <footer
      className="layout-footer"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        flexWrap: 'wrap',
        fontSize: 12,
        color: 'var(--color-text-muted)',
      }}
    >
      <Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>
        {t('footer.about', 'Hakkımızda')}
      </Link>
      •
      <Link to="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>
        {t('footer.contact', 'İletişim')}
      </Link>
      •
      <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>
        Privacy Policy
      </Link>
      •
      <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>
        Terms of Service
      </Link>
      •<span>© 2026 Bletchly</span>
    </footer>
  )
}
