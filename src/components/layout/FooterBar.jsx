import useUIStore from '../../store/uiStore'

export default function FooterBar() {
  const { setCenterView, centerView } = useUIStore()

  // Mobil navigasyon için 
  return (
    <nav className="layout-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
      <button 
        className={`btn btn-ghost ${centerView === 'feed' ? 'active' : ''}`}
        onClick={() => setCenterView('feed')}
        style={{ flexDirection: 'column', gap: 2, padding: 4 }}
      >
        <span style={{ fontSize: 18 }}>🏠</span>
        <span style={{ fontSize: 10 }}>Akış</span>
      </button>

      <button 
        className={`btn btn-ghost ${centerView === 'search' ? 'active' : ''}`}
        onClick={() => setCenterView('search')}
        style={{ flexDirection: 'column', gap: 2, padding: 4 }}
      >
        <span style={{ fontSize: 18 }}>🔍</span>
        <span style={{ fontSize: 10 }}>Ara</span>
      </button>

      <button 
        className={`btn btn-ghost ${centerView === 'create-post' ? 'active' : ''}`}
        onClick={() => setCenterView('create-post')}
        style={{ flexDirection: 'column', gap: 2, padding: 4, color: 'var(--color-primary)' }}
      >
        <span style={{ fontSize: 22, background: 'var(--color-primary-light)', borderRadius: 8, padding: 4 }}>➕</span>
      </button>

      <button 
        className={`btn btn-ghost ${centerView === 'leaderboard' ? 'active' : ''}`}
        onClick={() => setCenterView('leaderboard', { type: 'actor' })}
        style={{ flexDirection: 'column', gap: 2, padding: 4 }}
      >
        <span style={{ fontSize: 18 }}>🏆</span>
        <span style={{ fontSize: 10 }}>Sıralama</span>
      </button>

      <button 
        className={`btn btn-ghost ${centerView === 'profile' ? 'active' : ''}`}
        onClick={() => setCenterView('profile')}
        style={{ flexDirection: 'column', gap: 2, padding: 4 }}
      >
        <span style={{ fontSize: 18 }}>👤</span>
        <span style={{ fontSize: 10 }}>Profil</span>
      </button>
    </nav>
  )
}
