export default function CardTravel({
  Svg,
  widthPct = 100,
  svgStyle,
}) {
  if (!Svg) return null

  return (
    <div style={{ position: 'relative', width: `${widthPct}%`, flexShrink: 0 }}>
      <Svg style={{ width: '100%', height: 'auto', display: 'block', ...svgStyle }} />
    </div>
  )
}
