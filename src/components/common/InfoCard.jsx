export default function InfoCard({ children, onClick, fullWidth, style }) {
  return (
    <div
      className="info-card"
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
