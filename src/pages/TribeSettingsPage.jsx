import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Trash2, Shield, UserMinus } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { tribeApi } from '../api/tribeApi'
import BackButton from '../components/common/BackButton'
import ActorMinimalCard from '../components/actor/ActorMinimalCard'
import useAuthStore from '../store/authStore'
import useDevLog from '../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function TribeSettingsPage() {
  const [searchParams] = useSearchParams()
  const tribeId = searchParams.get('tribeId')
  useDevLog('TribeSettingsPage', arguments[0] || {})
  const { actorId: currentUserId } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

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
      alert(t('tribe_settings.success_update'))
    },
    onError: (err) => alert(t('common.error_occurred') + err.message)
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
      navigate('/')
    }
  })

  if (isLoading) return <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner spinner-lg" /></div>
  if (!tribe) return <div className="empty-state">{t('tribe_settings.not_found')}</div>

  const isLeader = tribe.tribeMemberships?.some(m => m.actor?.actorId === currentUserId && m.roleName === 'TribeLeader')
  if (!isLeader) {
    return (
      <div className="empty-state">
        <h2 style={{ color: 'var(--color-error)' }}>{t('tribe_settings.unauthorized')}</h2>
        <p>{t('tribe_settings.unauthorized_desc')}</p>
        <button className="btn btn-primary" onClick={() => navigate('/tribe?tribeId=' + tribeId)} style={{ marginTop: 16 }}>
          {t('tribe_settings.return_to_tribe')}
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
    if (window.confirm(t('tribe_settings.confirm_delete'))) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 8 }}>
        <BackButton onClick={() => navigate('/tribe?tribeId=' + tribeId)} style={{ marginBottom: 0 }} />
      </div>

      {/* ─── Header ─── */}
      <div className="card-surface flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t('tribe_settings.title')}</h1>
        </div>
      </div>

      <div className="flex-col gap-4">
        {/* ─── General Settings Form ─── */}
        <div className="card-surface">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('tribe_settings.general_settings')}</h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="input-group">
              <label>{t('tribe_settings.tribe_name')}</label>
              <input type="text" name="tribeName" className="input" value={formData.tribeName} onChange={handleChange} required />
            </div>

            <div className="input-group">
              <label>{t('tribe_settings.cover_image')}</label>
              <input type="text" name="imageUrl" className="input" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." />
            </div>

            <div className="input-group">
              <label>{t('tribe_settings.mission')}</label>
              <textarea name="mission" className="input" rows={3} value={formData.mission} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>{t('tribe_settings.personality')}</label>
              <textarea name="personalityModifier" className="input" rows={2} value={formData.personalityModifier} onChange={handleChange} placeholder={t('tribe_settings.personality_placeholder')} />
            </div>

            <div className="input-group">
              <label>{t('tribe_settings.instruction')}</label>
              <textarea name="instructionModifier" className="input" rows={2} value={formData.instructionModifier} onChange={handleChange} placeholder={t('tribe_settings.instruction_placeholder')} />
            </div>

            <div className="flex justify-end" style={{ marginTop: 8 }}>
              <button type="submit" className="btn btn-primary" disabled={editMutation.isPending}>
                {editMutation.isPending ? <div className="spinner" /> : <Save size={16} />} 
                {t('action.save_changes')}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Member Management ─── */}
        <div className="card-surface">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('tribe_settings.member_management')}</h2>
          <div className="flex-col gap-2">
            {tribe.tribeMemberships?.map(member => (
              member.actor ? (
              <div key={member.actor.actorId} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)' }}>
                <ActorMinimalCard actor={member.actor} />
                
                <div className="flex items-center gap-2">
                  <span className="badge" style={{ background: 'var(--color-surface-3)', marginRight: 8 }}>
                    {member.roleName === 'TribeLeader' ? t('tribe_settings.leader') : member.roleName || t('tribe_settings.member')}
                  </span>
                  
                  {member.actor.actorId !== currentUserId && (
                    <>
                      {member.roleName === 'Member' || !member.roleName ? (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title={t('tribe_settings.make_moderator')}
                          onClick={() => rankMutation.mutate({ memberActorId: member.actor.actorId, promotionType: 1 })}
                          disabled={rankMutation.isPending}
                        >
                          <Shield size={14} /> {t('tribe_settings.promote')}
                        </button>
                      ) : (
                        <button 
                          className="btn btn-ghost btn-sm" 
                          title={t('tribe_settings.demote_desc')}
                          onClick={() => rankMutation.mutate({ memberActorId: member.actor.actorId, promotionType: 2 })}
                          disabled={rankMutation.isPending}
                        >
                          <Shield size={14} /> {t('tribe_settings.demote')}
                        </button>
                      )}

                      <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ color: 'var(--color-error)' }}
                        title={t('tribe_settings.expel_desc')}
                        onClick={() => {
                          if (window.confirm(t('tribe_settings.confirm_expel'))) {
                            expelMutation.mutate(member.actor.actorId)
                          }
                        }}
                        disabled={expelMutation.isPending}
                      >
                        <UserMinus size={14} /> {t('tribe_settings.expel')}
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
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-error)', marginBottom: 8 }}>{t('tribe_settings.danger_zone')}</h2>
          <p className="text-muted" style={{ marginBottom: 16 }}>
            {t('tribe_settings.danger_zone_desc')}
          </p>
          <button 
            className="btn btn-primary" 
            style={{ background: 'var(--color-error)', borderColor: 'var(--color-error)' }}
            onClick={handleDeleteTribe}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} /> {t('tribe_settings.delete_tribe')}
          </button>
        </div>
      </div>
    </div>
  )
}
