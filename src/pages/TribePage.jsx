import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LogOut,
  UserPlus,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Brain,
  CalendarFold,
  Users,
  Crown,
} from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tribeApi } from '../api/tribeApi'
import BackButton from '../components/common/BackButton'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import PostCard from '../components/content/PostCard'
import CardSlots from '../components/card/CardSlots'
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
    queryFn: () => tribeApi.getTribe(tribeId).then((r) => r.data?.data),
    enabled: !!tribeId,
  })

  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['tribe-posts', tribeId, postsPage],
    queryFn: () => tribeApi.getTribePosts(tribeId, postsPage).then((res) => res.data?.data),
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

  if (isLoading)
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  if (!tribe) return <div className="empty-state">{t('tribe.not_found')}</div>

  const isMember = tribe.tribeMemberships?.some((m) => m.actor?.actorId === currentUserId)
  const isLeader = tribe.tribeMemberships?.some(
    (m) => m.actor?.actorId === currentUserId && m.roleName === 'TribeLeader'
  )
  const isMyTribe = useMyEntitiesStore.getState().myTribes?.some((t) => t.tribeId === tribeId)

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Tribe Header ─── */}
      <div className="profile-header-card">
        <div
          className="flex justify-between"
          style={{ gap: 20, width: '100%', alignItems: 'stretch', marginBottom: -6 }}
        >
          {/* ─── LEFT COLUMN ─── */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 4,
            }}
          >
            <div>
              <div className="flex items-center" style={{ gap: 16 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{tribe.tribeName}</h1>
              </div>

              <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
                {tribe.mission || t('tribe.no_mission')}
              </p>

              {tribe.createdAt && (
                <p
                  className="text-muted"
                  style={{
                    margin: '4px 0 0 0',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CalendarFold size={14} />
                  <span>
                    {t('tribe.founded')}
                    {new Date(tribe.createdAt).toLocaleDateString('tr-TR')}
                  </span>
                </p>
              )}
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ paddingTop: 16 }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/mind?tribeId=' + tribeId)}
              >
                <Brain size={14} /> {t('tribe.collective_memories', 'Kollektif Anılar')}
              </button>
            </div>
          </div>

          {/* ─── VERTICAL DIVIDER ─── */}
          <div
            style={{
              width: 0,
              borderLeft: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
              marginTop: 0,
              marginBottom: 0,
            }}
          />

          {/* ─── RIGHT COLUMN ─── */}
          <div
            style={{
              width: 144,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: 0,
              position: 'relative'
            }}
          >
            {isMyTribe && (
              <span
                title={t('common.your_tribe', 'Senin Kabilen')}
                style={{
                  position: 'absolute',
                  top: -11,
                  left: -5,
                  color: 'var(--color-warning)',
                  zIndex: 2,
                  filter: 'drop-shadow(0px 3px 4px rgba(0,0,0,0.5))',
                  transform: 'rotate(-15deg)',
                  display: 'flex',
                  pointerEvents: 'auto'
                }}
              >
                <Crown size={40} strokeWidth={2.5} />
              </span>
            )}
            {tribe.imageUrl ? (
              <img
                src={tribe.imageUrl}
                alt={tribe.tribeName}
                style={{
                  width: 144,
                  height: 144,
                  objectFit: 'cover',
                  borderRadius: 24,
                  border: '4px solid var(--color-surface)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 144,
                  height: 144,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary-dark)',
                  fontWeight: 800,
                  fontSize: 48,
                  borderRadius: 24,
                  border: '4px solid var(--color-surface)',
                }}
              >
                {tribe.tribeName?.[0] || 'T'}
              </div>
            )}

            <div className="flex flex-col gap-2" style={{ width: '100%', marginTop: 12 }}>
              {isLoggedIn && !isMember && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setIsBouncing(true)
                    setTimeout(() => setIsBouncing(false), 200)
                    joinMutation.mutate()
                  }}
                  disabled={joinMutation.isPending}
                  style={{
                    transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <UserPlus size={14} /> {t('tribe.join')}
                </button>
              )}
              {isLoggedIn && isMember && !isLeader && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setIsBouncing(true)
                    setTimeout(() => setIsBouncing(false), 200)
                    leaveMutation.mutate()
                  }}
                  disabled={leaveMutation.isPending}
                  style={{
                    transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <LogOut size={14} /> {t('tribe.leave')}
                </button>
              )}
              {isLoggedIn && isLeader && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/tribe/settings?tribeId=' + tribeId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit2 size={14} /> {t('action.edit', 'Düzenle')}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* ─── HORIZONTAL DIVIDER ─── */}
        <div
          style={{
            width: '100%',
            height: 0,
            borderTop: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
            margin: '2px 0 0px 0',
          }}
        />

        {/* ─── BOTTOM MODULE ─── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            paddingBottom: 0,
            marginTop: -16,
          }}
        >
          <div className="profile-stats-grid" style={{ width: '100%' }}>
            <div className="profile-stat-box">
              <span className="profile-stat-value">
                {tribe.tribePoint?.toLocaleString('tr-TR') ?? 0}
              </span>
              <span className="profile-stat-label">{t('profile.points')}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">{tribe.memberCount ?? 0}</span>
              <span className="profile-stat-label">{t('tribe.member_count_label')}</span>
            </div>
          </div>

          {tribe.personalityCards?.length > 0 && (
            <>
              {/* ─── STATS BOTTOM DIVIDER ─── */}
              <div
                style={{
                  width: '100%',
                  height: 0,
                  borderTop: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
                  margin: '16px 0 12px 0',
                }}
              />
              <div style={{ marginBottom: 8, width: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 10,
                    marginTop: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {t('tribe.collective_personality_cards', 'Kollektif Kişilik Kartları')}
                  </span>
                </div>
                <CardSlots
                  cards={tribe.personalityCards}
                  slotCount={tribe.personalityCards.length}
                  showMark={false}
                  tribeBadgeLabel="TRIBE"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ─── Members List ─── */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--color-surface-raised)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: 'var(--color-text-primary)',
              }}
            >
              {t('tribe.members')} ({tribe.tribeMemberships?.length ?? 0})
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-col gap-2">
        {tribe.tribeMemberships?.length === 0 ? (
          <p className="empty-state">{t('tribe.no_members')}</p>
        ) : (
          tribe.tribeMemberships?.map((member) =>
            member.actor ? (
              <div
                key={member.actor.actorId}
                className="lb-card flex items-center justify-between"
                style={{ padding: '8px 16px' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <ActorMinimalCard actor={member.actor} />
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className="badge"
                    style={{ background: 'var(--color-surface-raised)', marginRight: 8 }}
                  >
                    {member.roleName === 'TribeLeader'
                      ? t('tribe.leader')
                      : member.roleName || t('tribe.member')}
                  </span>
                </div>
              </div>
            ) : null
          )
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
            {t('profile.page')} {postsPage} /{' '}
            {Math.max(1, Math.ceil((tribe.postCount || 0) / inferredPerPage))}
          </span>
          <button
            className="btn btn-outline btn-sm"
            disabled={
              postsPage >= Math.ceil((tribe.postCount || 0) / inferredPerPage) || isPostsLoading
            }
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
