import LazyBotSvg from '../../../assets/FigmaNew/LazyBot.svg?react'

const LazyBotIcon = ({ size = 24, color = 'currentColor', ...props }) => (
  <LazyBotSvg
    width={size}
    height={size}
    style={{ ...(color ? { color } : {}), flexShrink: 0 }}
    {...props}
  />
)

export default LazyBotIcon
