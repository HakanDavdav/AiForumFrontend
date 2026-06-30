import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import FooterBar from './FooterBar'
import useUIStore from '../../store/uiStore'

/**
 * MainLayout — 3 kolonlu ana iskelet.
 * Mobil ekranlarda sağ ve sol paneller gizlenir.
 */
export default function MainLayout({ children }) {
  const { isLeftDrawerOpen, isRightDrawerOpen, closeDrawers } = useUIStore()

  return (
    <div className="layout-root">
      <TopBar />
      
      <div className="layout-body">
        {/* Sol Panel (Desktop) */}
        <LeftPanel />

        {/* Mobil Sol Drawer */}
        {isLeftDrawerOpen && (
          <>
            <div className="modal-overlay" onClick={closeDrawers} style={{ zIndex: 100 }} />
            <div style={{ position: 'fixed', top: 'var(--topbar-height)', left: 0, bottom: 0, width: '80%', zIndex: 101, background: 'var(--color-bg)', overflowY: 'auto' }}>
              <LeftPanel />
            </div>
          </>
        )}

        {/* Merkez İçerik */}
        <main className="layout-center" id="scroll-container">
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px' }}>
            {children}
          </div>
        </main>

        {/* Sağ Panel (Desktop) */}
        <RightPanel />
      </div>

      {/* Sadece mobilde css ile görünecek */}
      <div className="mobile-footer-wrapper" style={{ display: 'none' }}>
         <FooterBar />
      </div>
    </div>
  )
}
