import { Link, useNavigate } from 'react-router-dom'
import { Moon, Sun, Podium, Users, PackageOpen, BookOpen } from 'lucide-react'
import BotFlashCardsIcon from '../common/icons/BotFlashCardsIcon'
import useThemeStore from '../../store/themeStore'
import { useTranslation } from 'react-i18next'

const LANGS = [
  { code: 'tr', label: 'Türkçe', flagUrl: 'https://flagcdn.com/w20/tr.png' },
  { code: 'en', label: 'English', flagUrl: 'https://flagcdn.com/w20/us.png' },
  { code: 'ja', label: '日本語', flagUrl: 'https://flagcdn.com/w20/jp.png' },
  { code: 'hi', label: 'हिन्दी', flagUrl: 'https://flagcdn.com/w20/in.png' },
  { code: 'de', label: 'Deutsch', flagUrl: 'https://flagcdn.com/w20/de.png' },
  { code: 'fr', label: 'Français', flagUrl: 'https://flagcdn.com/w20/fr.png' },
  { code: 'ar', label: 'العربية', flagUrl: 'https://flagcdn.com/w20/sa.png' },
]

/**
 * Mobil sol drawer'ın alt bölümü: tema (açık/koyu/yeşil) anahtarı,
 * dil seçici ve footer bağlantıları. Masaüstünde bunlar üst bardadır.
 */
export default function MobileDrawerExtras() {
  const { isDarkMode, toggleTheme, isGreenMode, toggleGreenMode } = useThemeStore()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const rawLang = (i18n.language || 'tr').toLowerCase()
  const currentLang = (LANGS.find((l) => l.code === rawLang || l.code === rawLang.split('-')[0]) || LANGS[0]).code

  const quickLinks = [
    { key: 'leaderboard', label: t('topbar.leaderboard', 'Liderlik Tablosu'), icon: <Podium size={17} />, to: '/leaderboard' },
    { key: 'tribes', label: t('topbar.tribes', 'Klanlar'), icon: <Users size={17} />, to: '/tribes' },
    { key: 'marketplace', label: t('card.marketplace', 'Kart Marketi'), icon: <PackageOpen size={17} />, to: '/marketplace' },
    { key: 'cards', label: t('card.cards', 'Kartlarım'), icon: <BotFlashCardsIcon size={17} />, to: '/cards' },
    { key: 'concepts', label: t('basic_concepts.title', 'Temel Kavramlar'), icon: <BookOpen size={17} />, to: '/basic-concepts' },
  ]

  return (
    <div className="mobile-drawer-extras">
      <div className="mobile-drawer-extras__quick">
        {quickLinks.map((l) => (
          <button key={l.key} type="button" className="mobile-drawer-quick-link" onClick={() => navigate(l.to)}>
            {l.icon}
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <div className="mobile-drawer-extras__row">
        <button type="button" className="mobile-drawer-extra-btn" onClick={toggleTheme}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDarkMode ? t('topbar.light_mode', 'Açık Tema') : t('topbar.dark_mode', 'Koyu Tema')}</span>
        </button>
        <button type="button" className="mobile-drawer-extra-btn" onClick={toggleGreenMode}>
          <span
            className="mobile-drawer-color-dot"
            style={{ background: isGreenMode ? '#10b981' : '#3b82f6' }}
          />
          <span>{isGreenMode ? t('topbar.green_theme', 'Yeşil Tema') : t('topbar.blue_theme', 'Mavi Tema')}</span>
        </button>
      </div>

      <div className="mobile-drawer-extras__langs">
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            className={`mobile-drawer-lang-btn${currentLang === l.code ? ' is-active' : ''}`}
            onClick={() => i18n.changeLanguage(l.code)}
          >
            {l.flagUrl ? (
              <img src={l.flagUrl} alt={l.code} style={{ width: 20, height: 15, borderRadius: 2 }} />
            ) : (
              <span>{l.label}</span>
            )}
            <span>{l.label}</span>
          </button>
        ))}
      </div>

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
