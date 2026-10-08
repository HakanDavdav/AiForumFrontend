import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, ChevronDown, Moon, PaintbrushVertical, Sun } from 'lucide-react'
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
 * dil dropdown'ı ve footer bağlantıları. Masaüstünde bunlar üst bardadır.
 * Hızlı bağlantı ikonları mobil üst bardaki gruba taşındı.
 */
export default function MobileDrawerExtras() {
  const { isDarkMode, toggleTheme, isGreenMode, toggleGreenMode } = useThemeStore()
  const { t, i18n } = useTranslation()
  const [isLangOpen, setIsLangOpen] = useState(false)
  const langRef = useRef(null)

  const rawLang = (i18n.language || 'tr').toLowerCase()
  const currentLang =
    LANGS.find((l) => l.code === rawLang || l.code === rawLang.split('-')[0]) || LANGS[0]

  useEffect(() => {
    if (!isLangOpen) return undefined
    const handleClick = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setIsLangOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isLangOpen])

  return (
    <div className="mobile-drawer-extras">
      <div className="mobile-drawer-extras__row">
        <button type="button" className="mobile-drawer-extra-btn" onClick={toggleTheme}>
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDarkMode ? t('topbar.light_mode', 'Açık Tema') : t('topbar.dark_mode', 'Koyu Tema')}</span>
        </button>
        <button type="button" className="mobile-drawer-extra-btn" onClick={toggleGreenMode}>
          <span
            className="mobile-drawer-paint-bot"
            style={{ color: isGreenMode ? '#10b981' : 'var(--color-primary)' }}
          >
            <Bot size={17} strokeWidth={2.4} />
            <PaintbrushVertical size={14} strokeWidth={2.2} style={{ marginLeft: -4 }} />
          </span>
          <span>{isGreenMode ? t('topbar.green_theme', 'Yeşil Tema') : t('topbar.blue_theme', 'Mavi Tema')}</span>
        </button>
      </div>

      <div className="mobile-drawer-lang" ref={langRef}>
        <button
          type="button"
          className="mobile-drawer-lang-trigger"
          onClick={() => setIsLangOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={isLangOpen}
        >
          <img
            src={currentLang.flagUrl}
            alt={currentLang.code}
            style={{ width: 20, height: 15, borderRadius: 2 }}
          />
          <span>{currentLang.label}</span>
          <ChevronDown
            size={15}
            className={`mobile-drawer-lang-caret${isLangOpen ? ' is-open' : ''}`}
          />
        </button>

        {isLangOpen && (
          <div className="mobile-drawer-lang-menu" role="listbox">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={currentLang.code === l.code}
                className={`mobile-drawer-lang-option${currentLang.code === l.code ? ' is-active' : ''}`}
                onClick={() => {
                  i18n.changeLanguage(l.code)
                  setIsLangOpen(false)
                }}
              >
                <img
                  src={l.flagUrl}
                  alt={l.code}
                  style={{ width: 20, height: 15, borderRadius: 2 }}
                />
                <span>{l.label}</span>
              </button>
            ))}
          </div>
        )}
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
