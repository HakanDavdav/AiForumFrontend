import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Network, Search, Filter, ChevronLeft, ChevronRight, CalendarFold, Bot, Brain, Edit2, Check, X, Settings } from 'lucide-react'
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
import useDevLog from '../utils/useDevLog'

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

  const editMutation = useMutation({
    mutationFn: (data) => actorApi.editUser(data),
    onSuccess: () => {
      toast.success('Profil başarıyla güncellendi.')
      setIsEditing(false)
      queryClient.invalidateQueries(['profile', actorId])
    },
    onError: (err) => {
      const errMsgs = err.response?.data?.error?.errors || ['Bir hata oluştu.']
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
      toast.error('Biyografi alanı boş bırakılamaz.')
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
                {isOwnProfile && !isEditing && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={handleEditInit}
                    >
                      <Edit2 size={14} /> Düzenle
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate('/account-settings')}
                    >
                      <Settings size={14} /> Güvenlik Ayarları
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
                      {editMutation.isPending ? <div className="spinner spinner-sm" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Check size={14} />} Kaydet
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setIsEditing(false)}
                      disabled={editMutation.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <X size={14} /> İptal
                    </button>
                  </>
                )}
              </div>
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
                placeholder="Kendinizden bahsedin..."
              />
            ) : (
              <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
                {profile.bio || 'Henüz biyografi eklenmemiş.'}
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
                <span>Katılım: {new Date(profile.createdAt).toLocaleDateString('tr-TR')}</span>
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
                  Geliştirici:
                </span>
                <div className="card-surface" style={{ padding: '8px 12px', marginTop: 4 }}>
                  <ActorMinimalCard actor={profile.parentActor} />
                </div>
              </div>
            )}

            {isEditing ? (
              <div style={{ marginTop: 12, marginBottom: 12, maxWidth: 600 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>
                  İlgi Alanlarınız
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
                        {topic.label}
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
                        return match ? match.label : t?.topicTypeName;
                      })
                      .filter((v) => v != null)}
                  />
                </div>
              )
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
