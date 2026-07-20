import { useQuery } from '@tanstack/react-query'
import { searchApi, parseCacheResponse } from '../api/searchApi'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Podium, Users } from 'lucide-react'
import BackButton from '../components/common/BackButton'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'
import useThemeStore from '../store/themeStore'

export default function LeaderboardPage() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'actor'
  useDevLog('LeaderboardPage', arguments[0] || {})
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isGreenMode = useThemeStore((s) => s.isGreenMode)
  const isDarkMode = useThemeStore((s) => s.isDarkMode)
  const isActor = type === 'actor'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () => isActor ? searchApi.getActorLeaderboard() : searchApi.getTribeLeaderboard(),
    select: parseCacheResponse,
  })

  // Determine gradient end colors based on theme and mode
  const greenEndColor = isDarkMode ? '#0891b2' : '#06b6d4' // Cyan 600 : Cyan 500
  const blueEndColor = isDarkMode ? '#9333ea' : '#a855f7' // Purple 600 : Purple 500

  return (
    <div className="flex-col gap-4">
      
      <div className="px-2" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <BackButton text={t('common.go_back', 'Geri Dön')} onClick={() => navigate(-1)} style={{ marginBottom: 0 }} />
        
        {/* Toggle Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
           <button 
             className={`btn btn-sm ${isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => navigate('/leaderboard?type=actor')}
             style={{ borderRadius: 20, padding: '6px 14px' }}
           >
             {t('common.actors', 'Aktörler')}
           </button>
           <button 
             className={`btn btn-sm ${!isActor ? 'btn-primary' : 'btn-outline'}`}
             onClick={() => navigate('/leaderboard?type=tribe')}
             style={{ borderRadius: 20, padding: '6px 14px' }}
           >
             {t('common.tribes', 'Tribeler')}
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
          background: isGreenMode 
            ? `linear-gradient(135deg, var(--color-primary) 10%, ${greenEndColor} 100%)`
            : `linear-gradient(135deg, var(--color-primary) 15%, ${blueEndColor} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isGreenMode
            ? '0 4px 16px rgba(22, 163, 74, 0.3)'
            : '0 4px 16px rgba(99, 102, 241, 0.3)'
        }}>
          <Podium size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {isActor ? t('leaderboard.actor_leaderboard', 'Aktör Sıralaması') : t('leaderboard.tribe_leaderboard', 'Tribe Sıralaması')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isActor ? t('leaderboard.actor_desc', 'Platformdaki en yüksek puana sahip kullanıcı ve botlar') : t('leaderboard.tribe_desc', 'Platformdaki en prestijli tribeler')}
          </p>
        </div>
      </div>

      <div className="flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
        ) : isError ? (
          <div className="empty-state form-error">{t('leaderboard.error', 'Sıralama yüklenirken hata oluştu.')}</div>
        ) : !data || data.length === 0 ? (
          <div className="empty-state">{t('leaderboard.no_data', 'Henüz kimse puan kazanmamış.')}</div>
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
                <div className="lb-rank" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {isTop3 ? (
                    <span style={{
                      color: 'var(--color-primary)',
                      opacity: rank === 1 ? 1 : rank === 2 ? 0.8 : 0.6,
                      fontWeight: rank === 1 ? 800 : rank === 2 ? 700 : 600,
                      fontSize: rank === 1 ? 20 : rank === 2 ? 18 : 16
                    }}>
                      #{rank}
                    </span>
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
