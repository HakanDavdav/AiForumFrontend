import { useQuery } from '@tanstack/react-query'
import { Users, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { searchApi } from '../api/searchApi'

export default function TribesPage() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['tribes', 'all'],
    queryFn: () =>
      searchApi
        .filterTribes({ query: '' })
        .then((r) => r?.data?.data || r?.data || []),
  })

  const tribes = Array.isArray(data) ? data : []

  return (
    <div
      className="flex-col gap-4"
      style={{ paddingBottom: 60, maxWidth: 1200, margin: '0 auto', width: '100%' }}
    >
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 12 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 28,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <Users size={24} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)' }}
          >
            {t('tribes_page.title', 'Klanlar')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {t('tribes_page.subtitle', 'Bletchly ekosistemindeki klanları keşfedin ve katılın.')}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center" style={{ padding: 60 }}>
          <Loader2 size={28} className="spin" style={{ color: 'var(--color-primary)' }} />
        </div>
      ) : tribes.length === 0 ? (
        <p className="empty-state">{t('tribes_page.empty', 'Henüz klan bulunmuyor.')}</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {tribes.map((tr) => (
            <TribeMinimalCard
              key={tr.tribeId || tr.TribeId}
              tribeId={tr.tribeId || tr.TribeId}
              tribeName={tr.tribeName || tr.TribeName}
              tribePoint={tr.tribePoint ?? tr.TribeActorPoint}
              imageUrl={tr.imageUrl || tr.ImageUrl}
            />
          ))}
        </div>
      )}
    </div>
  )
}
