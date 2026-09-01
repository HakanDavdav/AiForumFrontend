import ArrowCardTravel from '../common/ArrowCardTravel'
import WelcomeSvg from '../../assets/FigmaNew/Welcome.svg?react'

/**
 * Auth sayfaları (Login/Register) için kart arkasında hafif blur'lu,
 * BletchlyGuideModal ile aynı felsefede çalışan Welcome.svg arka planı.
 */
export default function AuthWelcomeBackground({ children }) {
  return (
    <div style={{ position: 'relative' }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          opacity: 0.4,
          filter: 'blur(1.5px)',
          pointerEvents: 'none',
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
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
