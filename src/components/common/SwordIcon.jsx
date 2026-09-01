import SwordSvg from '../../assets/FigmaNew/Sword.svg?react'

const SwordIcon = ({ size = 24, color = 'currentColor', ...props }) => (
  <SwordSvg
    width={size}
    height={size}
    style={{ ...(color ? { color } : {}), flexShrink: 0 }}
    {...props}
  />
)

export default SwordIcon
