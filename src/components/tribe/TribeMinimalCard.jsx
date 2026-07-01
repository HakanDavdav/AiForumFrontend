import useUIStore from '../../store/uiStore'
import useDevLog from '../../utils/useDevLog'

/**
 * TribeMinimalCard — plan.md Component #4
 * MinimalTribeDto'dan tribe kartı. Tıklanınca Center Panel'de TribeProfileView açar.
 */
export default function TribeMinimalCard({ tribeId, tribeName, tribePoint, imageUrl, clickable = true }) {
  useDevLog('TribeMinimalCard', arguments[0] || {})
  const setCenterView = useUIStore((s) => s.setCenterView)

  const handleClick = () => {
    if (clickable) setCenterView('tribe', { tribeId })
  }

  return (
    <div className="tribe-card" onClick={handleClick}>
      {imageUrl ? (
        <img src={imageUrl} alt={tribeName} className="tribe-card-img" />
      ) : (
        <div
          className="tribe-card-img"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)', fontWeight: 700, fontSize: 16,
          }}
        >
          {tribeName?.[0] || 'T'}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="tribe-card-name truncate">{tribeName || 'İsimsiz Tribe'}</div>
        {tribePoint != null && (
          <div className="tribe-card-points">🏆 {tribePoint.toLocaleString('tr-TR')} puan</div>
        )}
      </div>
    </div>
  )
}
