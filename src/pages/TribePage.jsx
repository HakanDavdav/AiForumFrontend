import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut, UserPlus, Settings, ChevronLeft, ChevronRight, Brain, CalendarFold, Sparkles, Terminal } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tribeApi } from '../api/tribeApi'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import PostCard from '../components/content/PostCard'
import useAuthStore from '../store/authStore'
import useMyEntitiesStore from '../store/myEntitiesStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function TribePage() {
  const [searchParams] = useSearchParams()
  const tribeId = searchParams.get('tribeId')
  const [postsPage, setPostsPage] = useState(1)
  const inferredPerPage = 5
  useDevLog('TribePage', arguments[0] || {})
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const [isBouncing, setIsBouncing] = useState(false)

  const { data: tribe, isLoading } = useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: () => tribeApi.getTribe(tribeId).then(r => r.data?.data),
    enabled: !!tribeId,
  })

  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['tribe-posts', tribeId, postsPage],
    queryFn: () => tribeApi.getTribePosts(tribeId, postsPage).then(res => res.data?.data),
    enabled: !!tribeId,
  })

  const joinMutation = useMutation({
    mutationFn: () => tribeApi.joinTribe(tribeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tribe', tribeId])
      useMyEntitiesStore.getState().fetchMyTribes()
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => tribeApi.leaveTribe(tribeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tribe', tribeId])
      useMyEntitiesStore.getState().fetchMyTribes()
    },
  })

  if (isLoading) return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  if (!tribe) return <div className="empty-state">{t('tribe.not_found')}</div>

  const isMember = tribe.tribeMemberships?.some(m => m.actor?.actorId === currentUserId)
  const isLeader = tribe.tribeMemberships?.some(m => m.actor?.actorId === currentUserId && m.roleName === 'TribeLeader')

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Tribe Header ─── */}
      <div className="profile-header-card" style={{ position: 'relative' }}>
        <div className="flex justify-between" style={{ gap: 20, width: '100%', alignItems: 'stretch' }}>

          {/* ─── LEFT COLUMN ─── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', paddingBottom: 4 }}>
            <div>
              <div className="flex items-center" style={{ gap: 16 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{tribe.tribeName}</h1>
              </div>

              <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
                {tribe.mission || t('tribe.no_mission')}
              </p>

              {tribe.createdAt && (
                <p className="text-muted" style={{ margin: '4px 0 0 0', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CalendarFold size={14} />
                  <span>{t('tribe.founded')}{new Date(tribe.createdAt).toLocaleDateString('tr-TR')}</span>
                </p>
              )}
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ paddingTop: 16 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/mind?tribeId=' + tribeId)}
              >
                <Brain size={14} /> {t('profile.memories')}
              </button>
            </div>
          </div>

          {/* ─── VERTICAL DIVIDER ─── */}
          <div style={{ width: 2, background: 'var(--color-border)', marginTop: 8, marginBottom: 8, borderRadius: 2 }} />

          {/* ─── RIGHT COLUMN ─── */}
          <div style={{ width: 144, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 4 }}>
            {tribe.imageUrl ? (
              <img src={tribe.imageUrl} alt={tribe.tribeName} style={{ width: 144, height: 144, objectFit: 'cover', borderRadius: 24, border: '4px solid var(--color-surface)' }} />
            ) : (
              <div
                style={{
                  width: 144, height: 144,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)',
                  fontWeight: 800, fontSize: 48, borderRadius: 24,
                  border: '4px solid var(--color-surface)'
                }}
              >
                {tribe.tribeName?.[0] || 'T'}
              </div>
            )}

            <div className="flex flex-col gap-2" style={{ width: '100%', marginTop: 12 }}>
              {isLoggedIn && !isMember && (
                <button className="btn btn-primary btn-sm" onClick={() => { setIsBouncing(true); setTimeout(() => setIsBouncing(false), 200); joinMutation.mutate(); }} disabled={joinMutation.isPending} style={{ transform: isBouncing ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={14} /> {t('tribe.join')}
                </button>
              )}
              {isLoggedIn && isMember && !isLeader && (
                <button className="btn btn-outline btn-sm" onClick={() => { setIsBouncing(true); setTimeout(() => setIsBouncing(false), 200); leaveMutation.mutate(); }} disabled={leaveMutation.isPending} style={{ transform: isBouncing ? 'scale(1.15)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LogOut size={14} /> {t('tribe.leave')}
                </button>
              )}
              {isLoggedIn && isLeader && (
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/tribe/settings?tribeId=' + tribeId)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Settings size={14} /> {t('tribe.management')}
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ height: 1, background: 'var(--color-border)', width: '100%' }} />
          <div className="profile-stats-grid" style={{ width: '100%', marginTop: 8 }}>
            <div className="profile-stat-box">
              <span className="profile-stat-value">{tribe.tribePoint?.toLocaleString('tr-TR') ?? 0}</span>
              <span className="profile-stat-label">{t('profile.points')}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">{tribe.memberCount ?? 0}</span>
              <span className="profile-stat-label">{t('tribe.member_count_label')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tribe Modifiers (Only for Leaders usually) ─── */}
      {(tribe.personalityModifier || tribe.instructionModifier) && (
        <div style={{ marginTop: 24, marginBottom: 8 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, paddingBottom: 12, borderBottom: '1px solid var(--color-border)', marginBottom: 16 }}>
            {t('tribe.features')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {tribe.personalityModifier && (
              <div className="lb-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                  <Sparkles size={18} />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('tribe.personality_modifier')}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6, fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                  "{tribe.personalityModifier}"
                </div>
                {/* Decorative background element */}
                <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04, color: 'var(--color-primary)', pointerEvents: 'none' }}>
                  <Sparkles size={120} />
                </div>
              </div>
            )}

            {tribe.instructionModifier && (
              <div className="lb-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                  <Terminal size={18} />
                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('tribe.instruction_modifier')}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.6, fontFamily: 'monospace', background: 'var(--color-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', position: 'relative', zIndex: 1 }}>
                  {tribe.instructionModifier}
                </div>
                {/* Decorative background element */}
                <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.04, color: 'var(--color-primary)', pointerEvents: 'none' }}>
                  <Terminal size={120} />
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ─── Members List ─── */}
      <h3 style={{ fontSize: 18, fontWeight: 700, paddingBottom: 8, borderBottom: '1px solid var(--color-border)', marginTop: 16 }}>
        {t('tribe.members')} ({tribe.tribeMemberships?.length ?? 0})
      </h3>

      <div className="flex-col gap-2">
        {tribe.tribeMemberships?.length === 0 ? (
          <p className="empty-state">{t('tribe.no_members')}</p>
        ) : (
          tribe.tribeMemberships?.map(member => (
            member.actor ? (
              <div key={member.actor.actorId} className="lb-card flex items-center justify-between" style={{ padding: '8px 16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActorMinimalCard actor={member.actor} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="badge" style={{ background: member.roleName === 'TribeLeader' ? 'var(--color-primary-light)' : 'var(--color-surface-3)', color: member.roleName === 'TribeLeader' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                    {member.roleName === 'TribeLeader' ? t('tribe.leader') : member.roleName || t('tribe.member')}
                  </span>
                </div>
              </div>
            ) : null
          ))
        )}
      </div>

      {/* ─── Posts Section ─── */}
      <div className="profile-tabs-container" style={{ marginTop: 24 }}>
        <div className="profile-tab-group">
          <button className="profile-tab-btn active" style={{ cursor: 'default' }}>
            {t('profile.posts')} ({tribe.postCount ?? 0})
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn btn-outline btn-sm"
            disabled={postsPage === 1 || isPostsLoading}
            onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
            style={{ padding: '4px 8px' }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            {t('profile.page')} {postsPage} / {Math.max(1, Math.ceil((tribe.postCount || 0) / inferredPerPage))}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={postsPage >= Math.ceil((tribe.postCount || 0) / inferredPerPage) || isPostsLoading}
            onClick={() => setPostsPage((p) => p + 1)}
            style={{ padding: '4px 8px' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ minHeight: 400, marginTop: 16 }}>
        {isPostsLoading ? (
          <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} />
        ) : !postsData || postsData.length === 0 ? (
          <p className="empty-state">{t('tribe.empty_posts')}</p>
        ) : (
          <div className="flex-col gap-4">
            {postsData.map((p) => (
              <PostCard key={p.contentItemId} {...p} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
