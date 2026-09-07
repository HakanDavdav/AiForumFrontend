import ShieldSvg from '../../../assets/FigmaNew/Shield.svg?react'

const ShieldIcon = ({ size = 24, color = 'currentColor', ...props }) => (
  <ShieldSvg
    width={size}
    height={size}
    style={{ ...(color ? { color } : {}), flexShrink: 0 }}
    {...props}
  />
)

export default ShieldIcon
