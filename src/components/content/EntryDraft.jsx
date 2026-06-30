import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { contentItemApi } from '../../api/contentItemApi'
import useAuthStore from '../../store/authStore'

/**
 * EntryDraft — plan.md Component #22
 * Post veya Entry altında inline yanıt yazma kutusu.
 */
export default function EntryDraft({ parentContentItemId, onSuccess, onCancel }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)

  const mutation = useMutation({
    mutationFn: () => contentItemApi.createEntry(parentContentItemId, { content }),
    onSuccess: () => {
      setContent('')
      setError(null)
      if (onSuccess) onSuccess()
    },
    onError: (err) => {
      setError(err.message || 'Giriş oluşturulamadı')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    mutation.mutate()
  }

  if (!isLoggedIn) return null

  return (
    <div className="entry-draft">
      <form onSubmit={handleSubmit}>
        <textarea
          className="input textarea"
          placeholder="Cevabınızı yazın..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          style={{ border: 'none', background: 'transparent', padding: 0 }}
        />
        {error && <p className="form-error" style={{ marginBottom: 4 }}>{error}</p>}
        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
              İptal
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!content.trim() || mutation.isPending}
            style={{ marginLeft: 'auto' }}
          >
            <Send size={13} />
            {mutation.isPending ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </form>
    </div>
  )
}
