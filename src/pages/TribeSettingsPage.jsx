import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Trash2, Shield, UserMinus, Settings, Users, Loader2, CheckCircle } from 'lucide-react'
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

  // Populate form
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
      queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] })
    },
    onError: (err) => alert(t('common.error_occurred') + err.message)
  })

  const expelMutation = useMutation({
    mutationFn: (memberActorId) => tribeApi.expelMember(tribeId, memberActorId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] })
  })

  const rankMutation = useMutation({
    mutationFn: ({ memberActorId, promotionType }) => tribeApi.changeRank(tribeId, memberActorId, promotionType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tribe', tribeId] })
  })

  const deleteMutation = useMutation({
    mutationFn: () => tribeApi.deleteTribe(tribeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tribe'] })
      navigate('/')
    }
  })

  if (isLoading) return <div className="flex justify-center" style={{ padding: 40 }}><Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} /></div>
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

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1.5px solid var(--color-border)',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    marginBottom: 8,
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  }

  const canSubmit = formData.tribeName.trim().length > 2 && !editMutation.isPending

  return (
    <div className="flex-col gap-4">
      
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton onClick={() => navigate('/tribe?tribeId=' + tribeId)} style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div className="page-header-icon">
          <Settings size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {t('tribe_settings.title')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {t('tribe_settings.title_desc', 'Kabilenizin genel ayarlarını ve üyelerini buradan yönetebilirsiniz.')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <div>
          <label style={labelStyle}>
            {t('tribe_settings.tribe_name')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              name="tribeName"
              required
              value={formData.tribeName}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {t('tribe_settings.cover_image')}
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              name="imageUrl"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {t('tribe_settings.mission')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea 
              name="mission"
              rows={3}
              value={formData.mission}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 100, lineHeight: 1.65 }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {t('tribe_settings.personality')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea 
              name="personalityModifier"
              rows={2}
              placeholder={t('tribe_settings.personality_placeholder')}
              value={formData.personalityModifier}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.65 }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>
            {t('tribe_settings.instruction')}
          </label>
          <div style={{ position: 'relative' }}>
            <textarea 
              name="instructionModifier"
              rows={2}
              placeholder={t('tribe_settings.instruction_placeholder')}
              value={formData.instructionModifier}
              onChange={handleChange}
              disabled={editMutation.isPending}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.65 }}
              onFocus={e => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
        </div>

        {/* Success message */}
        {editMutation.isSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 10,
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            marginTop: 8,
          }}>
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>
              {t('tribe_settings.success_update')}
            </span>
          </div>
        )}

        {/* Submit button */}
        <div style={{ marginTop: 16 }}>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: !canSubmit ? 0.5 : 1,
              cursor: !canSubmit ? 'not-allowed' : 'pointer',
            }}
          >
            {editMutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>
                <Save size={16} /> {t('action.save_changes')}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Member Management */}
      <div style={{ marginTop: 48 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--color-surface-raised)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
              {t('tribe_settings.member_management')}
            </h2>
          </div>
        </div>

        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 16,
          overflow: 'hidden'
        }}>
          {tribe.tribeMemberships?.map((member, index) => (
            member.actor ? (
            <div 
              key={member.actor.actorId} 
              className="lb-card flex items-center justify-between" 
              style={{ padding: '8px 16px', marginBottom: 8 }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <ActorMinimalCard actor={member.actor} />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="badge" style={{ background: 'var(--color-surface-raised)', marginRight: 8 }}>
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
                      style={{ color: '#ef4444' }}
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

      {/* Danger Zone */}
      <div style={{
        marginTop: 48,
        padding: '24px',
        borderRadius: 16,
        border: '1px solid rgba(239, 68, 68, 0.3)',
        background: 'rgba(239, 68, 68, 0.04)'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', margin: '0 0 8px 0' }}>{t('tribe_settings.danger_zone')}</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>
          {t('tribe_settings.danger_zone_desc')}
        </p>
        <button 
          className="btn btn-primary" 
          style={{ background: '#ef4444', borderColor: '#ef4444', width: '100%', gap: 8, padding: '13px 24px', fontSize: 14, fontWeight: 600, borderRadius: 12 }}
          onClick={handleDeleteTribe}
          disabled={deleteMutation.isPending}
        >
          <Trash2 size={16} /> {t('tribe_settings.delete_tribe')}
        </button>
      </div>

    </div>
  )
}
