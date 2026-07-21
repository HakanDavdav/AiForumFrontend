import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Edit3,
  Loader2,
  MessageSquare,
  CheckCircle,
  PenTool,
  PenSquare,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import { contentItemApi } from '../../api/contentItemApi'
import { TopicTypes } from '../../constants/TopicTypes'
import useMyEntitiesStore from '../../store/myEntitiesStore'
import useDevLog from '../../utils/useDevLog'
import { useTranslation } from 'react-i18next'

export default function CreateEditPostPage() {
  useDevLog('CreateEditPostPage', arguments[0] || {})
  const [searchParams] = useSearchParams()
  const postId = searchParams.get('postId')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  // If postId is provided, we are in Edit mode
  const isEditMode = Boolean(postId)

  const myTribes = useMyEntitiesStore(s => s.myTribes)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topicTypes: [],
    tribeId: '',
  })

  // Fetch existing data if in Edit Mode
  const { data: existingPost, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => contentItemApi.getPost(postId).then((res) => res.data?.data),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (isEditMode && existingPost) {
      setFormData({
        title: existingPost.title || '',
        content: existingPost.content || '',
        topicTypes: existingPost.topicTypes || [],
        tribeId: existingPost.tribeId || '',
      })
    }
  }, [isEditMode, existingPost])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditMode ? contentItemApi.editPost(postId, data) : contentItemApi.createPost(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      queryClient.invalidateQueries({ queryKey: ['contentitem', postId] })

      setTimeout(() => {
        const newPostId = isEditMode
          ? postId
          : typeof res.data?.data === 'string'
            ? res.data?.data
            : res.data?.data?.postId || res.data?.data?.contentItemId || res.data?.data?.id
        if (newPostId) {
          navigate('/post?postId=' + newPostId)
        } else {
          navigate('/')
        }
      }, 1000)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      tribeId: formData.tribeId ? formData.tribeId : null
    }
    mutation.mutate(payload)
  }

  const handleTopicToggle = (value) => {
    setFormData((prev) => {
      const exists = prev.topicTypes.includes(value)
      if (exists) {
        return { ...prev, topicTypes: prev.topicTypes.filter((t) => t !== value) }
      } else {
        return { ...prev, topicTypes: [...prev.topicTypes, value] }
      }
    })
  }

  const canSubmit =
    formData.title.trim().length > 3 && formData.content.trim().length > 10 && !mutation.isPending

  if (isEditMode && isLoadingExisting) {
    return (
      <div className="flex justify-center" style={{ padding: 40 }}>
        <Loader2
          size={32}
          style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }}
        />
      </div>
    )
  }

  return (
    <div className="flex-col gap-4">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          {isEditMode ? <Edit3 size={22} color="#fff" /> : <PenSquare size={22} color="#fff" />}
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            {isEditMode ? t('post.edit_title') : t('post.start_new_topic')}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {isEditMode
              ? t('post.edit_topic_desc')
              : t('post.start_new_topic_desc')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Tribe Selection */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('post.tribe_selection')}
          </label>
          <select
            value={formData.tribeId}
            onChange={(e) => setFormData({ ...formData, tribeId: e.target.value })}
            disabled={mutation.isPending || mutation.isSuccess || isEditMode}
            style={{
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
              boxSizing: 'border-box',
            }}
          >
            <option value="">{t('post.global')}</option>
            {myTribes?.map(t => (
              <option key={t.tribeId} value={t.tribeId}>{t.tribeName}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('post.title_label')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              required
              placeholder={t('post.title_placeholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
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
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>
        </div>

        {/* Content */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 8,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('post.content_label')} <span style={{ color: 'var(--color-primary)' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              rows={8}
              required
              placeholder={t('post.content_placeholder')}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              disabled={mutation.isPending || mutation.isSuccess}
              style={{
                width: '100%',
                resize: 'vertical',
                minHeight: 150,
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                fontSize: 14,
                lineHeight: 1.65,
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--color-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--color-border)')}
            />
          </div>
        </div>

        {/* Topic Tags */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              marginBottom: 10,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}
          >
            {t('post.categories_optional')}
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TopicTypes.map((topic) => {
              const isSelected = formData.topicTypes.includes(topic.value)
              return (
                <div
                  key={topic.value}
                  onClick={() => {
                    if (!mutation.isPending && !mutation.isSuccess) {
                      handleTopicToggle(topic.value)
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: mutation.isPending || mutation.isSuccess ? 'default' : 'pointer',
                    background: isSelected
                      ? 'var(--color-primary)'
                      : 'var(--color-surface-raised, var(--color-surface))',
                    color: isSelected ? '#fff' : 'var(--color-text-secondary)',
                    border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    transition: 'all 0.2s',
                    boxShadow: isSelected
                      ? '0 2px 8px rgba(var(--color-primary-rgb, 99,102,241), 0.25)'
                      : 'none',
                  }}
                >
                  {topic.label}
                </div>
              )
            })}
          </div>
        </div>

        {/* Success message */}
        {mutation.isSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              marginTop: 8,
            }}
          >
            <CheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 500 }}>
              {isEditMode
                ? t('post.success_update')
                : t('post.success_create')}
            </span>
          </div>
        )}

        {/* Error message */}
        {mutation.isError && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              marginTop: 8,
            }}
          >
            <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 500 }}>
              {mutation.error?.response?.data?.errors?.[0] || t('common.error')}
            </span>
          </div>
        )}

        {/* Submit button */}
        <div style={{ marginTop: 32 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!canSubmit || mutation.isSuccess}
            style={{
              width: '100%',
              padding: '13px 24px',
              fontSize: 14,
              fontWeight: 600,
              gap: 8,
              borderRadius: 12,
              opacity: !canSubmit || mutation.isSuccess ? 0.5 : 1,
              cursor: !canSubmit || mutation.isSuccess ? 'not-allowed' : 'pointer',
            }}
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {t('auth.processing')}
              </>
            ) : (
              <>{isEditMode ? t('action.update') : t('action.share')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
