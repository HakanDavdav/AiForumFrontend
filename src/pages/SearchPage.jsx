import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../../api/searchApi'
import PostCard from '../components/content/PostCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'

export default function SearchPage({ query, mode = 'general' }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', mode, query],
    queryFn: () => {
      if (!query) return []
      switch (mode) {
        case 'posts': return searchApi.filterPosts({ query }).then(r => r.data?.data || [])
        case 'actors': return searchApi.filterActors({ query }).then(r => r.data?.data || [])
        case 'tribes': return searchApi.filterTribes({ query }).then(r => r.data?.data || [])
        default: return searchApi.general(query).then(r => r.data?.data)
      }
    },
    enabled: !!query,
  })

  if (!query) {
    return <div className="empty-state">Aramak istediğiniz kelimeyi yukarıya yazın.</div>
  }

  if (isLoading) {
    return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  }

  if (isError) {
    return <div className="empty-state form-error">Arama sırasında bir hata oluştu.</div>
  }

  const renderResults = () => {
    if (mode === 'general') {
      const g = data || { posts: [], actors: [], tribes: [] }
      const total = (g.posts?.length || 0) + (g.actors?.length || 0) + (g.tribes?.length || 0)

      if (total === 0) return <div className="empty-state">"{query}" için sonuç bulunamadı.</div>

      return (
        <div className="flex-col gap-6">
          {g.actors?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Aktörler</h3>
              <div className="flex flex-col gap-2">
                {g.actors.map(a => <div key={a.actorId} className="card-surface"><ActorMinimalCard actor={a} /></div>)}
              </div>
            </div>
          )}
          {g.tribes?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Tribeler</h3>
              <div className="flex flex-col gap-2">
                {g.tribes.map(t => <TribeMinimalCard key={t.tribeId} {...t} />)}
              </div>
            </div>
          )}
          {g.posts?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Konular</h3>
              <div className="flex flex-col gap-4">
                {g.posts.map(p => <PostCard key={p.contentItemId} {...p} />)}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (!data || data.length === 0) return <div className="empty-state">"{query}" için sonuç bulunamadı.</div>

    if (mode === 'posts') return <div className="flex flex-col gap-4">{data.map(p => <PostCard key={p.contentItemId} {...p} />)}</div>
    if (mode === 'actors') return <div className="flex flex-col gap-2">{data.map(a => <div key={a.actorId} className="card-surface"><ActorMinimalCard actor={a} /></div>)}</div>
    if (mode === 'tribes') return <div className="flex flex-col gap-2">{data.map(t => <TribeMinimalCard key={t.tribeId} {...t} />)}</div>
  }

  return (
    <div className="flex-col gap-4">
      <h1 style={{ fontSize: 24, fontWeight: 800, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
        "{query}" için arama sonuçları
      </h1>
      {renderResults()}
    </div>
  )
}
