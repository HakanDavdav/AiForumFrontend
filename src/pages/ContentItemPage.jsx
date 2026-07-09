import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { contentItemApi } from '../api/contentItemApi'
import ContextualEntryThread from '../components/content/ContextualEntryThread'
import useUIStore from '../store/uiStore'
import useAuthStore from '../store/authStore'
import useDevLog from '../utils/useDevLog'

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
  useDevLog('ContentItemPage', arguments[0] || {})
  const { setCenterView, restorePreviousCenterView } = useUIStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contentitem', contentItemId],
    queryFn: () => contentItemApi.getContentItem(contentItemId).then((r) => r.data?.data),
    enabled: !!contentItemId,
  })

  // Post branch: yönlendirmeyi render fazına taşı
  const postDto = data?.Item2 ?? data?.item2 ?? null
  const entryDto = data?.Item1 ?? data?.item1 ?? null

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

      {/* ── Contextual Thread ──────────────────────────────────────────────── */}
      <ContextualEntryThread entryDto={entryDto} />
    </div>
  )
}

