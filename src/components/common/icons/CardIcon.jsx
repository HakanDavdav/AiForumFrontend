import { Crown } from 'lucide-react'
import CardSvg from '../../../assets/FigmaNew/Card.svg?react'

/**
 * Kişilik kartı görseli (Card.svg) üzerine kurulu mini kart ikonu.
 * - default: tek, eğik, ortasında bot gölgesi olan kart (ActorMinimalCard destesiyle birebir).
 * - crowned: kartın sol üstünde PersonalityCard yaratıcı rozetiyle aynı stilde küçük altın taç.
 */
export default function CardIcon({
  crowned = false,
  width = 21,
  height,
  color = 'var(--color-primary)',
  crownSize,
  crownTop,
  crownLeft,
  className,
  style,
  ...props
}) {
  const cardRatio = 122 / 105
  const renderedHeight = height ?? Math.round(width * cardRatio)

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        width,
        height: renderedHeight,
        lineHeight: 0,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <CardSvg
        width={width}
        height={renderedHeight}
        style={{ display: 'block', overflow: 'visible', color }}
      />
      {crowned && (
        <Crown
          size={
            crownSize ??
            (width < 16
              ? Math.max(Math.round(width * 0.6), 6)
              : Math.max(Math.round(width * 0.45), 8))
          }
          strokeWidth={width < 16 ? 2.2 : 3.2}
          style={{
            position: 'absolute',
            top: crownTop ?? -Math.max(Math.round(renderedHeight * 0.08), 1),
            left: crownLeft ?? -Math.max(Math.round(width * 0.18), 2),
            color: 'var(--color-warning)',
            transform: 'rotate(-25deg)',
            filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45))',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}
    </span>
  )
}
