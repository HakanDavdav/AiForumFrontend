// TopicTag & TopicTagList
import { TopicLabels, TopicColors, TopicTypes, parseTopicFlags } from '../../constants/enums'

export function TopicTag({ topicType, size = 'sm', onClick }) {
  const label = TopicLabels[topicType] || `Konu ${topicType}`
  const color = TopicColors[topicType] || '#64748B'

  return (
    <span
      className="topic-tag"
      style={{
        background: color + '20',
        color: color,
        fontSize: size === 'sm' ? '11px' : '13px',
        padding: size === 'sm' ? '2px 8px' : '3px 12px',
      }}
      onClick={onClick}
      title={label}
    >
      {label}
    </span>
  )
}

export function TopicTagList({ topicTypes, max = 5 }) {
  if (!topicTypes || topicTypes.length === 0) return null

  // Backend array of int → parse
  const parsed = parseTopicFlags(topicTypes)
  const visible = parsed.slice(0, max)
  const rest = parsed.length - visible.length

  return (
    <div className="topic-tag-list">
      {visible.map((t) => (
        <TopicTag key={t} topicType={t} />
      ))}
      {rest > 0 && (
        <span className="badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
          +{rest}
        </span>
      )}
    </div>
  )
}

export default TopicTag
