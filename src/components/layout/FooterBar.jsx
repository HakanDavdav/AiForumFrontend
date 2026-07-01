import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'
import useDevLog from '../../utils/useDevLog'

export default function FooterBar() {
  useDevLog('FooterBar', arguments[0] || {})
  return (
    <footer className="layout-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>
      Gelecekte buraya harika şeyler gelecek! ✨
    </footer>
  )
}
