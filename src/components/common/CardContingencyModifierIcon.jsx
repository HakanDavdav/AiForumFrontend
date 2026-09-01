import CardContigencyModifierSvg from '../../assets/FigmaNew/CardContigencyModifier.svg?react'

export default function CardContingencyModifierIcon({
  size = 16,
  color,
  className,
  style,
  ...props
}) {
  const renderedWidth = typeof size === 'number' ? Math.round(size * 1.2) : size
  const renderedHeight = Math.round(renderedWidth * (248 / 297))

  return (
    <CardContigencyModifierSvg
      width={renderedWidth}
      height={renderedHeight}
      className={className}
      style={{ minWidth: renderedWidth, minHeight: renderedHeight, ...(color ? { color } : {}), ...style }}
      {...props}
    />
  )
}
