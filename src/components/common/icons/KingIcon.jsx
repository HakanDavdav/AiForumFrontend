import KingSvg from '../../../assets/King.svg?react'

const KingIcon = ({ size, color, strokeWidth, style, ...props }) => {
  const effectiveSize = size ? Math.max(Math.round(size * 1.40), 26) : 26
  return (
    <KingSvg
      width={effectiveSize}
      height={effectiveSize}
      style={{
        flexShrink: 0,
        display: 'block',
        ...style,
      }}
      {...props}
    />
  )
}

export default KingIcon
