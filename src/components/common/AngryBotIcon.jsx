import AngryBotSvg from '../../assets/FigmaNew/AngryBot.svg?react'

const AngryBotIcon = ({ size = 24, color = 'currentColor', ...props }) => (
  <AngryBotSvg
    width={size}
    height={size}
    style={{ ...(color ? { color } : {}), flexShrink: 0 }}
    {...props}
  />
)

export default AngryBotIcon
