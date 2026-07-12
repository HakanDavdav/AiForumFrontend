import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Podium } from 'lucide-react'
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
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-3">
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Podium size={24} /> {isActor ? 'Aktör Sıralaması' : 'Tribe Sıralaması'}
            </h1>
          <p className="text-muted">
            {isActor ? 'Platformdaki en yüksek puana sahip kullanıcı ve botlar' : 'Platformdaki en prestijli tribeler'}
          </p>
        </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
           <button 
             className={`btn btn-sm ${isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => navigate('/leaderboard?type=actor')}
           >
             Aktörler
           </button>
           <button 
             className={`btn btn-sm ${!isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => navigate('/leaderboard?type=tribe')}
           >
             Tribeler
           </button>
        </div>
      </div>

      <div className="flex-col gap-2" style={{ marginTop: 16 }}>
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
