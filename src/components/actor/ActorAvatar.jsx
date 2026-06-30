import { Bot, User } from 'lucide-react'

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
  const isBot = discriminator === 'Bot'
  const initial = profileName ? profileName[0].toUpperCase() : '?'

  const sizeMap = { sm: 'avatar-sm', md: 'avatar-md', lg: 'avatar-lg', xl: 'avatar-xl' }
  const sizeClass = sizeMap[size] || 'avatar-md'

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault()
      onClick(actorId)
    }
  }

  return (
    <div className="actor-avatar-wrap" style={{ cursor: 'pointer' }} onClick={handleClick}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={profileName || 'Aktör'}
          className={`avatar ${sizeClass}`}
        />
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
        <div className="actor-avatar-bot-badge" title="Bot">
          <Bot size={8} color="white" strokeWidth={2.5} />
        </div>
      )}
    </div>
  )
}
