import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Network, Search, Filter, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import ActorAvatar from '../components/actor/ActorAvatar'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import TribeMinimalCard from '../components/tribe/TribeMinimalCard'
import FollowListModal from '../components/profile/FollowListModal'
import ProfileLikesModal from '../components/profile/ProfileLikesModal'
import ProfileActivitiesPanel from '../components/profile/ProfileActivitiesPanel'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

export default function ProfilePage({ actorId }) {
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const { setCenterView, goBack } = useUIStore()
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
    queryFn: () => actorApi.getProfile(actorId).then(r => r.data?.data),
    enabled: !!actorId,
  })

  // Tabs lazy loading & pagination
  const { data: postsData, isLoading: isPostsLoading, isFetching: isPostsFetching } = useQuery({
    queryKey: ['profile-posts', actorId, postsPage],
    queryFn: () => actorApi.getProfilePosts(actorId, postsPage).then(r => r.data?.data || []),
    enabled: !!actorId && activeTab === 'posts',
  })

  const { data: entriesData, isLoading: isEntriesLoading, isFetching: isEntriesFetching } = useQuery({
    queryKey: ['profile-entries', actorId, entriesPage],
    queryFn: () => actorApi.getProfileEntries(actorId, entriesPage).then(r => r.data?.data || []),
    enabled: !!actorId && activeTab === 'entries',
  })

  if (isLoading) return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  if (!profile) return <div className="empty-state">Profil bulunamadı</div>

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2">
        <button className="btn-icon" onClick={goBack}>
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* ─── Profile Header ─── */}
      <div className="card-surface" style={{ position: 'relative' }}>
        <div className="flex gap-4">
          <ActorAvatar 
            profileName={profile.profileName} 
            imageUrl={profile.imageUrl} 
            discriminator={profile.discriminator}
            actorId={profile.actorId}
            size="xl" 
            clickable={false}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center justify-between">
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {profile.profileName}
                {profile.discriminator === 'Bot' && (
                  <span className="badge badge-bot">Bot</span>
                )}
              </h1>
              
              <div className="flex gap-2">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setCenterView('hierarchy', { actorId })}
                >
                  <Network size={14} /> Ağ
                </button>
                {isLoggedIn && !isOwnProfile && (
                  <button className="btn btn-primary btn-sm">Takip Et</button>
                )}
                {isOwnProfile && (
                  <button className="btn btn-outline btn-sm" onClick={() => setCenterView('account-settings')}>
                    Ayarlar
                  </button>
                )}
              </div>
            </div>

            <p className="text-muted" style={{ margin: '8px 0', lineHeight: 1.5, maxWidth: 600 }}>
              {profile.bio || 'Henüz biyografi eklenmemiş.'}
            </p>

            <div className="flex items-center gap-6" style={{ marginTop: 16 }}>
              <div 
                className="flex-col" 
                style={{ cursor: 'pointer' }}
                onClick={() => setLikesModalOpen(true)}
              >
                <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.likeCount ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reaksiyon</span>
              </div>
              <div className="flex-col">
                <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.actorPoint?.toLocaleString('tr-TR') ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Puan</span>
              </div>
              <div 
                className="flex-col" 
                style={{ cursor: 'pointer' }}
                onClick={() => setFollowModalConfig({ isOpen: true, type: 'followers' })}
              >
                <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.followerCount ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Takipçi</span>
              </div>
              <div 
                className="flex-col" 
                style={{ cursor: 'pointer' }}
                onClick={() => setFollowModalConfig({ isOpen: true, type: 'following' })}
              >
                <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.followedCount ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Takip</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Profile Activities Panel ─── */}
      <ProfileActivitiesPanel actorId={actorId} />

      {/* ─── Tabs & Pagination ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {['posts', 'entries', 'bots', 'tribes'].map(tab => (
             <button 
               key={tab}
               className={`btn btn-ghost`}
               style={{ 
                 borderRadius: 0, paddingBottom: 12, borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                 color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: activeTab === tab ? 600 : 500
               }}
               onClick={() => setActiveTab(tab)}
             >
               {tab === 'posts' && `Konular (${profile.postCount ?? 0})`}
               {tab === 'entries' && `Yanıtlar (${profile.entryCount ?? 0})`}
               {tab === 'bots' && `Botlar (${profile.botModules?.length ?? 0})`}
               {tab === 'tribes' && `Tribeler (${profile.tribeModules?.length ?? 0})`}
             </button>
          ))}
        </div>

        {/* Paging Controls */}
        {(activeTab === 'posts' || activeTab === 'entries') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={(activeTab === 'posts' ? postsPage : entriesPage) === 1 || isPostsFetching || isEntriesFetching}
              onClick={() => {
                if (activeTab === 'posts') setPostsPage(p => Math.max(1, p - 1))
                else setEntriesPage(p => Math.max(1, p - 1))
              }}
              style={{ padding: '4px 8px' }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)' }}>
              Sayfa {activeTab === 'posts' ? postsPage : entriesPage} / {Math.max(1, Math.ceil((activeTab === 'posts' ? (profile.postCount || 0) : (profile.entryCount || 0)) / inferredPerPage))}
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={(activeTab === 'posts' ? postsPage : entriesPage) >= Math.ceil((activeTab === 'posts' ? (profile.postCount || 0) : (profile.entryCount || 0)) / inferredPerPage) || isPostsFetching || isEntriesFetching}
              onClick={() => {
                if (activeTab === 'posts') setPostsPage(p => p + 1)
                else setEntriesPage(p => p + 1)
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
        {activeTab === 'posts' && (
          isPostsLoading ? <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} /> :
          postsData?.length === 0 ? <p className="empty-state">Henüz konu açmamış.</p> :
          <div className="flex-col gap-4">{postsData.map(p => <PostCard key={p.contentItemId} {...p} />)}</div>
        )}

        {activeTab === 'entries' && (
          isEntriesLoading ? <div className="spinner spinner-md" style={{ margin: '40px auto', display: 'block' }} /> :
          entriesData?.length === 0 ? <p className="empty-state">Henüz yanıt yazmamış.</p> :
          <div className="flex-col gap-4">{entriesData.map(e => <EntryCard key={e.contentItemId} {...e} />)}</div>
        )}

        {activeTab === 'bots' && (
          <div className="flex-col gap-2">
            {profile.botModules?.length === 0 ? <p className="empty-state">Hiç botu yok.</p> :
             profile.botModules.map(bot => (
               <div 
                 key={bot.actorId} 
                 className="lb-card" 
                 style={{ padding: '8px 16px' }}
               >
                 <div style={{ flex: 1, minWidth: 0 }}>
                   <ActorMinimalCard actor={bot} />
                 </div>
                 <div className="lb-score">{bot.actorPoint?.toLocaleString('tr-TR') ?? 0} puan</div>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'tribes' && (
          <div className="flex-col gap-2">
            {profile.tribeModules?.length === 0 ? <p className="empty-state">Hiçbir tribe üyesi değil.</p> :
             profile.tribeModules.map(tribe => (
               <TribeMinimalCard key={tribe.tribeId} {...tribe} />
             ))}
          </div>
        )}
      </div>

      <FollowListModal 
        actorId={actorId}
        type={followModalConfig.type}
        isOpen={followModalConfig.isOpen}
        onClose={() => setFollowModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      <ProfileLikesModal
        actorId={actorId}
        isOpen={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
      />
    </div>
  )
}
