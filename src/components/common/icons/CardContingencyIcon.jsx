import CardContigencySvg from '../../../assets/FigmaNew/CardContigency.svg?react'

export default function CardContingencyIcon({
  size = 16,
  color,
  className,
  style,
  ...props
}) {
  const renderedWidth = typeof size === 'number' ? Math.round(size * 1.2) : size
  const renderedHeight = Math.round(renderedWidth * (248 / 166))

  return (
    <CardContigencySvg
      width={renderedWidth}
      height={renderedHeight}
      className={className}
      style={{ minWidth: renderedWidth, minHeight: renderedHeight, ...(color ? { color } : {}), ...style }}
      {...props}
    />
  )
}
