import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Network, Search, Filter, ChevronLeft, ChevronRight, CalendarFold, Bot, Brain, Edit2, Check, X, Settings, UserPlus, UserMinus } from 'lucide-react'
import toast from 'react-hot-toast'
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
import useMyEntitiesStore from '../store/myEntitiesStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'

const TOPIC_TYPES = [
  { value: 1, enumName: 'Politics', label: 'Politika' },
  { value: 2, enumName: 'Economy', label: 'Ekonomi' },
  { value: 4, enumName: 'WorldNews', label: 'Dünya Haberleri' },
  { value: 8, enumName: 'LocalNews', label: 'Yerel Haberler' },
  { value: 16, enumName: 'Trending', label: 'Trend Başlıklar' },
  { value: 32, enumName: 'Technology', label: 'Teknoloji' },
  { value: 64, enumName: 'Science', label: 'Bilim' },
  { value: 128, enumName: 'AI', label: 'Yapay Zeka' },
  { value: 256, enumName: 'Space', label: 'Uzay' },
  { value: 512, enumName: 'Health', label: 'Sağlık' },
  { value: 1024, enumName: 'Sports', label: 'Spor' },
  { value: 2048, enumName: 'Entertainment', label: 'Eğlence' },
  { value: 4096, enumName: 'Gaming', label: 'Oyun' },
  { value: 8192, enumName: 'Celebrity', label: 'Ünlüler' },
  { value: 16384, enumName: 'Lifestyle', label: 'Yaşam Tarzı' },
  { value: 32768, enumName: 'Education', label: 'Eğitim' },
  { value: 65536, enumName: 'Relationships', label: 'İlişkiler' },
]

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
  const { t } = useTranslation()

  // Follow State & Debounce
  const myFollowData = useMyEntitiesStore(state => state.myFollowData)
  const addFollowing = useMyEntitiesStore(state => state.addFollowing)
  const removeFollowing = useMyEntitiesStore(state => state.removeFollowing)

  const globalIsFollowing = myFollowData?.following?.includes(actorId)
  const [localIsFollowing, setLocalIsFollowing] = useState(globalIsFollowing)
  const debounceTimerRef = useRef(null)
  const [isBouncing, setIsBouncing] = useState(false)

  useEffect(() => {
    setLocalIsFollowing(globalIsFollowing)
  }, [globalIsFollowing])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // FollowListModal state
  const [followModalConfig, setFollowModalConfig] = useState({ isOpen: false, type: 'followers' })
  const [likesModalOpen, setLikesModalOpen] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ profileName: '', bio: '', topicTypes: [] })

  const toggleTopic = (value) => {
    setEditForm(prev => ({
      ...prev,
      topicTypes: prev.topicTypes.includes(value)
        ? prev.topicTypes.filter(v => v !== value)
        : [...prev.topicTypes, value]
    }))
  }

  const isOwnProfile = actorId === currentUserId

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((r) => r.data?.data),
    enabled: !!actorId,
  })

  const queryClient = useQueryClient()

  const followMutation = useMutation({
    mutationFn: () => actorApi.follow(actorId),
    onSuccess: () => {
      addFollowing(actorId)
      queryClient.invalidateQueries({ queryKey: ['profile', actorId] })
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => actorApi.unfollow(actorId),
    onSuccess: () => {
      removeFollowing(actorId)
      queryClient.invalidateQueries({ queryKey: ['profile', actorId] })
    },
  })

  const handleFollowClick = () => {
    setIsBouncing(true)
    setTimeout(() => setIsBouncing(false), 200)

    const newStatus = !localIsFollowing
    setLocalIsFollowing(newStatus)

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(() => {
      if (newStatus === globalIsFollowing) return

      if (newStatus) {
        followMutation.mutate()
      } else {
        unfollowMutation.mutate()
      }
    }, 600)
  }

  const editMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    onSuccess: () => {
      toast.success(t('profile.update_success'))
      setIsEditing(false)
      queryClient.invalidateQueries(['profile', actorId])
    },
    onError: (err) => {
      const errMsgs = err.response?.data?.error?.errors || [t('profile.error_occurred')]
      errMsgs.forEach(m => toast.error(m))
    }
  })

  const handleEditInit = () => {
    const initialTopics = []
    if (profile?.topicTypes) {
      profile.topicTypes.forEach(t => {
        if (!t?.topicTypeName) return;
        const match = TOPIC_TYPES.find(opt => opt.enumName === t.topicTypeName || opt.label === t.topicTypeName)
        if (match) initialTopics.push(match.value)
      })
    }
    setEditForm({
      profileName: profile?.profileName || '',
      bio: profile?.bio || '',
      topicTypes: initialTopics
    })
    setIsEditing(true)
  }

  const handleEditSave = () => {
    if (!editForm.bio.trim()) {
      toast.error(t('profile.bio_empty_error'))
      return
    }
    const payload = {
      userId: actorId,
      profileName: editForm.profileName,
      imageUrl: profile?.imageUrl || '',
      bio: editForm.bio,
      topicTypes: editForm.topicTypes,
      entryPerPage: profile?.entryPerPage || 50,
      postPerPage: profile?.postPerPage || 20,
      socialNotificationPreference: profile?.socialNotificationPreference ?? true,
      socialEmailPreference: profile?.socialEmailPreference ?? true
    }
    editMutation.mutate(payload)
  }

  useEffect(() => {
    if (isOwnProfile && profile && searchParams.get('edit') === 'true' && !isEditing) {
      handleEditInit()
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('edit')
      navigate({ search: newParams.toString() }, { replace: true })
    }
  }, [profile, isOwnProfile, searchParams, isEditing, navigate])

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
  if (!profile) return <div className="empty-state">{t('profile.not_found')}</div>

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Profile Header ─── */}
      <div className="profile-header-card">
        <div className="flex justify-between" style={{ gap: 20, width: '100%', alignItems: 'stretch' }}>

          {/* ─── LEFT COLUMN ─── */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', paddingBottom: 4 }}>
            <div className="flex items-center" style={{ gap: 16 }}>
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
                {isEditing ? (
                  <input
                    type="text"
                    style={{
                      flex: 1, maxWidth: 300, fontSize: 18,
                      padding: '8px 16px',
                      borderRadius: 12,
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                    value={editForm.profileName}
                    onChange={(e) => setEditForm(f => ({ ...f, profileName: e.target.value }))}
                  />
                ) : (
                  <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {profile.profileName}
                  </span>
                )}
              </h1>
            </div>

            {isEditing ? (
              <textarea
                style={{
                  margin: '8px 0', width: '100%', maxWidth: 600, minHeight: 80, fontSize: 14,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  resize: 'vertical'
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                value={editForm.bio}
                onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                placeholder={t('profile.bio_placeholder')}
              />
            ) : (
              <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
                {profile.bio || t('profile.no_bio')}
              </p>
            )}

            {profile.createdAt && !isEditing && (
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
                <span>{t('profile.joined')} {new Date(profile.createdAt).toLocaleDateString(currentUserId === actorId ? undefined : 'tr-TR')}</span>
              </p>
            )}

            {profile.parentActor && !isEditing && (
              <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 300 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('profile.developer')}
                </span>
                <div className="lb-card" style={{ padding: '8px 16px', marginTop: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={profile.parentActor} />
                  </div>
                </div>
              </div>
            )}

            {isEditing ? (
              <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 600 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                  {t('profile.interests')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {TOPIC_TYPES.map(topic => {
                    const isSelected = editForm.topicTypes.includes(topic.value);
                    return (
                      <label key={topic.value} style={{
                        display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                        background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        transition: 'all 0.2s ease',
                        userSelect: 'none'
                      }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTopic(topic.value)}
                          style={{ display: 'none' }}
                        />
                        {t(`topics.${topic.enumName.toLowerCase()}`)}
                      </label>
                    )
                  })}
                </div>
              </div>
            ) : (
              profile.topicTypes && profile.topicTypes.length > 0 && (
                <div style={{ marginTop: 12, marginBottom: 12 }}>
                  <TopicTagList
                    topicTypes={profile.topicTypes
                      .map((t) => {
                        const match = TOPIC_TYPES.find(opt => opt.enumName === t?.topicTypeName || opt.label === t?.topicTypeName);
                        return match ? match.value : null;
                      })
                      .filter((v) => v != null)}
                  />
                </div>
              )
            )}

            <div style={{ flexGrow: 1 }} />

            <div className="flex flex-wrap gap-2" style={{ paddingTop: 16 }}>
              {profile.discriminator === 'Bot' && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('/mind?actorId=' + actorId)}
                >
                  <Brain size={14} /> {t('profile.memories')}
                </button>
              )}
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/hierarchy?actorId=' + actorId)}
              >
                <Network size={14} /> {t('profile.network')}
              </button>
            </div>
          </div>

          {/* ─── VERTICAL DIVIDER ─── */}
          <div style={{ width: 2, background: 'var(--color-border)', marginTop: 8, marginBottom: 8, borderRadius: 2 }} />

          {/* ─── RIGHT COLUMN ─── */}
          <div style={{ width: 144, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 4 }}>
            <ActorAvatar
              profileName={profile.profileName}
              imageUrl={profile.imageUrl}
              discriminator={profile.discriminator}
              actorId={profile.actorId}
              size="xxxl"
              clickable={false}
            />

            <div className="flex flex-col gap-2" style={{ width: '100%', marginTop: 12 }}>
              {isLoggedIn && !isOwnProfile && (
                <button
                  className={`btn btn-sm ${localIsFollowing ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleFollowClick}
                  style={{
                    transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {localIsFollowing ? (
                    <><UserMinus size={14} /> {t('profile.unfollow')}</>
                  ) : (
                    <><UserPlus size={14} /> {t('profile.follow')}</>
                  )}
                </button>
              )}
              {isOwnProfile && !isEditing && (
                <>
                  <button className="btn btn-primary btn-sm" onClick={handleEditInit} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Edit2 size={14} /> {t('profile.edit')}
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/account-settings')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Settings size={14} /> {t('profile.security_settings')}
                  </button>
                </>
              )}
              {isOwnProfile && isEditing && (
                <>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ background: 'var(--color-success)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={handleEditSave}
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending ? <div className="spinner spinner-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Check size={14} />} {t('profile.save')}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(false)}
                    disabled={editMutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <X size={14} /> {t('profile.cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ width: '100%' }}>
          <div style={{ height: 1, background: 'var(--color-border)', width: '100%' }} />

          <div className="profile-stats-grid" style={{ width: '100%', marginTop: 8 }}>
            <div className="profile-stat-box" onClick={() => setLikesModalOpen(true)}>
              <span className="profile-stat-value">{profile.likeCount ?? 0}</span>
              <span className="profile-stat-label">{t('profile.reaction')}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">
                {profile.actorPoint?.toLocaleString('tr-TR') ?? 0}
              </span>
              <span className="profile-stat-label">{t('profile.points')}</span>
            </div>
            <div
              className="profile-stat-box"
              onClick={() => setFollowModalConfig({ isOpen: true, type: 'followers' })}
            >
              <span className="profile-stat-value">{profile.followerCount ?? 0}</span>
              <span className="profile-stat-label">{t('profile.followers')}</span>
            </div>
            <div
              className="profile-stat-box"
              onClick={() => setFollowModalConfig({ isOpen: true, type: 'following' })}
            >
              <span className="profile-stat-value">{profile.followedCount ?? 0}</span>
              <span className="profile-stat-label">{t('profile.following')}</span>
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
              {tab === 'posts' && `${t('profile.posts')} (${profile.postCount ?? 0})`}
              {tab === 'entries' && `${t('profile.entries')} (${profile.entryCount ?? 0})`}
              {tab === 'bots' && `${t('profile.bots')} (${profile.bots?.length ?? 0})`}
              {tab === 'tribes' && `${t('profile.tribes')} (${profile.tribes?.length ?? 0})`}
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
              {t('profile.page')} {activeTab === 'posts' ? postsPage : entriesPage} /{' '}
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
            <p className="empty-state">{t('profile.no_posts')}</p>
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
            <p className="empty-state">{t('profile.no_entries')}</p>
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
              <p className="empty-state">{t('profile.no_bots')}</p>
            ) : (
              profile.bots.map((bot) => (
                <div key={bot.actorId} className="lb-card" style={{ padding: '8px 16px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActorMinimalCard actor={bot} showPoint={true} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tribes' && (
          <div className="flex-col gap-2">
            {!profile.tribes || profile.tribes.length === 0 ? (
              <p className="empty-state">{t('profile.no_tribes')}</p>
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
