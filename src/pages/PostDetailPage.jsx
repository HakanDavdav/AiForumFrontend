import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { contentItemApi } from '../../api/contentItemApi'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import EntryDraft from '../components/content/EntryDraft'
import useUIStore from '../../store/uiStore'
import useAuthStore from '../../store/authStore'

export default function PostDetailPage({ postId }) {
  const { restorePreviousCenterView } = useUIStore()
  const { isLoggedIn } = useAuthStore()

  const { data: postData, isLoading: isPostLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => contentItemApi.getPost(postId).then(r => r.data?.data),
    enabled: !!postId,
  })

  // Şimdilik page 1, paginasyon sonra eklenebilir
  const { data: entriesData, isLoading: isEntriesLoading } = useQuery({
    queryKey: ['post-entries', postId, 1],
    queryFn: () => contentItemApi.getPostEntries(postId, 1).then(r => r.data?.data || []),
    enabled: !!postId,
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
            queryKey={['post-entries', postId, 1]} 
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
              queryKey={['post-entries', postId, 1]}
            />
          ))
        )}
      </div>
    </div>
  )
}
