import { useTranslation } from 'react-i18next'
import PersonalityCard from './PersonalityCard'

export default function CardSlots({ cards, slotCount }) {
  const { t } = useTranslation()
  const count = slotCount || 4

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <PersonalityCard
            compact
            card={cards?.[i] || null}
          />
        </div>
      ))}
    </div>
  )
}