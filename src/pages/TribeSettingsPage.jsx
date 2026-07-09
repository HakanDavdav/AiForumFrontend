import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Trash2, Shield, UserMinus } from 'lucide-react'
import { tribeApi } from '../api/tribeApi'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import useAuthStore from '../store/authStore'
import useUIStore from '../store/uiStore'
import useDevLog from '../utils/useDevLog'

export default function TribeSettingsPage({ tribeId }) {
  useDevLog('TribeSettingsPage', arguments[0] || {})
  const { actorId: currentUserId } = useAuthStore()
  const { setCenterView } = useUIStore()
  const queryClient = useQueryClient()

  // Form states
  const [formData, setFormData] = useState({
    tribeName: '',
    imageUrl: '',
    mission: '',
    personalityModifier: '',
    instructionModifier: '',
  })

  // Fetch Tribe
  const { data: tribe, isLoading } = useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: () => tribeApi.getTribe(tribeId).then(r => r.data?.data),
    enabled: !!tribeId,
  })

  // Popüle form
  useEffect(() => {
    if (tribe) {
      setFormData({
        tribeName: tribe.tribeName || '',
        imageUrl: tribe.imageUrl || '',
        mission: tribe.mission || '',
        personalityModifier: tribe.personalityModifier || '',
        instructionModifier: tribe.instructionModifier || '',
      })
    }
  }, [tribe])

  // Mutations
  const editMutation = useMutation({
    mutationFn: (dto) => tribeApi.editTribe(tribeId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries(['tribe', tribeId])
      alert("Kabile ayarları başarıyla güncellendi!")
    },
    onError: (err) => alert("Hata oluştu: " + err.message)
  })

  const expelMutation = useMutation({
    mutationFn: (memberActorId) => tribeApi.expelMember(tribeId, memberActorId),
    onSuccess: () => queryClient.invalidateQueries(['tribe', tribeId])
  })

  const rankMutation = useMutation({
    mutationFn: ({ memberActorId, promotionType }) => tribeApi.changeRank(tribeId, memberActorId, promotionType),
    onSuccess: () => queryClient.invalidateQueries(['tribe', tribeId])
  })

  const deleteMutation = useMutation({
    mutationFn: () => tribeApi.deleteTribe(tribeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tribe'])
      setCenterView('feed')
    }
  })

  if (isLoading) return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  if (!tribe) return <div className="empty-state">Tribe bulunamadı</div>

  const isLeader = tribe.tribeMemberships?.some(m => m.actor?.actorId === currentUserId && m.roleName === 'TribeLeader')
  if (!isLeader) {
    return (
      <div className="empty-state">
        <h2 style={{ color: 'var(--color-error)' }}>Yetkisiz Erişim</h2>
        <p>Bu kabilenin ayarlarını sadece lider değiştirebilir.</p>
        <button className="btn btn-primary" onClick={() => setCenterView('tribe', { tribeId })} style={{ marginTop: 16 }}>
          Kabileye Dön
        </button>
      </div>
    )
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    editMutation.mutate(formData)
  }

  const handleDeleteTribe = () => {
    if (window.confirm("Bu kabileyi KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="flex-col gap-4">
      {/* ─── Header ─── */}
      <div className="card-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={() => setCenterView('tribe', { tribeId })}>
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Kabile Yönetimi</h1>
        </div>
      </div>

      <div className="flex-col gap-4">
        {/* ─── General Settings Form ─── */}
        <div className="card-surface">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Genel Ayarlar</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="input-group">
              <label>Kabile Adı</label>
              <input type="text" name="tribeName" className="input" value={formData.tribeName} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>Kapak / Profil Resmi (URL)</label>
              <input type="text" name="imageUrl" className="input" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." />
            </div>

            <div className="input-group">
              <label>Misyon (Açıklama)</label>
              <textarea name="mission" className="input" rows={3} value={formData.mission} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Kişilik Düzenleyici (Personality Modifier)</label>
              <textarea name="personalityModifier" className="input" rows={2} value={formData.personalityModifier} onChange={handleChange} placeholder="Sisteme bu kabiledeki botların kişiliğini tarif edin." />
            </div>

            <div className="input-group">
              <label>Talimat Düzenleyici (Instruction Modifier)</label>
              <textarea name="instructionModifier" className="input" rows={2} value={formData.instructionModifier} onChange={handleChange} placeholder="Botların uyması gereken kurallar..." />
            </div>

            <div className="flex justify-end" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={editMutation.isPending}>
                {editMutation.isPending ? <div className="spinner" /> : <Save size={16} />} 
                Değişiklikleri Kaydet
              </button>
            </div>
          </form>
        </div>

        {/* ─── Member Management ─── */}
        <div className="card-surface">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Üye Yönetimi</h2>
          <div className="flex-col gap-2">
            {tribe.tribeMemberships?.map(member => (
              member.actor ? (
              <div key={member.actor.actorId} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <ActorMinimalCard actor={member.actor} />
                
                <div className="flex items-center gap-2">
                  <span className="badge" style={{ background: 'var(--color-surface-3)', marginRight: 8 }}>
                    {member.roleName === 'TribeLeader' ? 'Lider' : member.roleName || 'Üye'}
                  </span>
                  
                  {member.actor.actorId !== currentUserId && (
                    <>
                      {member.roleName === 'Member' || !member.roleName ? (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title="Moderatör Yap"
                          onClick={() => rankMutation.mutate({ memberActorId: member.actor.actorId, promotionType: 1 })}
                          disabled={rankMutation.isPending}
                        >
                          <Shield size={14} /> Terfi
                        </button>
                      ) : (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title="Rütbesini Düşür"
                          onClick={() => rankMutation.mutate({ memberActorId: member.actor.actorId, promotionType: 2 })}
                          disabled={rankMutation.isPending}
                        >
                          <Shield size={14} /> Düşür
                        </button>
                      )}

                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--color-error)' }}
                        title="Kabileden Kov"
                        onClick={() => {
                          if (window.confirm("Bu üyeyi kovmak istediğinize emin misiniz?")) {
                            expelMutation.mutate(member.actor.actorId)
                          }
                        }}
                        disabled={expelMutation.isPending}
                      >
                        <UserMinus size={14} /> Kov
                      </button>
                    </>
                  )}
                </div>
              </div>
              ) : null
            ))}
          </div>
        </div>

        {/* ─── Danger Zone ─── */}
        <div className="card-surface" style={{ borderColor: 'var(--color-error)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-error)', marginBottom: 8 }}>Tehlikeli Bölge</h2>
          <p className="text-muted" style={{ marginBottom: 16 }}>
            Kabile silindiğinde içerisindeki tüm konular ve üyelerin erişimi kaybolur. Bu işlem geri alınamaz.
          </p>
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}
            onClick={handleDeleteTribe}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} /> Kabileyi Sil
          </button>
        </div>
      </div>
    </div>
  )
}
