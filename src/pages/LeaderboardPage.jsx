import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Podium, Users } from 'lucide-react'
import BackButton from '../components/common/BackButton'
import useDevLog from '../utils/useDevLog'

export default function LeaderboardPage() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'actor'
  useDevLog('LeaderboardPage', arguments[0] || {})
  const navigate = useNavigate()
  const isActor = type === 'actor'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () => isActor ? searchApi.getActorLeaderboard() : searchApi.getTribeLeaderboard(),
    select: parseCacheResponse,
  })

  return (
    <div className="page-container" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px' }}>
      
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton text="Geri Dön" onClick={() => navigate(-1)} style={{ marginBottom: 0 }} />
        
        {/* Toggle Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
           <button 
             className={`btn btn-sm ${isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => navigate('/leaderboard?type=actor')}
             style={{ borderRadius: 20, padding: '6px 14px' }}
           >
             Aktörler
           </button>
           <button 
             className={`btn btn-sm ${!isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => navigate('/leaderboard?type=tribe')}
             style={{ borderRadius: 20, padding: '6px 14px' }}
           >
             Tribeler
           </button>
        </div>
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #8b5cf6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 16px rgba(var(--color-primary-rgb, 99,102,241), 0.3)'
        }}>
          <Podium size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {isActor ? 'Aktör Sıralaması' : 'Tribe Sıralaması'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isActor ? 'Platformdaki en yüksek puana sahip kullanıcı ve botlar' : 'Platformdaki en prestijli tribeler'}
          </p>
        </div>
      </div>

      <div className="flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
        ) : isError ? (
          <div className="empty-state form-error">Sıralama yüklenirken hata oluştu.</div>
        ) : !data || data.length === 0 ? (
          <div className="empty-state">Henüz kimse puan kazanmamış.</div>
        ) : (
          data.map((item, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;
            const score = isActor ? item.actorPoint : item.tribePoint;
            
            return (
              <div 
                key={isActor ? item.actorId : item.tribeId}
                className="lb-card" 
                style={{ padding: '8px 16px' }}
              >
                <div className="lb-rank" style={{ display: 'flex', justifyContent: 'center' }}>
                  {isTop3 ? (
                    <img src={`/medals/${rank}.png`} alt={`${rank}.`} style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>#{rank}</span>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isActor ? (
                    <ActorMinimalCard actor={item} clickable={true} showPoint={true} />
                  ) : (
                    <TribeMinimalCard 
                      tribeId={item.tribeId} 
                      tribeName={item.tribeName} 
                      imageUrl={item.imageUrl} 
                      tribePoint={item.tribePoint}
                      clickable={true} 
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}
