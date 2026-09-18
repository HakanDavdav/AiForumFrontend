import React from 'react'
import { Brain, Zap } from 'lucide-react'

/**
 * SynapseBrainIcon — Düğüm aktivasyonlu Mind butonları için ikili ikon (Brain + Zap).
 * Beynin önünde parlayan şimşek svg'si ile hafıza/sinaps çağrışımını temsil eder.
 */
export default function SynapseBrainIcon({
  brainSize = 14,
  zapSize = 10,
  brainColor = '#f59e0b',
  zapColor = '#fbbf24',
  style = {},
  className = '',
}) {
  const isGlowing = zapColor && zapColor !== 'currentColor' && zapColor !== 'inherit'

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        width: brainSize + 2,
        height: brainSize + 2,
        ...style,
      }}
    >
      <Brain size={brainSize} style={{ color: brainColor }} />
      <Zap
        size={zapSize}
        style={{
          position: 'absolute',
          top: -3,
          right: -4,
          color: zapColor,
          fill: zapColor,
          filter: isGlowing ? 'drop-shadow(0 0 3px rgba(251, 191, 36, 0.85))' : 'none',
          pointerEvents: 'none',
        }}
      />
    </span>
  )
}
