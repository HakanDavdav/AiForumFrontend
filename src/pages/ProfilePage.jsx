import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Network, Search, Filter } from 'lucide-react'
import { actorApi } from '../../api/actorApi'
import ActorAvatar from '../components/actor/ActorAvatar'
import PostCard from '../components/content/PostCard'
import EntryCard from '../components/content/EntryCard'
import ActorChip from '../components/actor/ActorChip'
import TribeCard from '../components/tribe/TribeCard'
import useAuthStore from '../../store/authStore'
import useUIStore from '../../store/uiStore'

export default function ProfilePage({ actorId }) {
  const { actorId: currentUserId, isLoggedIn } = useAuthStore()
  const { setCenterView } = useUIStore()
  const [activeTab, setActiveTab] = useState('posts')

  const isOwnProfile = actorId === currentUserId

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', actorId],
    queryFn: () => actorApi.getProfile(actorId).then(r => r.data?.data),
    enabled: !!actorId,
  })

  // Tabs lazy loading
  const { data: postsData, isLoading: isPostsLoading } = useQuery({
    queryKey: ['profile-posts', actorId],
    queryFn: () => actorApi.getProfilePosts(actorId, 1).then(r => r.data?.data || []),
    enabled: !!actorId && activeTab === 'posts',
  })

  const { data: entriesData, isLoading: isEntriesLoading } = useQuery({
    queryKey: ['profile-entries', actorId],
    queryFn: () => actorApi.getProfileEntries(actorId, 1).then(r => r.data?.data || []),
    enabled: !!actorId && activeTab === 'entries',
  })

  if (isLoading) return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  if (!profile) return <div className="empty-state">Profil bulunamadı</div>

  return (
    <div className="flex-col gap-4">
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
              <div className="flex-col">
                <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.actorPoint?.toLocaleString('tr-TR') ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Puan</span>
              </div>
              <div className="flex-col">
                <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.followerCount ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Takipçi</span>
              </div>
              <div className="flex-col">
                <span style={{ fontSize: 20, fontWeight: 700 }}>{profile.followedCount ?? 0}</span>
                <span className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Takip</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tabs ─── */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--color-border)' }}>
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
             {tab === 'posts' && 'Konular'}
             {tab === 'entries' && 'Yanıtlar'}
             {tab === 'bots' && `Botlar (${profile.botModules?.length ?? 0})`}
             {tab === 'tribes' && `Tribeler (${profile.tribeModules?.length ?? 0})`}
           </button>
        ))}
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
               <div key={bot.actorId} className="card-surface flex items-center justify-between" style={{ padding: 12 }}>
                 <ActorChip actor={bot} />
                 <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{bot.actorPoint ?? 0} P</span>
               </div>
             ))}
          </div>
        )}

        {activeTab === 'tribes' && (
          <div className="flex-col gap-2">
            {profile.tribeModules?.length === 0 ? <p className="empty-state">Hiçbir tribe üyesi değil.</p> :
             profile.tribeModules.map(tribe => (
               <TribeCard key={tribe.tribeId} {...tribe} />
             ))}
          </div>
        )}
      </div>
    </div>
  )
}
