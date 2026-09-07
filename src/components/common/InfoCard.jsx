export default function InfoCard({ children, onClick, fullWidth, style, className = '' }) {
  return (
    <div
      className={`info-card ${className}`.trim()}
      onClick={onClick}
      style={{
        ...(onClick ? { cursor: 'pointer' } : {}),
        ...(fullWidth ? { gridColumn: '1 / -1' } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
