import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { contentItemApi } from '../api/contentItemApi'
import ContextualEntryThread from '../components/content/ContextualEntryThread'
import BackButton from '../components/common/BackButton'
import useAuthStore from '../store/authStore'
import useDevLog from '../utils/useDevLog'

/**
 * ContentItemPage — plan.md "Contextual Entry Thread" (satır 167–178)
 *
 * GET /api/contentitem/{contentItemId}
 * → WebIdentityResult<SingularContentItemDto>
 * Serialize edilen object: { entry: EntryDto|null, post: PostDto|null }
 *
 * Discriminasyon:
 *   - item2 (PostDto) dolu → PostDetailPage'e yönlendir (navigate('/post/:id'))
 *   - item1 (EntryDto) dolu → bağlamsal entry thread render et:
 *       Üst: root PostCard (tıklanabilir)
 *       Orta: parentEntry zinciri (girinti + opacity azalarak)
 *       Alt: odaklanan EntryCard (highlight)
 */
export default function ContentItemPage() {
  const [searchParams] = useSearchParams()
  const contentItemId = searchParams.get('contentItemId')
  useDevLog('ContentItemPage', arguments[0] || {})
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contentitem', contentItemId],
    queryFn: () => contentItemApi.getContentItem(contentItemId).then((r) => r.data?.data),
    enabled: !!contentItemId,
  })

  // Post branch: yönlendirmeyi render fazına taşı
  const postDto = data?.post ?? data?.Post ?? null
  const entryDto = data?.entry ?? data?.Entry ?? null

  useEffect(() => {
    if (postDto && !entryDto) {
      navigate('/post?postId=' + postDto.contentItemId)
    }
  }, [postDto, entryDto, navigate])

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
          onClick={() => navigate(-1)}
          style={{ marginTop: 16 }}
        >
          Geri Dön
        </button>
      </div>
    )
  }

  // Post branch: navigate useEffect'te tetiklenirken boş render
  if (postDto && !entryDto) return null

  if (!entryDto) {
    return (
      <div className="empty-state">
        Beklenmedik içerik formatı.
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
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
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ── Contextual Thread ──────────────────────────────────────────────── */}
      <ContextualEntryThread entryDto={entryDto} />
    </div>
  )
}

