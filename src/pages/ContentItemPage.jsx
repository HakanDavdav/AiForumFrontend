import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { contentItemApi } from '../api/contentItemApi'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import useUIStore from '../store/uiStore'
import useAuthStore from '../store/authStore'

/**
 * ContentItemPage — plan.md "Contextual Entry Thread" (satır 167–178)
 *
 * GET /api/contentitem/{contentItemId}
 * → WebIdentityResult<(EntryDto?, PostDto?)>
 * Serialize edilen tuple: { item1: EntryDto|null, item2: PostDto|null }
 *
 * Discriminasyon:
 *   - item2 (PostDto) dolu → PostDetailPage'e yönlendir (setCenterView('post'))
 *   - item1 (EntryDto) dolu → bağlamsal entry thread render et:
 *       Üst: root PostCard (tıklanabilir)
 *       Orta: parentEntry zinciri (girinti + opacity azalarak)
 *       Alt: odaklanan EntryCard (highlight)
 */
export default function ContentItemPage({ contentItemId }) {
  const { setCenterView, restorePreviousCenterView } = useUIStore()
  const { isLoggedIn, actorId } = useAuthStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contentitem', contentItemId],
    queryFn: () =>
      contentItemApi.getContentItem(contentItemId).then((r) => r.data?.data),
    enabled: !!contentItemId,
  })

  // Post branch: yönlendirmeyi render fazına taşı
  const postDto  = data?.item2 ?? null
  const entryDto = data?.item1 ?? null

  useEffect(() => {
    if (postDto && !entryDto) {
      setCenterView('post', { postId: postDto.contentItemId })
    }
  }, [postDto, entryDto, setCenterView])

  // ─── Loading / Error ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="empty-state">
        İçerik bulunamadı.
        <br />
        <button
          className="btn btn-ghost"
          onClick={restorePreviousCenterView}
          style={{ marginTop: 16 }}
        >
          Geri Dön
        </button>
      </div>
    )
  }

  // Post branch: setCenterView useEffect'te tetiklenirken boş render
  if (postDto && !entryDto) return null

  if (!entryDto) {
    return (
      <div className="empty-state">
        Beklenmedik içerik formatı.
        <button
          className="btn btn-ghost"
          onClick={restorePreviousCenterView}
          style={{ marginTop: 16 }}
        >
          Geri Dön
        </button>
      </div>
    )
  }

  // ─── Parent entry zincirini en eski → en yeni sıralar ───────────────────────
  const buildParentChain = (entry) => {
    const chain = []
    let current = entry?.parentEntry
    while (current) {
      chain.unshift(current)   // başa ekle → root'a yakın üstte olur
      current = current.parentEntry
    }
    return chain
  }

  const parentChain = buildParentChain(entryDto)
  const rootPost    = entryDto.parentPost
  const isOwner     = (item) => isLoggedIn && item?.actor?.actorId === actorId

  return (
    <div className="flex-col gap-4">
      {/* ── Geri butonu ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4" style={{ marginBottom: 4 }}>
        <button
          className="btn-icon"
          onClick={restorePreviousCenterView}
          style={{ background: 'var(--color-surface-2)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Geri Dön
        </span>
      </div>

      {/* ── Root Post ──────────────────────────────────────────────────────── */}
      {rootPost && (
        <div>
          <SectionLabel color="var(--color-text-faint)">ANA KONU</SectionLabel>
          <PostCard {...rootPost} isOwner={isOwner(rootPost)} />
        </div>
      )}

      {/* ── Parent Entry Zinciri ───────────────────────────────────────────── */}
      {parentChain.length > 0 && (
        <div>
          <SectionLabel color="var(--color-text-faint)">BAĞLAM</SectionLabel>
          <div className="flex-col" style={{ gap: 2 }}>
            {parentChain.map((parentEntry, idx) => (
              <div
                key={parentEntry.contentItemId}
                style={{
                  marginLeft: idx * 14,
                  opacity: Math.max(0.45, 1 - idx * 0.15),
                  borderLeft: '2px solid var(--color-border)',
                  paddingLeft: 12,
                  paddingTop: 4,
                  paddingBottom: 4,
                }}
              >
                <EntryCard
                  {...parentEntry}
                  depth={idx}
                  isOwner={isOwner(parentEntry)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Odaklanan Entry (highlight) ────────────────────────────────────── */}
      <div>
        <SectionLabel color="var(--color-primary)">ODAKLANAN YANIT</SectionLabel>
        <div
          style={{
            borderLeft: '3px solid var(--color-primary)',
            borderRadius: '0 8px 8px 0',
            background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
            paddingLeft: 12,
          }}
        >
          <EntryCard
            {...entryDto}
            depth={0}
            isOwner={isOwner(entryDto)}
          />
        </div>
      </div>
    </div>
  )
}

// ─── küçük yardımcı ──────────────────────────────────────────────────────────
function SectionLabel({ children, color }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color,
        marginBottom: 6,
        paddingLeft: 4,
      }}
    >
      {children}
    </p>
  )
}
