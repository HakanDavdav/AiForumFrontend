import KingSvg from '../../../assets/King.svg?react'

const KingIcon = ({ size, color, strokeWidth: _strokeWidth, style, ...props }) => {
  const effectiveSize = size ? Math.max(Math.round(size * 1.40), 26) : 26
  return (
    <KingSvg
      width={effectiveSize}
      height={effectiveSize}
      className="king-icon"
      style={{
        flexShrink: 0,
        display: 'block',
        ...(color ? { '--color-primary': color } : {}),
        ...style,
      }}
      {...props}
    />
  )
}

export default KingIcon
