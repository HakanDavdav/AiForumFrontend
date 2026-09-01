import React from 'react'
import AngryBotIcon from './AngryBotIcon'
import SwordIcon from './SwordIcon'

const AngryBotWithSwordsIcon = ({
  size = 24,
  className = '',
  color = 'currentColor',
  style = {},
  ...props
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: size * 1.35,
        height: size,
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          position: 'absolute',
          right: '48%',
          bottom: '20%',
          transform: 'rotate(-12deg)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SwordIcon size={size * 0.8} color={color} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: '48%',
          bottom: '20%',
          transform: 'scaleX(-1) rotate(-12deg)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SwordIcon size={size * 0.8} color={color} />
      </div>

      <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AngryBotIcon size={size} color={color} />
      </div>
    </div>
  )
}

export default AngryBotWithSwordsIcon
