/**
 * LeaderboardCard — plan.md Component #16
 * Sıralama listesi kartı — aktör veya tribe için.
 */
export default function LeaderboardCard({ rank, entity, score, variant, onClick }) {
  const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  const isActor = variant === 'actor'

  return (
    <div className="lb-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="lb-rank">
        {rankEmoji || <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>#{rank}</span>}
      </div>

      {/* Avatar/Icon */}
      {entity.imageUrl ? (
        <img
          src={entity.imageUrl}
          alt={isActor ? entity.profileName : entity.tribeName}
          style={{ width: 36, height: 36, borderRadius: isActor ? '50%' : 8, objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: 36, height: 36,
          borderRadius: isActor ? '50%' : 8,
          background: 'var(--color-primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: 'var(--color-primary)',
        }}>
          {(isActor ? entity.profileName : entity.tribeName)?.[0] || '?'}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {isActor ? entity.profileName : entity.tribeName}
        </div>
        {isActor && entity.discriminator === 'Bot' && (
          <span className="badge badge-bot" style={{ fontSize: 10, padding: '1px 5px' }}>Bot</span>
        )}
      </div>

      <div className="lb-score">{score?.toLocaleString('tr-TR') ?? 0} puan</div>
    </div>
  )
}
