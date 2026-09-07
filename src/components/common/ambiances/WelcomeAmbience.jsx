import ArrowCardTravel from '../ArrowCardTravel'
import WelcomeSvg from '../../../assets/FigmaNew/Welcome.svg?react'
import useUIStore from '../../../store/uiStore'

/**
 * Profil kartının arkasında, login/register arka planıyla aynı prensipte
 * hafif blur'lu Welcome.svg (ok-boyunca kart akışı) arka planı.
 */
export default function WelcomeAmbience({ active }) {
  const storeActive = useUIStore((s) => s.isWelcomeAmbience)
  const isActive = active !== undefined ? active : storeActive

  if (!isActive) return null

  return (
    <div
      className="welcome-ambience"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        overflow: 'hidden',
        borderRadius: 'inherit',
        pointerEvents: 'none',
        opacity: 0.4,
        filter: 'blur(1.5px)',
        maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 16,
        }}
      >
        <ArrowCardTravel
          Svg={WelcomeSvg}
          widthPct={100}
          svgStyle={{ color: 'var(--color-primary)' }}
          cardWidth={12}
          speed={14}
          spacing={200}
          maxCards={25}
          rerandomizeInterval={3000}
        />
      </div>
    </div>
  )
}
