import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/adminApi'
import toast from 'react-hot-toast'

export const EVENT_CATEGORIES = [
  {
    category: 'Custom & System Events',
    events: [
      {
        name: 'UnifyActorPersonalitiesEvent',
        defaultPayload: {
          ParentActorId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'UnifyTribePersonalitiesEvent',
        defaultPayload: {
          ParentTribeId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'GenerateCardHintAndTagsEvent',
        defaultPayload: {
          PersonalityCardId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
    ],
  },
  {
    category: 'Actor Events',
    events: [
      {
        name: 'PostCreatedEvent',
        defaultPayload: {
          ParentActorId: '',
          CreatedPostId: '',
          TribeId: null,
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'EntryCreatedEvent',
        defaultPayload: {
          ParentActorId: '',
          ContentItemId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'LikedEvent',
        defaultPayload: {
          ParentActorId: '',
          ContentItemId: '',
          ReactionType: 'Like',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'FollowedEvent',
        defaultPayload: {
          ParentActorId: '',
          FollowedActorId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'BotCreatedEvent',
        defaultPayload: {
          ParentActorId: '',
          CreatedBotId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'CreatedTribeEvent',
        defaultPayload: {
          ParentActorId: '',
          TribeId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'JoinedTribeEvent',
        defaultPayload: {
          ParentActorId: '',
          TribeId: '',
          JoinedAt: new Date().toISOString(),
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'LeftTribeEvent',
        defaultPayload: {
          ParentActorId: '',
          TribeId: '',
          LeftAt: new Date().toISOString(),
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'ExpelledEvent',
        defaultPayload: {
          ParentActorId: '',
          ExpelledActorId: '',
          TribeId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'PromotedEvent',
        defaultPayload: {
          ParentActorId: '',
          PromotedActorId: '',
          TribeId: '',
          PromotionType: 'Promotion',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'AutoBioRequestEvent',
        defaultPayload: {
          ParentActorId: '',
          RefactoredBotId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
      {
        name: 'AutoInterestsRequestEvent',
        defaultPayload: {
          ParentActorId: '',
          RefactoredBotId: '',
          CreatedAt: new Date().toISOString(),
        },
      },
    ],
  },
]

export default function SystemEventsPanel() {
  const initialEvent = EVENT_CATEGORIES[0].events[0]
  const [selectedEventName, setSelectedEventName] = useState(initialEvent.name)
  const [eventType, setEventType] = useState(initialEvent.name)
  const [payload, setPayload] = useState(JSON.stringify(initialEvent.defaultPayload, null, 2))

  const triggerEventMutation = useMutation({
    mutationFn: (data) => adminApi.triggerSystemCustomEvent(data),
    meta: { showErrorToast: true },
    onSuccess: () => {
      toast.success('System event triggered successfully!')
    },
  })

  const handleSelectEvent = (eventName) => {
    setSelectedEventName(eventName)
    for (const cat of EVENT_CATEGORIES) {
      const found = cat.events.find((e) => e.name === eventName)
      if (found) {
        setEventType(found.name)
        const newPayload = { ...found.defaultPayload, CreatedAt: new Date().toISOString() }
        setPayload(JSON.stringify(newPayload, null, 2))
        break
      }
    }
  }

  const handleTriggerEvent = () => {
    if (!eventType) return toast.error('EventType is required')
    try {
      const parsed = JSON.parse(payload)
      triggerEventMutation.mutate({ eventType, payload: parsed })
    } catch {
      toast.error('Invalid JSON format in Payload')
    }
  }

  const isLoading = triggerEventMutation.isPending

  return (
    <div
      className="card-surface"
      style={{
        padding: 24,
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div
        className="border-b"
        style={{
          borderColor: 'var(--color-border)',
          marginBottom: '12px',
          paddingBottom: '8px',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
          System Events
        </h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
          Sistem olayları tetikleme ve yönetimi
        </p>
      </div>

      <div className="flex flex-col gap-6 w-full">
        {/* Custom Event Section */}
        <div
          style={{
            padding: 16,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border-light)',
          }}
        >
          <div
            style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text)' }}
          >
            System Event
          </div>

          {/* Event Category & Type Selector Dropdown */}
          <div className="form-group" style={{ marginBottom: '8px' }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 3,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              Event Type
            </label>
            <select
              className="input w-full"
              value={selectedEventName}
              onChange={(e) => handleSelectEvent(e.target.value)}
              style={{
                padding: '7px 10px',
                fontSize: 12.5,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              {EVENT_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.events.map((ev) => (
                    <option key={ev.name} value={ev.name}>
                      {ev.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Payload JSON Editor */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label
              className="form-label"
              style={{
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 3,
                display: 'block',
                color: 'var(--color-text-secondary)',
              }}
            >
              Payload
            </label>
            <textarea
              className="input w-full"
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              spellCheck={false}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 12,
                minHeight: 120,
                lineHeight: 1.5,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
                whiteSpace: 'pre',
                resize: 'vertical',
              }}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleTriggerEvent}
            disabled={isLoading}
            style={{
              fontSize: 11.5,
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {isLoading ? 'İşleniyor...' : 'Event Tetikle'}
          </button>
        </div>
      </div>
    </div>
  )
}
