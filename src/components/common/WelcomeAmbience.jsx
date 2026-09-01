import ArrowCardTravel from './ArrowCardTravel'
import WelcomeSvg from '../../assets/FigmaNew/Welcome.svg?react'
import useUIStore from '../../store/uiStore'

/**
 * Profil kartının arkasında, login/register arka planıyla aynı prensipte
 * hafif blur'lu Welcome.svg (ok-boyunca kart akışı) arka planı.
 */
export default function WelcomeAmbience() {
  const isActive = useUIStore((s) => s.isWelcomeAmbience)

  if (!isActive) return null

  return (
    <div
      className="welcome-ambience"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        opacity: 0.4,
        filter: 'blur(1.5px)',
      }}
    >
      <div
        style={{
          width: '100%',
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ArrowCardTravel
          Svg={WelcomeSvg}
          widthPct={100}
          svgStyle={{ color: 'var(--color-primary)' }}
          cardWidth={10}
          speed={14}
          spacing={200}
          maxCards={25}
          rerandomizeInterval={3000}
        />
      </div>
    </div>
  )
}
