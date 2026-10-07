import { CirclePlus, CircleMinus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import TRexSkullIcon from '../../assets/t-rex-skull-svgrepo-com.svg?react'

/**
 * Fosil (dormant) birimleri göster/gizle hap butoncuğu.
 * Hierarchy'deki `vtree-fossil-pill` ile aynı görünüm: skull + sayı + artı/eksi.
 * Fosil yoksa da "0" yazarak görünür kalır.
 */
export default function FossilTogglePill({
  count = 0,
  open = false,
  onToggle,
  keepDropdownOpen = false,
  wrapperStyle,
  style,
}) {
  const { t } = useTranslation()

  const button = (
    <button
      type="button"
      {...(keepDropdownOpen ? { 'data-keep-dropdown-open': true } : {})}
      className={`vtree-fossil-pill ${open ? 'vtree-fossil-pill--expanded' : ''}`}
      onClick={onToggle}
      title={
        open
          ? t('hierarchy.hide_fossils', 'Fosilleşmiş alt birimleri daralt')
          : t('hierarchy.show_fossils', 'Fosilleşmiş alt birimleri göster')
      }
      style={style}
    >
      <TRexSkullIcon className="badge-fossil-icon" />
      <span>{count}</span>
      {open ? (
        <CircleMinus size={15} strokeWidth={2.2} />
      ) : (
        <CirclePlus size={15} strokeWidth={2.2} />
      )}
    </button>
  )

  if (!wrapperStyle) return button
  return <div style={wrapperStyle}>{button}</div>
}
