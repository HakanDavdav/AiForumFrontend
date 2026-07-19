import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { searchApi } from '../api/searchApi'
import PostCard from '../components/content/PostCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('query') || ''
  const mode = searchParams.get('mode') || 'general'
  const orderType = searchParams.get('orderType') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  
  useDevLog('SearchPage', arguments[0] || {})

  // Ensure orderType is never empty string
  const finalOrderType = orderType || 'None'
  const { t } = useTranslation()

  console.log('SearchPage params:', { query, mode, orderType: finalOrderType, startDate, endDate })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', mode, query, finalOrderType, startDate, endDate],
    queryFn: () => {
      if (!query && mode === 'general') return []

      console.log('API call params:', {
        query,
        mode,
        orderType: finalOrderType,
        startDate,
        endDate,
      })

      switch (mode) {
        case 'posts':
          return searchApi
            .filterPosts({ query, orderType: finalOrderType, startDate, endDate })
            .then((r) => r.data?.data || [])
        case 'actors':
          return searchApi
            .filterActors({ query, orderType: finalOrderType, startDate, endDate })
            .then((r) => r.data?.data || [])
        case 'tribes':
          return searchApi
            .filterTribes({ query, orderType: finalOrderType, startDate, endDate })
            .then((r) => r.data?.data || [])
        default:
          return searchApi.general(query).then((r) => {
            const data = r.data?.data
            console.log('General search response:', data)
            return {
              posts: data?.posts || data?.Posts || [],
              actors: data?.actors || data?.Actors || [],
              tribes: data?.tribes || data?.Tribes || [],
            }
          })
      }
    },
    enabled: !!query || mode !== 'general',
  })

  if (!query && mode === 'general') {
    return <div className="empty-state">{t('search.type_to_search')}</div>
  }

  if (isLoading) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (isError) {
    return <div className="empty-state form-error">{t('search.error')}</div>
  }

  const renderResults = () => {
    if (mode === 'general') {
      const g = data || { posts: [], actors: [], tribes: [] }
      const total = (g.posts?.length || 0) + (g.actors?.length || 0) + (g.tribes?.length || 0)

      if (total === 0) return <div className="empty-state">{t('search.no_results_for', { query })}</div>

      return (
        <div className="flex-col gap-6">
          {g.actors?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('search.actors')}</h3>
              <div className="flex flex-col gap-2">
                {g.actors.map((a) => (
                  <div key={a.actorId} className="card-surface">
                    <ActorMinimalCard actor={a} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {g.tribes?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('search.tribes')}</h3>
              <div className="flex flex-col gap-2">
                {g.tribes.map((t) => (
                  <TribeMinimalCard key={t.tribeId} {...t} />
                ))}
              </div>
            </div>
          )}
          {g.posts?.length > 0 && (
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{t('search.posts')}</h3>
              <div className="flex flex-col gap-4">
                {g.posts.map((p) => (
                  <PostCard key={p.contentItemId} {...p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (!data || data.length === 0)
      return (
        <div className="empty-state">
          {query ? t('search.no_results_for', { query }) : t('search.no_results')}
        </div>
      )

    if (mode === 'posts')
      return (
        <div className="flex flex-col gap-4">
          {data.map((p) => (
            <PostCard key={p.contentItemId} {...p} />
          ))}
        </div>
      )
    if (mode === 'actors')
      return (
        <div className="flex flex-col gap-2">
          {data.map((a) => (
            <div key={a.actorId} className="card-surface">
              <ActorMinimalCard actor={a} />
            </div>
          ))}
        </div>
      )
    if (mode === 'tribes')
      return (
        <div className="flex flex-col gap-2">
          {data.map((t) => (
            <TribeMinimalCard key={t.tribeId} {...t} />
          ))}
        </div>
      )
  }

  return (
    <div className="flex-col gap-4">
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          {query ? t('search.results_for', { query }) : t('search.results')}
        </h1>
        {mode !== 'general' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {orderType && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 16,
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {t('search.order')}
                {orderType === 'Oldest'
                  ? t('search.oldest')
                  : orderType === 'Newest'
                    ? t('search.newest')
                    : orderType === 'MostLiked'
                      ? t('search.most_liked')
                      : orderType}
              </span>
            )}
            {startDate && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 16,
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {t('search.start_date')}{new Date(startDate).toLocaleDateString(undefined)}
              </span>
            )}
            {endDate && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: 16,
                  background: 'var(--color-bg-alt)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {t('search.end_date')}{new Date(endDate).toLocaleDateString(undefined)}
              </span>
            )}
          </div>
        )}
      </div>
      {renderResults()}
    </div>
  )
}
