import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut, UserPlus, Settings } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tribeApi } from '../api/tribeApi'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import useAuthStore from '../store/authStore'
import useDevLog from '../utils/useDevLog'

export default function TribePage() {
  const [searchParams] = useSearchParams()
  const tribeId = searchParams.get('tribeId')
  useDevLog('TribePage', arguments[0] || {})
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
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

  const isMember = tribe.tribeMemberships?.some(m => m.actor?.actorId === currentUserId)
  const isLeader = tribe.tribeMemberships?.some(m => m.actor?.actorId === currentUserId && m.roleName === 'TribeLeader')

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Tribe Header ─── */}
      <div className="card-surface" style={{ position: 'relative' }}>
        <div className="flex gap-4">
          <div style={{ width: 80, height: 80, flexShrink: 0 }}>
            {tribe.imageUrl ? (
              <img src={tribe.imageUrl} alt={tribe.tribeName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-xl)' }} />
            ) : (
              <div
                style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  fontWeight: 800, fontSize: 32, borderRadius: 'var(--radius-xl)'
                }}
              >
                {tribe.tribeName?.[0] || 'T'}
              </div>
            )}
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
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/tribe/settings?tribeId=' + tribeId)}
                  >
                    <Settings size={14} /> Yönetim
                  </button>
                )}
              </div>
            </div>

            <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5 }}>
              {tribe.mission || 'Henüz bir misyon belirlenmemiş.'}
            </p>

            {tribe.createdAt && (
              <p className="text-muted" style={{ margin: '4px 0 12px 0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📅 Kuruluş: {new Date(tribe.createdAt).toLocaleDateString('tr-TR')}</span>
              </p>
            )}

            <div className="profile-stats-grid" style={{ marginTop: 16 }}>
              <div className="profile-stat-box">
                <span className="profile-stat-value">{tribe.tribePoint?.toLocaleString('tr-TR') ?? 0}</span>
                <span className="profile-stat-label">Puan</span>
              </div>
              <div className="profile-stat-box">
                <span className="profile-stat-value">{tribe.memberCount ?? 0}</span>
                <span className="profile-stat-label">Üye</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tribe Modifiers (Only for Leaders usually) ─── */}
      {(tribe.personalityModifier || tribe.instructionModifier) && (
        <div className="card-surface" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Tribe Özellikleri</h3>
          <div className="flex-col gap-4">
            {tribe.personalityModifier && (
              <div>
                <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kişilik Etkisi (Personality Modifier)</span>
                <div className="bg-surface p-3 rounded-lg mt-1 text-sm border border-border">{tribe.personalityModifier}</div>
              </div>
            )}
            {tribe.instructionModifier && (
              <div>
                <span className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Talimat Etkisi (Instruction Modifier)</span>
                <div className="bg-surface p-3 rounded-lg mt-1 text-sm border border-border">{tribe.instructionModifier}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Members List ─── */}
      <h3 style={{ fontSize: 18, fontWeight: 700, paddingBottom: 8, borderBottom: '1px solid var(--color-border)', marginTop: 16 }}>
        Üyeler ({tribe.tribeMemberships?.length ?? 0})
      </h3>

      <div className="flex-col gap-2">
        {tribe.tribeMemberships?.length === 0 ? (
          <p className="empty-state">Henüz üye yok.</p>
        ) : (
          tribe.tribeMemberships?.map(member => (
            member.actor ? (
              <div key={member.actor.actorId} className="card-surface flex items-center justify-between" style={{ padding: '8px 12px' }}>
                <ActorMinimalCard actor={member.actor} />
                <div className="flex items-center gap-4">
                  <span className="badge" style={{ background: member.roleName === 'TribeLeader' ? 'var(--color-primary-light)' : 'var(--color-surface-3)', color: member.roleName === 'TribeLeader' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                    {member.roleName === 'TribeLeader' ? 'Lider' : member.roleName || 'Üye'}
                  </span>
                </div>
              </div>
            ) : null
          ))
        )}
      </div>
    </div>
  )
}
