import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { contentItemApi } from '../../api/contentItemApi'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import EntryDraft from '../components/content/EntryDraft'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

export default function PostDetailPage({ postId }) {
  const { restorePreviousCenterView } = useUIStore()
  const { isLoggedIn } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: postData, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => contentItemApi.getPost(postId).then(r => r.data?.data),
    enabled: !!postId,
  })

  const [page, setPage] = useState(1)
  
  // Backend'den perPage gelmediği için, page=1'deki data uzunluğuna bakarak limiti çıkarıyoruz.
  const [inferredPerPage, setInferredPerPage] = useState(20)

  const { data: entriesData, isLoading: isEntriesLoading, isFetching: isEntriesFetching } = useQuery({
    queryKey: ['post-entries', postId, page],
    queryFn: () => contentItemApi.getPostEntries(postId, page).then(r => {
      const data = r.data?.data || []
      // Sadece 1. sayfadayken ve toplam entry sayısından az eleman gelmişse, bu tam sayfa kapasitesidir.
      if (page === 1 && postData && postData.entryCount > data.length) {
        setInferredPerPage(data.length)
      }
      return data
    }),
    enabled: !!postId && !!postData,
  })

  if (isPostLoading || isEntriesLoading) {
    return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  }

  if (!postData) {
    return (
      <div className="empty-state">
        Konu bulunamadı.
        <br />
        <button className="btn btn-ghost" onClick={restorePreviousCenterView} style={{ marginTop: 16 }}>Geri Dön</button>
      </div>
    )
  }

  return (
    <div className="flex-col gap-4">
      {/* Top Navigation */}
      <div className="flex items-center gap-4" style={{ marginBottom: 8 }}>
        <button className="btn-icon" onClick={restorePreviousCenterView} style={{ background: 'var(--color-surface-2)' }}>
          <ArrowLeft size={18} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>Geri Dön</span>
      </div>

      {/* Main Post */}
      <PostCard {...postData} isSticky={true} />

      {/* Ana Posta Doğrudan Cevap Yazma Kutusu */}
      {isLoggedIn && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>
            Konuya Cevap Yaz
          </h3>
          <EntryDraft 
            parentContentItemId={postId} 
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['post-entries', postId] })
              queryClient.invalidateQueries({ queryKey: ['post', postId] })
              setPage(1) // Reset to first page to see the new entry
            }}
          />
        </div>
      )}

      {/* Entries List */}
      <div className="flex-col gap-4" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>
          Yorumlar ({postData.entryCount ?? 0})
        </h3>
        
        {(!entriesData || entriesData.length === 0) ? (
           <p className="empty-state" style={{ paddingTop: 40 }}>İlk yorumu siz yapın!</p>
        ) : (
          entriesData.map(entry => (
            <EntryCard 
              key={entry.contentItemId} 
              {...entry} 
              queryKey={['post-entries', postId, page]}
            />
          ))
        )}

        {/* Pagination Controls */}
        {postData.entryCount > inferredPerPage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            marginTop: 24,
            paddingTop: 16,
            borderTop: '1px solid var(--color-border)'
          }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 1 || isEntriesFetching}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} /> Önceki
            </button>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Sayfa {page} / {Math.max(1, Math.ceil((postData.entryCount || 0) / inferredPerPage))}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= Math.ceil((postData.entryCount || 0) / inferredPerPage) || isEntriesFetching}
              onClick={() => setPage(p => p + 1)}
            >
              Sonraki <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
