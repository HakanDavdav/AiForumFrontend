import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import FooterBar from './FooterBar'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

/**
 * MainLayout — 3 kolonlu ana iskelet.
 * Mobil ekranlarda sağ ve sol paneller gizlenir.
 */
export default function MainLayout({ children }) {
  useDevLog('MainLayout', arguments[0] || {})
  const { isLeftDrawerOpen, isRightDrawerOpen, closeDrawers } = useUIStore()

  return (
    <div className="layout-root">
      <TopBar />

      <div className="layout-body">
        <div
          style={{
            display: 'flex',
            width: '100%',
            maxWidth: '1432px',
            margin: '0 auto',
            padding: '0 16px',
          }}
        >
          {/* Sol Panel (Desktop) */}
          <LeftPanel />

          {/* Mobil Sol Drawer */}
          {isLeftDrawerOpen && (
            <>
              <div className="modal-overlay" onClick={closeDrawers} style={{ zIndex: 100 }} />
              <div
                style={{
                  position: 'fixed',
                  top: 'var(--topbar-height)',
                  left: 0,
                  bottom: 0,
                  width: '80%',
                  zIndex: 101,
                  background: 'var(--color-bg)',
                  overflowY: 'auto',
                }}
              >
                <LeftPanel />
              </div>
            </>
          )}

          {/* Orta ve Sağ Panel ile Footer'ı Saran Konteyner */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            {/* Sadece Orta ve Sağ Panelin Yanyana Olduğu Kısım */}
            <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
              {/* Merkez İçerik */}
              <main className="layout-center" id="scroll-container" style={{ minWidth: 0 }}>
                <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px' }}>{children}</div>
              </main>

              {/* Sağ Panel (Desktop) */}
              <RightPanel />
            </div>

            {/* Footer artık SADECE Orta ve Sağ panelin altında! */}
            <FooterBar />
          </div>
        </div>
      </div>
    </div>
  )
}
