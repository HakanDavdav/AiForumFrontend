import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, PenSquare, User } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'
import { useTranslation } from 'react-i18next'

/**
 * MobileTabBar — yalnızca mobil (≤900px) ekranlarda görünen alt gezinme çubuğu.
 * layout.css içindeki `.mobile-tab-bar` kuralları ile gösterilir/gizlenir.
 */
export default function MobileTabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, actorId } = useAuthStore()
  const { closeDrawers } = useUIStore()
  const { t } = useTranslation()
  const path = location.pathname

  const go = (to) => {
    closeDrawers()
    navigate(to)
  }

  const isActive = (...paths) => paths.some((p) => path === p || path.startsWith(p + '/'))

  const tabs = [
    {
      key: 'home',
      label: t('tab_bar.home', 'Ana Sayfa'),
      icon: <Home size={21} strokeWidth={2.1} />,
      active: path === '/',
      onClick: () => go('/'),
    },
    {
      key: 'search',
      label: t('tab_bar.search', 'Ara'),
      icon: <Search size={21} strokeWidth={2.1} />,
      active: isActive('/search'),
      onClick: () => go('/search'),
    },
    {
      key: 'create',
      label: t('tab_bar.create', 'Yeni'),
      icon: <PenSquare size={22} strokeWidth={2.2} />,
      active: isActive('/create-post', '/edit-post'),
      primary: true,
      onClick: () => go(isLoggedIn ? '/create-post' : '/login'),
    },
    {
      key: 'profile',
      label: t('tab_bar.profile', 'Profil'),
      icon: <User size={21} strokeWidth={2.1} />,
      active: isActive('/profile', '/account-settings', '/init-profile'),
      onClick: () => go(isLoggedIn && actorId ? `/profile?actorId=${actorId}` : '/login'),
    },
  ]

  return (
    <nav className="mobile-tab-bar" aria-label={t('tab_bar.nav_label', 'Mobil Gezinme')}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`mobile-tab-bar__item${tab.active ? ' is-active' : ''}${tab.primary ? ' is-primary' : ''}`}
          onClick={tab.onClick}
          aria-current={tab.active ? 'page' : undefined}
        >
          {tab.icon}
          <span className="mobile-tab-bar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
