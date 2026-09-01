import CardsSvg from '../../assets/FigmaNew/Cards.svg?react'

export default function BotFlashCardsIcon({
  size = 24,
  color,
  className,
  style,
  ...props
}) {
  const renderedSize = typeof size === 'number' ? Math.round(size * 1.2) : size
  const renderedHeight = Math.round(renderedSize * (153 / 140))

  return (
    <CardsSvg
      width={renderedSize}
      height={renderedHeight}
      className={className}
      style={{ minWidth: renderedSize, minHeight: renderedHeight, ...(color ? { color } : {}), ...style }}
      {...props}
    />
  )
}
