import { useId } from 'react'

export default function BotFlashCardsIcon({ size = 24, className, style, ...props }) {
  const cardStrokeWidth = 30
  const backCardStrokeWidth = cardStrokeWidth
  const botStrokeWidth = 15.5
  const idPrefix = `bot-flash-cards-${useId().replace(/:/g, '')}`
  const rearMaskId = `${idPrefix}-rear-mask`
  const middleMaskId = `${idPrefix}-middle-mask`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      style={style}
      shapeRendering="geometricPrecision"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <mask id={rearMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#ffffff" />
          <rect
            x="160"
            y="90"
            width="220"
            height="310"
            rx="24"
            fill="#000000"
            stroke="#000000"
            strokeWidth={backCardStrokeWidth}
            strokeLinejoin="round"
            transform="rotate(15 270 245)"
          />
          <rect
            x="57"
            y="16"
            width="266"
            height="368"
            rx="30"
            fill="#000000"
            stroke="#000000"
            strokeWidth={cardStrokeWidth}
            strokeLinejoin="round"
            transform="translate(0 18) rotate(-18 190 200)"
          />
        </mask>
        <mask id={middleMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
          <rect width="512" height="512" fill="#ffffff" />
          <rect
            x="57"
            y="16"
            width="266"
            height="368"
            rx="30"
            fill="#000000"
            stroke="#000000"
            strokeWidth={cardStrokeWidth}
            strokeLinejoin="round"
            transform="translate(0 18) rotate(-18 190 200)"
          />
        </mask>
      </defs>

      <g mask={`url(#${rearMaskId})`}>
        <rect
          x="180"
          y="160"
          width="220"
          height="310"
          rx="24"
          fill="none"
          stroke="currentColor"
          strokeWidth={backCardStrokeWidth}
          strokeLinejoin="round"
          transform="rotate(45 290 315)"
        />
      </g>

      <g mask={`url(#${middleMaskId})`}>
        <rect
          x="160"
          y="90"
          width="220"
          height="310"
          rx="24"
          fill="none"
          stroke="currentColor"
          strokeWidth={backCardStrokeWidth}
          strokeLinejoin="round"
          transform="rotate(15 270 245)"
        />
      </g>

      <g transform="translate(0 18) rotate(-18 190 200)">
        <rect
          x="57"
          y="16"
          width="266"
          height="368"
          rx="30"
          fill="none"
          stroke="currentColor"
          strokeWidth={cardStrokeWidth}
          strokeLinejoin="round"
        />

        <g transform="translate(190 200) scale(1.9)">
          <path
            d="M 12 -30 L 12 -48 L -12 -48"
            fill="none"
            stroke="currentColor"
            strokeWidth={botStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="-54"
            y1="0"
            x2="-40"
            y2="0"
            stroke="currentColor"
            strokeWidth={botStrokeWidth}
            strokeLinecap="round"
          />
          <line
            x1="40"
            y1="0"
            x2="54"
            y2="0"
            stroke="currentColor"
            strokeWidth={botStrokeWidth}
            strokeLinecap="round"
          />
          <rect
            x="-40"
            y="-30"
            width="80"
            height="60"
            rx="14"
            fill="none"
            stroke="currentColor"
            strokeWidth={botStrokeWidth}
            strokeLinejoin="round"
          />
          <rect x="-22" y="-8" width="12" height="16" rx="4" fill="currentColor" />
          <rect x="10" y="-8" width="12" height="16" rx="4" fill="currentColor" />
        </g>
      </g>
    </svg>
  )
}
