import { Bot, PersonStanding } from 'lucide-react'
import useDevLog from '../../utils/useDevLog'

/**
 * ActorAvatar — profil resmi veya isim harfi fallback.
 * Link olarak davranır, tıklanınca profile navigasyon tetikler.
 *
 * @param {object} props
 * @param {string|null} props.profileName
 * @param {string|null} props.imageUrl
 * @param {'User'|'Bot'|null} props.discriminator
 * @param {string} props.actorId
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {function} [props.onClick] - navigasyon yerine custom handler
 */
export default function ActorAvatar({
  profileName,
  imageUrl,
  discriminator,
  actorId,
  size = 'md',
  onClick,
}) {
  useDevLog('ActorAvatar', arguments[0] || {})
  const isBot = discriminator === 'Bot'
  const initial = profileName ? profileName[0].toUpperCase() : '?'

  const sizeMap = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl', xxl: 'avatar-xxl' }
  const sizeClass = sizeMap[size] || 'avatar-md'

  const badgeSizeMap = {
    sm: { size: 14, icon: 10, bottom: -2, right: -2 },
    md: { size: 18, icon: 12, bottom: -2, right: -2 },
    lg: { size: 22, icon: 14, bottom: -2, right: -2 },
    xl: { size: 28, icon: 16, bottom: 0, right: 0 },
    xxl: { size: 40, icon: 24, bottom: 2, right: 2 },
  }
  const badgeOpts = badgeSizeMap[size] || badgeSizeMap.md

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault()
      onClick(actorId)
    }
  }

  return (
    <div className="actor-avatar-wrap" style={{ cursor: 'pointer', alignSelf: 'flex-start', height: 'max-content', display: 'inline-flex' }} onClick={handleClick}>
      {imageUrl ? (
        <img src={imageUrl} alt={profileName || 'Aktör'} className={`avatar ${sizeClass}`} />
      ) : (
        <div
          className={`avatar-fallback ${sizeClass}`}
          style={{
            background: isBot ? 'var(--color-bot-light)' : 'var(--color-primary-light)',
            color: isBot ? 'var(--color-bot)' : 'var(--color-primary-dark)',
          }}
        >
          {initial}
        </div>
      )}

      {isBot && (
        <div
          className="actor-avatar-user-badge"
          title="Bot"
          style={{
            width: badgeOpts.size,
            height: badgeOpts.size,
            bottom: badgeOpts.bottom,
            right: badgeOpts.right,
          }}
        >
          <Bot size={badgeOpts.icon} color="white" strokeWidth={2.5} />
        </div>
      )}
      {discriminator === 'User' && (
        <div
          className="actor-avatar-user-badge"
          title="Kullanıcı"
          style={{
            width: badgeOpts.size,
            height: badgeOpts.size,
            bottom: badgeOpts.bottom,
            right: badgeOpts.right,
          }}
        >
          <PersonStanding size={badgeOpts.icon} color="white" strokeWidth={2.5} />
        </div>
      )}
    </div>
  )
}
