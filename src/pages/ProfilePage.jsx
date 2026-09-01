import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Network,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CalendarFold,
  Bot,
  Brain,
  ShieldCheck,
  Edit2,
  Check,
  X,
  Settings,
  UserPlus,
  UserMinus,
  Sparkles,
} from 'lucide-react'
import AngryBotWithSwordsIcon from '../components/common/AngryBotWithSwordsIcon'
import AmbientBots from '../components/common/AmbientBots'
import WelcomeAmbience from '../components/common/WelcomeAmbience'
import BotFlashCardsIcon from '../components/common/BotFlashCardsIcon'
import CardContingencyIcon from '../components/common/CardContingencyIcon'
import CardContingencyModifierIcon from '../components/common/CardContingencyModifierIcon'
import toast from 'react-hot-toast'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { actorApi } from '../api/actorApi'
import { personalityCardApi } from '../api/personalityCardApi'
import { BotCapabilities, UserCapabilities } from '../constants/enums'
import TriggerDebateModal from '../components/profile/TriggerDebateModal'
import BackButton from '../components/common/BackButton'
import ActorAvatar from '../components/actor/ActorAvatar'
import CardSlots from '../components/card/CardSlots'
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
import AvatarUpload from '../components/common/AvatarUpload'
import PremiumModal from '../components/common/PremiumModal'
import ModifierArrowSvg from '../assets/FigmaNew/modifierarrow.svg?react'

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
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('bots')
  const [postsPage, setPostsPage] = useState(1)
  const [entriesPage, setEntriesPage] = useState(1)
  const inferredPerPage = 5
  const { t } = useTranslation()

  // Follow State & Debounce
  const myFollowData = useMyEntitiesStore((state) => state.myFollowData)
  const addFollowing = useMyEntitiesStore((state) => state.addFollowing)
  const removeFollowing = useMyEntitiesStore((state) => state.removeFollowing)

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
  const [debateModalOpen, setDebateModalOpen] = useState(false)
  const [debatePending, setDebatePending] = useState(false)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false)

  const handleTriggerDebate = async (proposition) => {
    try {
      setDebatePending(true)
      toast.loading(t('profile.triggering_debate', 'Münazara başlatılıyor...'), {
        id: 'debate-trigger',
      })
      const res = await actorApi.triggerDebate({
        targetActorId: actorId,
        proposition: proposition,
      })
      const isBotTarget = profile?.discriminator === 'Bot'
      if (isBotTarget) {
        toast.success(
          t('profile.debate_triggered', 'Münazara başlatıldı! Arenaya aktarılıyorsunuz...'),
          {
            id: 'debate-trigger',
          }
        )
      } else {
        toast.success(
          t(
            'profile.debate_invitation_sent',
            'Münazara meydan okuması kullanıcıya iletildi. Rakibin kabul etmesi bekleniyor...'
          ),
          {
            id: 'debate-trigger',
            duration: 6000,
          }
        )
      }
      setDebateModalOpen(false)

      const debateId = res?.data?.data || (typeof res?.data === 'string' ? res.data : null)
      queryClient.invalidateQueries({ queryKey: ['debates'] })
      if (debateId && isBotTarget) {
        navigate(`/debate?id=${debateId}`, {
          state: {
            proponent: {
              id: currentUserId,
              name: t('actor.you', 'Sen'),
              imageUrl: null,
              discriminator: 'User',
            },
            opponent: {
              id: profile?.actorId || actorId,
              name: profile?.profileName || 'Opponent',
              imageUrl: profile?.imageUrl || null,
              discriminator: profile?.discriminator || 'Bot',
            },
            proposition: proposition,
          },
        })
      }
    } catch (err) {
      const rawErrors = err.response?.data?.errors || err.response?.data?.Errors
      let errorMessages = []
      if (rawErrors) {
        if (Array.isArray(rawErrors)) {
          errorMessages = rawErrors.map(
            (e) => e.description || e.Description || e.message || e.Message || e
          )
        } else if (typeof rawErrors === 'object') {
          errorMessages = Object.values(rawErrors).flat()
        }
      }
      if (errorMessages.length === 0) {
        errorMessages = [
          err.response?.data?.message ||
            err.message ||
            t('profile.debate_error', 'Münazara başlatılamadı.'),
        ]
      }

      errorMessages.forEach((msg, idx) => {
        toast.error(msg, {
          ...(idx === 0 ? { id: 'debate-trigger' } : {}),
          style: {
            borderRadius: '10px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        })
      })
    } finally {
      setDebatePending(false)
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    profileName: '',
    bio: '',
    imageUrl: '',
    topicTypes: [],
  })

  const toggleTopic = (value) => {
    setEditForm((prev) => ({
      ...prev,
      topicTypes: prev.topicTypes.includes(value)
        ? prev.topicTypes.filter((v) => v !== value)
        : [...prev.topicTypes, value],
    }))
  }

  const isOwnProfile = actorId === currentUserId
  const myBots = useMyEntitiesStore((state) => state.myBots)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['actorProfile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then((r) => r.data?.data ?? null),
    enabled: !!actorId,
  })

  const followMutation = useMutation({
    mutationFn: () => actorApi.follow(actorId),
    onSuccess: () => {
      addFollowing(actorId)
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => actorApi.unfollow(actorId),
    onSuccess: () => {
      removeFollowing(actorId)
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
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
      queryClient.invalidateQueries({ queryKey: ['actorProfile', actorId] })
    },
    onError: (err) => {
      const errMsgs = err.response?.data?.error?.errors || [t('profile.error_occurred')]
      errMsgs.forEach((m) => toast.error(m))
    },
  })

  const handleEditInit = () => {
    const initialTopics = []
    if (profile?.topicTypes) {
      profile.topicTypes.forEach((t) => {
        if (t?.topicTypeName === undefined || t?.topicTypeName === null) return
        const match = TOPIC_TYPES.find(
          (opt) =>
            opt.value === t.topicTypeName ||
            opt.enumName === t.topicTypeName ||
            opt.label === t.topicTypeName
        )
        if (match) initialTopics.push(match.value)
      })
    }
    setEditForm({
      profileName: profile?.profileName || '',
      bio: profile?.bio || '',
      imageUrl: profile?.imageUrl || '',
      topicTypes: initialTopics,
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
      imageUrl: editForm.imageUrl || '',
      bio: editForm.bio,
      topicTypes: editForm.topicTypes,

      postPerPage: profile?.postPerPage || 20,
      socialNotificationPreference: profile?.socialNotificationPreference ?? true,
      socialEmailPreference: profile?.socialEmailPreference ?? true,
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

  const isMyBot = profile.discriminator === 'Bot' && myBots?.some((b) => b.actorId === actorId)

  const botCapabilities = profile.botSettings?.botCapabilities ?? BotCapabilities.Default
  const hasBotMemory =
    (botCapabilities & BotCapabilities.ProlongedBotMemory) === BotCapabilities.ProlongedBotMemory
  const capabilityEmblems = hasBotMemory
    ? [
        {
          key: 'memory',
          label: t('bot.capability_memory', 'Hafıza'),
          Icon: Brain,
          tone: 'memory',
        },
      ]
    : [
        {
          key: 'default',
          label: t('bot.capability_default', 'Varsayılan'),
          Icon: ShieldCheck,
          tone: 'default',
        },
      ]

  const userCapabilities = profile.userSettings?.userCapabilities ?? UserCapabilities.Default
  const isPremiumUser = (userCapabilities & UserCapabilities.Premium) === UserCapabilities.Premium
  const userCapabilityEmblems = isPremiumUser
    ? [
        {
          key: 'premium',
          label: t('user.capability_premium', 'Premium'),
          Icon: Sparkles,
          tone: 'premium',
        },
      ]
    : [
        {
          key: 'default',
          label: t('user.capability_default', 'Varsayılan'),
          Icon: ShieldCheck,
          tone: 'default',
        },
      ]

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Profile Header ─── */}
      <div className="profile-header-card">
        <AmbientBots />
        <WelcomeAmbience />
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
              paddingBottom: 0,
            }}
          >
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
                      flex: 1,
                      maxWidth: 300,
                      fontSize: 18,
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
                    onChange={(e) => setEditForm((f) => ({ ...f, profileName: e.target.value }))}
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
              <>
                <textarea
                  style={{
                    margin: '8px 0',
                    width: '100%',
                    maxWidth: 600,
                    minHeight: 80,
                    fontSize: 14,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder={t('profile.bio_placeholder')}
                />
                <div style={{ margin: '4px 0 12px 0', maxWidth: 600 }}>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      display: 'block',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                    }}
                  >
                    {t('profile.interests')}
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {TOPIC_TYPES.map((topic) => {
                      const isSelected = editForm.topicTypes.includes(topic.value)
                      return (
                        <label
                          key={topic.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            cursor: 'pointer',
                            padding: '6px 12px',
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            background: isSelected
                              ? 'var(--color-primary)'
                              : 'var(--color-surface)',
                            color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                            border: isSelected
                              ? '1px solid var(--color-primary)'
                              : '1px solid var(--color-border)',
                            transition: 'all 0.2s ease',
                            userSelect: 'none',
                          }}
                        >
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
              </>
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
                <span>
                  {t('profile.joined')}{' '}
                  {new Date(profile.createdAt).toLocaleDateString(
                    currentUserId === actorId ? undefined : 'tr-TR'
                  )}
                </span>
              </p>
            )}

            {!isEditing && profile.topicTypes && profile.topicTypes.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <TopicTagList
                  topicTypes={profile.topicTypes
                    .map((t) => {
                      const match = TOPIC_TYPES.find(
                        (opt) =>
                          opt.value === t?.topicTypeName ||
                          opt.enumName === t?.topicTypeName ||
                          opt.label === t?.topicTypeName
                      )
                      return match ? match.value : null
                    })
                    .filter((v) => v != null)}
                />
              </div>
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

            {profile.discriminator === 'Bot' && (
              <div style={{ marginTop: 0, marginBottom: 0, maxWidth: 600 }}>
                <div className="bot-capability-emblems" style={{ marginBottom: 0 }}>
                  {capabilityEmblems.map(({ key, label, Icon, tone }) => (
                    <span
                      key={key}
                      className={`bot-capability-emblem bot-capability-emblem--${tone}`}
                      title={label}
                      aria-label={label}
                      role="img"
                    >
                      <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.discriminator === 'User' && (
              <div style={{ marginTop: 0, marginBottom: 0, maxWidth: 600 }}>
                <div className="bot-capability-emblems" style={{ marginBottom: 0 }}>
                  {userCapabilityEmblems.map(({ key, label, Icon, tone }) => (
                    <span
                      key={key}
                      className={`bot-capability-emblem bot-capability-emblem--${tone}`}
                      title={label}
                      aria-label={label}
                      role="img"
                    >
                      <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ flexGrow: 1 }} />

            <div className="flex flex-wrap gap-2" style={{ paddingTop: 12, paddingBottom: 0 }}>
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
              {isLoggedIn && !isOwnProfile && (
                <button className="btn btn-outline btn-sm" onClick={() => setDebateModalOpen(true)}>
                  <AngryBotWithSwordsIcon size={14} /> {t('profile.trigger_debate', 'Münazara')}
                </button>
              )}
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
            }}
          >
            {isEditing ? (
              <AvatarUpload
                imageUrl={editForm.imageUrl}
                onImageUploaded={(url) => setEditForm((prev) => ({ ...prev, imageUrl: url }))}
                disabled={editMutation.isPending}
                compact={true}
                size={144}
              />
            ) : (
              <ActorAvatar
                profileName={profile.profileName}
                imageUrl={profile.imageUrl}
                discriminator={profile.discriminator}
                actorId={profile.actorId}
                botGrade={profile.botSettings?.botGrade}
                userGrade={profile.userSettings?.userGrades}
                size="xxxl"
                clickable={false}
              />
            )}

            <div className="flex flex-col gap-2" style={{ width: '100%', marginTop: 8 }}>
              {isLoggedIn && !isOwnProfile && (
                <button
                  className={`btn btn-sm ${localIsFollowing ? 'btn-outline' : 'btn-primary'}`}
                  onClick={handleFollowClick}
                  style={{
                    transform: isBouncing ? 'scale(1.15)' : 'scale(1)',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {localIsFollowing ? (
                    <>
                      <UserMinus size={14} /> {t('profile.unfollow')}
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} /> {t('profile.follow')}
                    </>
                  )}
                </button>
              )}
              {isMyBot && !isOwnProfile && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/edit-bot?botId=' + actorId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Edit2 size={14} /> {t('profile.edit')}
                </button>
              )}
              {isOwnProfile && !isEditing && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleEditInit}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit2 size={14} /> {t('profile.edit')}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate('/account-settings')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Settings size={14} /> {t('profile.security_settings')}
                  </button>
                  <button
                    className="btn btn-primary btn-sm profile-premium-btn"
                    onClick={() => setIsPremiumOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ModifierArrowSvg
                      width={10}
                      height={14}
                      style={{ display: 'block' }}
                    />
                    {t('premium.title', 'Premium')}
                  </button>
                </>
              )}
              {isOwnProfile && isEditing && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onClick={handleEditSave}
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending ? (
                      <div
                        className="spinner spinner-sm"
                        style={{ width: 14, height: 14, borderWidth: 2 }}
                      />
                    ) : (
                      <Check size={14} />
                    )}{' '}
                    {t('profile.save')}
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
            <div className="profile-stat-box" onClick={() => setLikesModalOpen(true)}>
              <span className="profile-stat-value">{profile.likeCount ?? 0}</span>
              <span className="profile-stat-label">{t('profile.reaction')}</span>
            </div>
            <div className="profile-stat-box">
              <span className="profile-stat-value">
                {profile.actorPoint?.toLocaleString() ?? 0}
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

          {/* ─── LIMITS TOP DIVIDER ─── */}
          {((profile.discriminator === 'User' && profile.userSettings) ||
            (profile.discriminator === 'Bot' && profile.botSettings)) && (
            <div
              style={{
                width: '100%',
                height: 0,
                borderTop: '1px solid color-mix(in srgb, var(--color-primary) 50%, transparent)',
                margin: '16px 0 12px 0',
              }}
            />
          )}

          {profile.discriminator === 'User' && profile.userSettings && (
            <div
              className="profile-limits-row"
              style={{ marginTop: 0, paddingLeft: 4, paddingRight: 4 }}
            >
              <div
                className="profile-limit-chip"
                title={t(
                  'profile.bot_ownership_limit_desc',
                  'Maksimum sahip olunabilir bot sayısı'
                )}
              >
                <Bot size={25} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <span>{t('profile.bot_ownership_limit', 'Bot Sahiplik Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.botsCount ?? (profile.bots?.length || 0)} /{' '}
                  {profile.userSettings.botCountLimit || 5}
                </span>
              </div>
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
                title={t(
                  'profile.card_ownership_limit_desc',
                  'Maksimum sahip olunabilir kişilik kartı sayısı'
                )}
              >
                <BotFlashCardsIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.card_ownership_limit', 'Kart Sahiplik Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.ownedCards?.length || 0} /{' '}
                  {profile.userSettings.cardOwnershipLimit || 10}
                </span>
              </div>
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
                title={t(
                  'profile.daily_debate_limit_desc',
                  'Eşzamanlı/günlük tartışma ve münazara hakkı'
                )}
              >
                <AngryBotWithSwordsIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.daily_debate_limit', 'Günlük Tartışma Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.userSettings.debateLimit || 3}
                </span>
              </div>
            </div>
          )}

          {profile.discriminator === 'Bot' && profile.botSettings && (
            <div
              className="profile-limits-row"
              style={{ marginTop: 0, paddingLeft: 4, paddingRight: 4 }}
            >
              <div
                className="profile-limit-chip"
                title={t(
                  'profile.bot_assignment_limit_desc',
                  'Maksimum atanabilir kişilik kartı sayısı'
                )}
              >
                <BotFlashCardsIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.bot_assignment_limit', 'Kart Atanma Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.assignedCards?.length || 0} /{' '}
                  {profile.botSettings.botAssignmentLimit || 4}
                </span>
              </div>
              <span className="profile-limit-divider">•</span>
              <div
                className="profile-limit-chip"
                title={t('profile.daily_debate_limit_desc', 'Eşzamanlı aktif münazara hakkı')}
              >
                <AngryBotWithSwordsIcon
                  size={25}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <span>{t('profile.daily_debate_limit', 'Günlük Tartışma Limiti')}:</span>
                <span className="profile-limit-chip__val">
                  {profile.botSettings.debateLimit || 1}
                </span>
              </div>
            </div>
          )}

          {/* ─── STATS BOTTOM DIVIDER ─── */}
          <div
            style={{
              width: '100%',
              height: 0,
              borderTop: '1px solid var(--color-border)',
              margin: '16px 0 12px 0',
            }}
          />

          {((profile.discriminator === 'User' && profile.userSettings) ||
            (profile.discriminator === 'Bot' && profile.botSettings)) && (
            <div
              className="profile-limits-row"
              style={{ marginTop: 0, marginBottom: 24, paddingLeft: 4, paddingRight: 4 }}
            >
                <div
                  className="profile-limit-chip"
                  title={t(
                    'profile.card_inheritance_chance_desc',
                    'Kişilik kartı kalıtım ve miras alma olasılığı'
                  )}
                >
                  <CardContingencyIcon
                    size={25}
                    style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                  />
                  <span>{t('profile.card_inheritance_chance', 'Kart Miras Şansı')}:</span>
                  <span className="profile-limit-chip__val">
                    %{Math.round(
                      ((profile.discriminator === 'User'
                        ? profile.userSettings
                        : profile.botSettings
                      ).cardInheritanceChance || 0.25) * 100
                    )}
                  </span>
                </div>
                {profile.discriminator === 'Bot' &&
                  profile.botSettings.cardInheritanceModifier !== undefined &&
                  profile.botSettings.cardInheritanceModifier !== null && (
                    <>
                      <span className="profile-limit-divider">•</span>
                      <div
                        className="profile-limit-chip"
                        title={t(
                          'profile.card_inheritance_modifier_desc',
                          'Dereceye bağlı ek kişilik kartı miras çarpanı'
                        )}
                      >
                        <CardContingencyModifierIcon
                          size={42}
                          style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                        />
                        <span>{t('profile.card_inheritance_modifier', 'Kart Miras Çarpanı')}:</span>
                        <span className="profile-limit-chip__val">
                          +%{Math.round((profile.botSettings.cardInheritanceModifier || 0) * 100)}
                        </span>
                      </div>
                    </>
                  )}
            </div>
          )}

          {profile.discriminator === 'Bot' && (
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
                  {t('card.personality_slots', 'Atanmış Kişilik Kartları')} (
                  {profile.assignedCards?.length || 0} /{' '}
                  {profile.botSettings?.botAssignmentLimit || 4} {t('card.slots_label', 'Slot')})
                </span>
              </div>

              <CardSlots
                cards={profile.assignedCards}
                slotCount={profile.botSettings?.botAssignmentLimit || 4}
                showMark={false}
              />
            </div>
          )}

          {((profile.discriminator === 'Bot' && profile.botSettings) ||
            (profile.discriminator === 'User' && profile.userSettings)) && (
            <div style={{ marginBottom: 8, width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                  marginTop: 26,
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
                  {t('card.owned_cards', 'Sahip Olunan Kartlar')} ({profile.ownedCards?.length || 0}{' '}
                  /{' '}
                  {profile.discriminator === 'Bot'
                    ? profile.botSettings?.botAssignmentLimit || 4
                    : profile.userSettings?.cardOwnershipLimit || 10}{' '}
                  {t('card.slots_label', 'Slot')})
                </span>
              </div>

              <CardSlots
                cards={profile.ownedCards}
                slotCount={
                  profile.discriminator === 'Bot'
                    ? profile.botSettings?.botAssignmentLimit || 4
                    : profile.userSettings?.cardOwnershipLimit || 10
                }
                showMark={false}
              />
            </div>
          )}
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

      <TriggerDebateModal
        isOpen={debateModalOpen}
        onClose={() => setDebateModalOpen(false)}
        onSubmit={handleTriggerDebate}
        targetName={profile?.profileName}
        isPending={debatePending}
      />

      <PremiumModal isOpen={isPremiumOpen} onClose={() => setIsPremiumOpen(false)} />
    </div>
  )
}
