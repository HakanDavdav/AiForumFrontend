import PersonalityCard from './PersonalityCard'

export default function CardSlots({ cards, slotCount, showMark = true }) {
  const count = Math.max(1, slotCount || 4)

  return (
    <div className="personality-card-slots" style={{ '--card-count': count }}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="personality-card-slot"
          style={{
            '--slot-count': count,
            '--slot-index': i,
            '--slot-rotation': `${count === 1 ? 0 : ((i / (count - 1)) * 2 - 1) * 8}deg`,
            '--slot-z': count - Math.abs(i - (count - 1) / 2),
          }}
        >
          <PersonalityCard slotNumber={i + 1} card={cards?.[i] || null} showMark={showMark} />
        </div>
      ))}
    </div>
  )
}
