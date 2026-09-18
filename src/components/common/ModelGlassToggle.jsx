import React, { useState } from 'react'

export function GeminiLogo({ size = 30, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: 'block' }}
      {...props}
    >
      <path
        d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z"
      />
    </svg>
  )
}

/** Official OpenAI icon from https://icons.getbootstrap.com/icons/openai/ */
export function OpenAILogo({ size = 28, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ display: 'block' }}
      {...props}
    >
      <path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 3.234.41l-.096.054-3.23 1.838a.53.53 0 0 0-.265.455zm.742-1.577 1.758-1 1.762 1v2l-1.755 1-1.762-1z" />
    </svg>
  )
}

/** Official DeepSeek whale icon */
export function DeepSeekLogo({ size = 30, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 510"
      fill="currentColor"
      style={{ display: 'block' }}
      {...props}
    >
      <path
        fillRule="nonzero"
        d="M440.898 139.167c-4.001-1.961-5.723 1.776-8.062 3.673-.801.612-1.479 1.407-2.154 2.141-5.848 6.246-12.681 10.349-21.607 9.859-13.048-.734-24.192 3.368-34.04 13.348-2.093-12.307-9.048-19.658-19.635-24.37-5.54-2.449-11.141-4.9-15.02-10.227-2.708-3.795-3.447-8.021-4.801-12.185-.861-2.509-1.725-5.082-4.618-5.512-3.139-.49-4.372 2.142-5.601 4.349-4.925 9.002-6.833 18.921-6.647 28.962.432 22.597 9.972 40.597 28.932 53.397 2.154 1.47 2.707 2.939 2.032 5.082-1.293 4.41-2.832 8.695-4.186 13.105-.862 2.817-2.157 3.429-5.172 2.205-10.402-4.346-19.391-10.778-27.332-18.553-13.481-13.044-25.668-27.434-40.873-38.702a177.614 177.614 0 00-10.834-7.409c-15.512-15.063 2.032-27.434 6.094-28.902 4.247-1.532 1.478-6.797-12.251-6.736-13.727.061-26.285 4.653-42.288 10.777-2.34.92-4.801 1.593-7.326 2.142-14.527-2.756-29.608-3.368-45.367-1.593-29.671 3.305-53.368 17.329-70.788 41.272-20.928 28.785-25.854 61.482-19.821 95.59 6.34 35.943 24.683 65.704 52.876 88.974 29.239 24.123 62.911 35.943 101.32 33.677 23.329-1.346 49.307-4.468 78.607-29.27 7.387 3.673 15.142 5.144 28.008 6.246 9.911.92 19.452-.49 26.839-2.019 11.573-2.449 10.773-13.166 6.586-15.124-33.915-15.797-26.47-9.368-33.24-14.573 17.235-20.39 43.213-41.577 53.369-110.222.8-5.448.121-8.877 0-13.287-.061-2.692.553-3.734 3.632-4.041 8.494-.981 16.742-3.305 24.314-7.471 21.975-12.002 30.84-31.719 32.933-55.355.307-3.612-.061-7.348-3.879-9.245v-.003zM249.4 351.89c-32.872-25.838-48.814-34.352-55.4-33.984-6.155.368-5.048 7.41-3.694 12.002 1.415 4.532 3.264 7.654 5.848 11.634 1.785 2.634 3.017 6.551-1.784 9.493-10.587 6.55-28.993-2.205-29.856-2.635-21.421-12.614-39.334-29.269-51.954-52.047-12.187-21.924-19.267-45.435-20.435-70.542-.308-6.061 1.478-8.207 7.509-9.307 7.94-1.471 16.127-1.778 24.068-.615 33.547 4.9 62.108 19.902 86.054 43.66 13.666 13.531 24.007 29.699 34.658 45.496 11.326 16.778 23.514 32.761 39.026 45.865 5.479 4.592 9.848 8.083 14.035 10.656-12.62 1.407-33.673 1.714-48.075-9.676zm15.899-102.519c.521-2.111 2.421-3.658 4.722-3.658a4.74 4.74 0 011.661.305c.678.246 1.293.614 1.786 1.163.861.859 1.354 2.083 1.354 3.368 0 2.695-2.154 4.837-4.862 4.837a4.748 4.748 0 01-4.738-4.034 5.01 5.01 0 01.077-1.981zm47.208 26.915c-2.606.996-5.2 1.778-7.707 1.88-4.679.244-9.787-1.654-12.556-3.981-4.308-3.612-7.386-5.631-8.679-11.941-.554-2.695-.247-6.858.246-9.246 1.108-5.144-.124-8.451-3.754-11.451-2.954-2.449-6.711-3.122-10.834-3.122-1.539 0-2.954-.673-4.001-1.224-1.724-.856-3.139-3-1.785-5.634.432-.856 2.525-2.939 3.018-3.305 5.6-3.185 12.065-2.144 18.034.244 5.54 2.266 9.727 6.429 15.759 12.307 6.155 7.102 7.263 9.063 10.773 14.39 2.771 4.163 5.294 8.451 7.018 13.348.877 2.561.071 4.74-2.341 6.277-.981.625-2.109 1.044-3.191 1.458z"
      />
    </svg>
  )
}

