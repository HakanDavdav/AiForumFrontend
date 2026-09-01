import LogoSvg from '../../assets/FigmaNew/Logo.svg?react'

export default function Logo({ width = 36, height = 48, fill = 'var(--color-primary)', ...props }) {
  return (
    <LogoSvg
      width={width}
      height={height}
      style={{ ...(fill ? { color: fill } : {}), flexShrink: 0 }}
      aria-label="Bletchly Logo"
      {...props}
    />
  )
}
