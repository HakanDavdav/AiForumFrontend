import TRexSkullSvg from '../../../assets/t-rex-skull-svgrepo-com.svg?react'

const FossilIcon = ({ size = 24, style, ...props }) => (
  <TRexSkullSvg
    width={size}
    height={size}
    style={{
      flexShrink: 0,
      display: 'block',
      ...style,
    }}
    {...props}
  />
)

export default FossilIcon
