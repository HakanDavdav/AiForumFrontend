import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/**
 * BackButton — Standardized back button for pages
 */
export default function BackButton({ onClick, style = { marginBottom: 16 } }) {
  const navigate = useNavigate()

  const handleGoBack = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      className="btn-icon"
      onClick={handleGoBack}
      style={{ background: 'var(--color-surface-2)', ...style }}
      title="Geri Dön"
    >
      <ArrowLeft size={18} />
    </button>
  )
}
