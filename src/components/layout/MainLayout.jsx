import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import TopBar from './TopBar'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'
import FooterBar from './FooterBar'
import MobileTabBar from './MobileTabBar'
import MobileDrawerExtras from './MobileDrawerExtras'
import Logo from '../common/icons/Logo'
import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

/**
 * MainLayout — 3 kolonlu ana iskelet.
 * Mobil ekranlarda sağ ve sol paneller gizlenir; sol panel drawer olarak açılır,
 * alt kısımda MobileTabBar görünür.
 * Hiyerarşi sayfasında sağ panel gizlenir ve orta panel genişler.
 */
export default function MainLayout({ children, pendingInvitation = null, onOpenInvitation }) {
  useDevLog('MainLayout', arguments[0] || {})
  const { isLeftDrawerOpen, closeDrawers } = useUIStore()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isHierarchyPage =
    location.pathname.startsWith('/hierarchy') || location.pathname.startsWith('/card-hierarchy')

  // Rota değiştiğinde mobil drawer'ları kapat
  useEffect(() => {
    closeDrawers()
  }, [location.pathname, closeDrawers])

  return (
    <div className="layout-root">
      <TopBar pendingInvitation={pendingInvitation} onOpenInvitation={onOpenInvitation} />

      <div className="layout-body">
        <div
          className={isHierarchyPage ? 'layout-hierarchy' : undefined}
          style={{
            display: 'flex',
            width: isHierarchyPage ? 'calc(100% - max(0px, calc((100% - 1432px) / 2)))' : '100%',
            maxWidth: isHierarchyPage ? 'none' : '1432px',
            marginLeft: isHierarchyPage ? 'max(0px, calc((100% - 1432px) / 2))' : 'auto',
            marginRight: isHierarchyPage ? 0 : 'auto',
            padding: isHierarchyPage ? '0 8px 0 16px' : '0 16px',
          }}
        >
          {/* Sol Panel (Desktop) */}
          <LeftPanel />

          {/* Mobil Sol Drawer */}
          {isLeftDrawerOpen && (
            <>
              <div className="modal-overlay" onClick={closeDrawers} style={{ zIndex: 100 }} />
              <div className="layout-left-drawer" role="dialog" aria-modal="true">
                <div className="layout-left-drawer__bar">
                  <button
                    type="button"
                    className="layout-left-drawer__brand"
                    onClick={() => {
                      closeDrawers()
                      navigate('/')
                    }}
                  >
                    <Logo width={26} height={34} fill="var(--color-primary)" />
                    <span>letchly</span>
                  </button>
                  <button
                    type="button"
                    className="layout-left-drawer__close"
                    onClick={closeDrawers}
                    aria-label={t('common.close', 'Kapat')}
                  >
                    <X size={20} />
                  </button>
                </div>
                <LeftPanel />
                <MobileDrawerExtras />
              </div>
            </>
          )}

          {/* Orta ve Sağ Panel ile Footer'ı Saran Konteyner */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            {/* Sadece Orta ve Sağ Panelin Yanyana Olduğu Kısım */}
            <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
              {/* Merkez İçerik */}
              <main className="layout-center" id="scroll-container" style={{ minWidth: 0, width: '100%' }}>
                <div
                  className="layout-center-inner"
                  style={{
                    maxWidth: isHierarchyPage ? '100%' : 800,
                    width: '100%',
                    margin: isHierarchyPage ? 0 : '0 auto',
                    padding: isHierarchyPage ? '16px 8px 16px 16px' : '16px',
                  }}
                >
                  {children}
                </div>
              </main>

              {/* Sağ Panel (Desktop) — Hiyerarşi sayfasında gizlenir */}
              {!isHierarchyPage && <RightPanel />}
            </div>

            {/* Footer artık SADECE Orta ve Sağ panelin altında! */}
            <FooterBar />
          </div>
        </div>
      </div>

      {/* Mobil alt gezinme çubuğu */}
      <MobileTabBar />
    </div>
  )
}
