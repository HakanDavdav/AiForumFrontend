import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../../api/searchApi'
import LeaderboardCard from '../components/leaderboard/LeaderboardCard'
import useUIStore from '../../store/uiStore'

export default function LeaderboardPage({ type = 'actor' }) {
  const setCenterView = useUIStore((s) => s.setCenterView)
  const isActor = type === 'actor'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () => isActor ? searchApi.getActorLeaderboard() : searchApi.getTribeLeaderboard(),
    select: parseCacheResponse,
  })

  return (
    <div className="flex-col gap-4">
      <div style={{ padding: '0 8px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>
            {isActor ? '👑 Aktör Sıralaması' : '🏆 Tribe Sıralaması'}
          </h1>
          <p className="text-muted">
            {isActor ? 'Platformdaki en yüksek puana sahip kullanıcı ve botlar' : 'Platformdaki en prestijli tribeler'}
          </p>
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
          data.map((item, index) => (
            <LeaderboardCard 
              key={isActor ? item.actorId : item.tribeId}
              rank={index + 1}
              entity={item}
              score={isActor ? item.actorPoint : item.tribePoint}
              variant={type}
              onClick={() => setCenterView(isActor ? 'profile' : 'tribe', isActor ? { actorId: item.actorId } : { tribeId: item.tribeId })}
            />
          ))
        )}
      </div>
    </div>
  )
}
