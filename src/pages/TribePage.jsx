import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut, UserPlus, Settings } from 'lucide-react'
import { tribeApi } from '../../api/tribeApi'
import TribeCard from '../components/tribe/TribeCard'
import ActorAvatar from '../components/actor/ActorAvatar'
import ActorChip from '../components/actor/ActorChip'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

export default function TribePage({ tribeId }) {
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const { setCenterView } = useUIStore()
  const queryClient = useQueryClient()

  const { data: tribe, isLoading } = useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: () => tribeApi.getTribe(tribeId).then(r => r.data?.data),
    enabled: !!tribeId,
  })

  const joinMutation = useMutation({
    mutationFn: () => tribeApi.joinTribe(tribeId),
    onSuccess: () => queryClient.invalidateQueries(['tribe', tribeId]),
  })

  const leaveMutation = useMutation({
    mutationFn: () => tribeApi.leaveTribe(tribeId),
    onSuccess: () => queryClient.invalidateQueries(['tribe', tribeId]),
  })

  if (isLoading) return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  if (!tribe) return <div className="empty-state">Tribe bulunamadı</div>

  const isMember = tribe.membershipList?.some(m => m.actorId === currentUserId)
  const isLeader = tribe.membershipList?.some(m => m.actorId === currentUserId && m.actorRole?.roleName === 'TribeLeader')

  return (
    <div className="flex-col gap-4">
      {/* ─── Tribe Header ─── */}
      <div className="card-surface" style={{ position: 'relative' }}>
        <div className="flex gap-4">
          <div style={{ width: 80, height: 80, flexShrink: 0 }}>
             <TribeCard 
               tribeId={tribe.tribeId} 
               tribeName={tribe.tribeName} 
               imageUrl={tribe.imageUrl} 
               clickable={false}
             />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center justify-between">
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{tribe.tribeName}</h1>
              
              <div className="flex gap-2">
                {isLoggedIn && !isMember && (
                  <button 
                    className="btn btn-primary btn-sm" 
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                  >
                    <UserPlus size={14} /> Katıl
                  </button>
                )}
                {isLoggedIn && isMember && !isLeader && (
                  <button 
                    className="btn btn-outline btn-sm" 
                    onClick={() => leaveMutation.mutate()}
                    disabled={leaveMutation.isPending}
                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                  >
                    <LogOut size={14} /> Ayrıl
                  </button>
                )}
                {isLoggedIn && isLeader && (
                  <button className="btn btn-outline btn-sm">
                    <Settings size={14} /> Yönetim
                  </button>
                )}
              </div>
            </div>

            <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5 }}>
              {tribe.mission || 'Henüz bir misyon belirlenmemiş.'}
            </p>

            <div className="flex items-center gap-6" style={{ marginTop: 16 }}>
              <div className="flex-col">
                <span style={{ fontSize: 20, fontWeight: 700 }}>{tribe.tribePoint?.toLocaleString('tr-TR') ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Puan</span>
              </div>
              <div className="flex-col">
                <span style={{ fontSize: 20, fontWeight: 700 }}>{tribe.memberCount ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Üye</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Members List ─── */}
      <h3 style={{ fontSize: 18, fontWeight: 700, paddingBottom: 8, borderBottom: '1px solid var(--color-border)', marginTop: 16 }}>
        Üyeler ({tribe.membershipList?.length ?? 0})
      </h3>

      <div className="flex-col gap-2">
        {tribe.membershipList?.length === 0 ? (
          <p className="empty-state">Henüz üye yok.</p>
        ) : (
          tribe.membershipList?.map(member => (
            <div key={member.actorId} className="card-surface flex items-center justify-between" style={{ padding: '8px 12px' }}>
              <ActorChip actor={member} />
              <div className="flex items-center gap-4">
                <span className="badge" style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-secondary)' }}>
                  {member.actorRole?.roleName || 'Üye'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
