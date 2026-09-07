import BotSvg from '../../../assets/FigmaNew/Bot.svg?react'

const BotIcon = ({ size = 24, color = 'currentColor', style, ...props }) => (
  <BotSvg
    width={size}
    height={typeof size === 'number' ? Math.round(size * (189 / 212)) : size}
    style={{ ...(color ? { color } : {}), flexShrink: 0, ...style }}
    {...props}
  />
)

export default BotIcon