/** Official Grok icon from https://lobehub.com/icons/grok */
export function GrokLogo({ size = 28, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      style={{ display: 'block' }}
      {...props}
    >
      <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
    </svg>
  )
}

export const MODEL_GLASS_ITEMS = [
  { value: 0, key: 'gemini', title: 'Gemini', Icon: GeminiLogo },
  { value: 1, key: 'gpt4o_mini', title: 'OpenAI', Icon: OpenAILogo },
  { value: 2, key: 'deepseek_chat', title: 'DeepSeek', Icon: DeepSeekLogo },
  { value: 3, key: 'grok_build', title: 'Grok', Icon: GrokLogo },
]

export default function ModelGlassToggle({ value = 0, onChange, disabled = false, style = {} }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const activeIndex = MODEL_GLASS_ITEMS.findIndex((m) => m.value === value)
  const safeIndex = activeIndex >= 0 ? activeIndex : 0

  const handleSegmentClick = (index) => {
    if (disabled) return
    if (index === safeIndex) {
      // Clicking the currently active model or the glass thumb cycles to the next model
      const nextIndex = (safeIndex + 1) % MODEL_GLASS_ITEMS.length
      onChange?.(MODEL_GLASS_ITEMS[nextIndex].value)
    } else {
      // Directly jump to clicked model
      onChange?.(MODEL_GLASS_ITEMS[index].value)
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: 360,
        height: 60,
        padding: 6,
        borderRadius: 9999,
        background: 'var(--color-surface-raised, rgba(255, 255, 255, 0.04))',
        border: '1.5px solid var(--color-border)',
        boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.12)',
        boxSizing: 'border-box',
        userSelect: 'none',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {/* ─── Ultra-Clear Sliding Glass Thumb (Glows with Site Theme Color: Blue or Green) ─── */}
      <div
        style={{
          position: 'absolute',
          top: 5,
          bottom: 5,
          left: 5,
          width: 'calc((100% - 10px) / 4)',
          borderRadius: 9999,
          transform: `translateX(calc(${safeIndex} * 100%))`,
          transition: 'transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), border-color 0.3s, box-shadow 0.3s',
          // High transparency crystal glass, NO heavy blur so the icon behind is 100% clear
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.03) 60%, rgba(255, 255, 255, 0.1) 100%)',
          border: '1.5px solid color-mix(in srgb, var(--color-primary) 38%, rgba(255, 255, 255, 0.65))',
          boxShadow:
            '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 1.5px 2px rgba(255, 255, 255, 0.8), inset 0 -1.5px 2px rgba(0, 0, 0, 0.15), 0 0 16px var(--color-primary-shadow, rgba(59, 130, 246, 0.3))',
          pointerEvents: 'none',
          zIndex: 2,
          overflow: 'hidden',
        }}
      >
        {/* Subtle curved glass specular reflection */}
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: 6,
            right: 6,
            height: '42%',
            borderRadius: '9999px 9999px 60% 60%',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0) 100%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ─── 4 Model Segments Underneath the Glass ─── */}
      {MODEL_GLASS_ITEMS.map((model, idx) => {
        const { value: modelVal, title, Icon } = model
        const isSelected = safeIndex === idx
        const isHovered = hoveredIdx === idx

        return (
          <button
            key={modelVal}
            type="button"
            title={title}
            disabled={disabled}
            onClick={() => handleSegmentClick(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: '50%',
                transition: 'all 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'scale(1.15)' : isHovered ? 'scale(1.05)' : 'scale(0.92)',
                opacity: isSelected ? 1 : isHovered ? 0.9 : 0.55,
                // Normal state: monochrome white/gray based on site theme (text-secondary)
                // Active state: turns to theme color (green or blue)
                color: isSelected || isHovered
                  ? 'var(--color-primary)'
                  : 'var(--color-text-secondary)',
                filter: isSelected
                  ? 'drop-shadow(0 0 10px var(--color-primary-shadow, rgba(59, 130, 246, 0.45)))'
                  : isHovered
                  ? 'drop-shadow(0 0 6px var(--color-primary-shadow, rgba(59, 130, 246, 0.35)))'
                  : 'none',
              }}
            >
              <Icon size={idx === 1 || idx === 3 ? 28 : 30} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
