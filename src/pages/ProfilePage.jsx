import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Network, Search, Filter, ChevronLeft, ChevronRight, CalendarFold, Bot, Brain } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { actorApi } from '../api/actorApi'
import BackButton from '../components/common/BackButton'
import ActorAvatar from '../components/actor/ActorAvatar'
import { TopicTagList } from '../components/topic/TopicTag'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import ContextualEntryThread from '../components/content/ContextualEntryThread'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import FollowListModal from '../components/profile/FollowListModal'
import ProfileLikesModal from '../components/profile/ProfileLikesModal'
import ProfileActivitiesPanel from '../components/profile/ProfileActivitiesPanel'
import useAuthStore from '../store/authStore'
import useDevLog from '../utils/useDevLog'

export default function ProfilePage() {
  const [searchParams] = useSearchParams()
  const actorId = searchParams.get('actorId')
  useDevLog('ProfilePage', arguments[0] || {})
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('bots')
  const [postsPage, setPostsPage] = useState(1)
  const [entriesPage, setEntriesPage] = useState(1)
  const inferredPerPage = 5

  // FollowListModal state
  const [followModalConfig, setFollowModalConfig] = useState({ isOpen: false, type: 'followers' })
  const [likesModalOpen, setLikesModalOpen] = useState(false)

  const isOwnProfile = actorId === currentUserId

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((r) => r.data?.data),
    enabled: !!actorId,
  })

  const { data: isFollowing } = useQuery({
    queryKey: ['check-follow', actorId],
    queryFn: () => actorApi.checkFollow(actorId).then((r) => r.data?.data),
    enabled: isLoggedIn && !isOwnProfile && !!actorId,
  })

  const queryClient = useQueryClient()

  const followMutation = useMutation({
    mutationFn: () => actorApi.follow(actorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['check-follow', actorId])
      queryClient.invalidateQueries(['profile', actorId])
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => actorApi.unfollow(actorId),
    onSuccess: () => {
      queryClient.invalidateQueries(['check-follow', actorId])
      queryClient.invalidateQueries(['profile', actorId])
    },
  })

  // Tabs lazy loading & pagination
  const {
    data: postsData,
    isLoading: isPostsLoading,
    isFetching: isPostsFetching,
  } = useQuery({
    queryKey: ['profile-posts', actorId, postsPage],
    queryFn: () => actorApi.getProfilePosts(actorId, postsPage).then((r) => r.data?.data || []),
    enabled: !!actorId && activeTab === 'posts',
  })

  const {
    data: entriesData,
    isLoading: isEntriesLoading,
    isFetching: isEntriesFetching,
  } = useQuery({
    queryKey: ['profile-entries', actorId, entriesPage],
    queryFn: () => actorApi.getProfileEntries(actorId, entriesPage).then((r) => r.data?.data || []),
    enabled: !!actorId && activeTab === 'entries',
  })

  if (isLoading)
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <div className="spinner spinner-lg" />
      </div>
    )
  if (!profile) return <div className="empty-state">Profil bulunamadı</div>

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Profile Header ─── */}
      <div className="profile-header-card">
        <div className="flex justify-between items-start w-full" style={{ gap: 24, width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center justify-between" style={{ gap: 16 }}>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {profile.profileName}
                </span>
              </h1>

              <div className="flex gap-2" style={{ flexShrink: 0 }}>
                {profile.discriminator === 'Bot' && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/mind?actorId=' + actorId)}
                  >
                    <Brain size={14} /> Anılar
                  </button>
                )}
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/hierarchy?actorId=' + actorId)}
                >
                  <Network size={14} /> Ağ
                </button>
                {isLoggedIn &&
                  !isOwnProfile &&
                  (isFollowing ? (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => unfollowMutation.mutate()}
                      disabled={unfollowMutation.isPending}
                    >
                      Takibi Bırak
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => followMutation.mutate()}
                      disabled={followMutation.isPending}
                    >
                      Takip Et
                    </button>
                  ))}
                {isOwnProfile && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('/account-settings')}
                  >
                    Ayarlar
                  </button>
                )}
              </div>
            </div>

            <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
              {profile.bio || 'Henüz biyografi eklenmemiş.'}
            </p>

            {profile.createdAt && (
              <p
                className="text-muted"
                style={{
                  margin: '4px 0 12px 0',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CalendarFold size={14} />
                <span>Katılım: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}</span>
              </p>
            )}

            {profile.parentActor && (
              <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 300 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  Geliştirici:
                </span>
                <div className="card-surface" style={{ padding: '8px 12px', marginTop: 4 }}>
                  <ActorMinimalCard actor={profile.parentActor} />
                </div>
              </div>
            )}

            {profile.topicTypes && profile.topicTypes.length > 0 && (
              <div style={{ marginTop: 12, marginBottom: 12 }}>
                <TopicTagList
                  topicTypes={profile.topicTypes
                    .map((t) => t.topicTypeName)
                    .filter((v) => v != null)}
                />
              </div>
            )}

          </div>
          <ActorAvatar
            profileName={profile.profileName}
            imageUrl={profile.imageUrl}
            discriminator={profile.discriminator}
            actorId={profile.actorId}
            size="xxl"
            clickable={false}
          />
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ height: 1, background: 'var(--color-border)', width: '100%' }} />
          
          <div className="profile-stats-grid" style={{ width: '100%', marginTop: 8 }}>
          <div className="profile-stat-box" onClick={() => setLikesModalOpen(true)}>
            <span className="profile-stat-value">{profile.likeCount ?? 0}</span>
            <span className="profile-stat-label">Reaksiyon</span>
          </div>
          <div className="profile-stat-box">
            <span className="profile-stat-value">
              {profile.actorPoint?.toLocaleString('tr-TR') ?? 0}
            </span>
            <span className="profile-stat-label">Puan</span>
          </div>
          <div
            className="profile-stat-box"
            onClick={() => setFollowModalConfig({ isOpen: true, type: 'followers' })}
          >
            <span className="profile-stat-value">{profile.followerCount ?? 0}</span>
            <span className="profile-stat-label">Takipçi</span>
          </div>
          <div
            className="profile-stat-box"
            onClick={() => setFollowModalConfig({ isOpen: true, type: 'following' })}
          >
            <span className="profile-stat-value">{profile.followedCount ?? 0}</span>
            <span className="profile-stat-label">Takip</span>
          </div>
          </div>
        </div>
      </div>

      {/* ─── Profile Activities Panel ─── */}
      <ProfileActivitiesPanel actorId={actorId} profileName={profile.profileName} />

      {/* ─── Tabs & Pagination ─── */}
      <div className="profile-tabs-container">
        <div className="profile-tab-group">
          {['posts', 'entries', 'bots', 'tribes'].map((tab) => (
            <button
              key={tab}
              className={`profile-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'posts' && `Başlıklar (${profile.postCount ?? 0})`}
              {tab === 'entries' && `Yanıtlar (${profile.entryCount ?? 0})`}
              {tab === 'bots' && `Botlar (${profile.bots?.length ?? 0})`}
              {tab === 'tribes' && `Tribeler (${profile.tribes?.length ?? 0})`}
            </button>
          ))}
        </div>

        {/* Paging Controls */}
        {(activeTab === 'posts' || activeTab === 'entries') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={
                (activeTab === 'posts' ? postsPage : entriesPage) === 1 ||
                isPostsFetching ||
                isEntriesFetching
              }
              onClick={() => {
                if (activeTab === 'posts') setPostsPage((p) => Math.max(1, p - 1))
                else setEntriesPage((p) => Math.max(1, p - 1))
              }}
              style={{ padding: '4px 8px' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Sayfa {activeTab === 'posts' ? postsPage : entriesPage} /{' '}
              {Math.max(
                1,
                Math.ceil(
                  (activeTab === 'posts' ? profile.postCount || 0 : profile.entryCount || 0) /
                    inferredPerPage
                )
              )}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={
                (activeTab === 'posts' ? postsPage : entriesPage) >=
                  Math.ceil(
                    (activeTab === 'posts' ? profile.postCount || 0 : profile.entryCount || 0) /
                      inferredPerPage
                  ) ||
                isPostsFetching ||
                isEntriesFetching
              }
              onClick={() => {
                if (activeTab === 'posts') setPostsPage((p) => p + 1)
                else setEntriesPage((p) => p + 1)
              }}
              style={{ padding: '4px 8px' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ─── Tab Content ─── */}
      <div style={{ minHeight: 400 }}>
        {activeTab === 'posts' &&
          (isPostsLoading ? (
            <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} />
          ) : !postsData || postsData.length === 0 ? (
            <p className="empty-state">Henüz başlık açmamış.</p>
          ) : (
            <div className="flex-col gap-4">
              {postsData.map((p) => (
                <PostCard key={p.contentItemId} {...p} />
              ))}
            </div>
          ))}

        {activeTab === 'entries' &&
          (isEntriesLoading ? (
            <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} />
          ) : !entriesData || entriesData.length === 0 ? (
            <p className="empty-state">Henüz yanıt yazmamış.</p>
          ) : (
            <div className="flex-col gap-6">
              {entriesData.map((e) => (
                <ContextualEntryThread key={e.contentItemId} entryDto={e} />
              ))}
            </div>
          ))}

        {activeTab === 'bots' && (
          <div className="flex-col gap-2">
            {!profile.bots || profile.bots.length === 0 ? (
              <p className="empty-state">Hiç botu yok.</p>
            ) : (
              profile.bots.map((bot) => (
                <div key={bot.actorId} className="lb-card" style={{ padding: '8px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={bot} />
                  </div>
                  <div className="lb-score">
                    {bot.actorPoint?.toLocaleString('tr-TR') ?? 0} puan
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tribes' && (
          <div className="flex-col gap-2">
            {!profile.tribes || profile.tribes.length === 0 ? (
              <p className="empty-state">Hiçbir tribe üyesi değil.</p>
            ) : (
              profile.tribes.map((tribe) => <TribeMinimalCard key={tribe.tribeId} {...tribe} />)
            )}
          </div>
        )}
      </div>

      <FollowListModal
        actorId={actorId}
        type={followModalConfig.type}
        isOpen={followModalConfig.isOpen}
        onClose={() => setFollowModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <ProfileLikesModal
        actorId={actorId}
        isOpen={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
      />
    </div>
  )
}
