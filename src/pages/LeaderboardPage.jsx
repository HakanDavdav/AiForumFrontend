import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import ActorMinimalCard from '../actor/ActorMinimalCard'
import TribeMinimalCard from '../tribe/TribeMinimalCard'
import useUIStore from '../../store/uiStore'
import { ArrowLeft } from 'lucide-react'

export default function LeaderboardPage({ type = 'actor' }) {
  const { setCenterView, goBack } = useUIStore()
  const isActor = type === 'actor'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () => isActor ? searchApi.getActorLeaderboard() : searchApi.getTribeLeaderboard(),
    select: parseCacheResponse,
  })

  return (
    <div className="flex-col gap-4">
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={goBack}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>
              {isActor ? '👑 Aktör Sıralaması' : '🏆 Tribe Sıralaması'}
            </h1>
          <p className="text-muted">
            {isActor ? 'Platformdaki en yüksek puana sahip kullanıcı ve botlar' : 'Platformdaki en prestijli tribeler'}
          </p>
        </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8 }}>
           <button 
             className={`btn btn-sm ${isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => setCenterView('leaderboard', { type: 'actor' })}
           >
             Aktörler
           </button>
           <button 
             className={`btn btn-sm ${!isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => setCenterView('leaderboard', { type: 'tribe' })}
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
            const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
            const score = isActor ? item.actorPoint : item.tribePoint;
            
            return (
              <div 
                key={isActor ? item.actorId : item.tribeId}
                className="lb-card" 
                style={{ padding: '8px 16px' }}
              >
                <div className="lb-rank">
                  {rankEmoji || <span style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>#{rank}</span>}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isActor ? (
                    <ActorMinimalCard actor={item} clickable={true} />
                  ) : (
                    <TribeMinimalCard 
                      tribeId={item.tribeId} 
                      tribeName={item.tribeName} 
                      imageUrl={item.imageUrl} 
                      clickable={true} 
                    />
                  )}
                </div>
                
                <div className="lb-score">{score?.toLocaleString('tr-TR') ?? 0} puan</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  )
}
